function fatal (msg: string = 'unknown error'): Error {
  return new Error(msg)
}

function prefixedBy (prefix: string, ...whole: string[]) {
  for (let w of whole) {
    if (w.substring(0, prefix.length) === prefix) {
      return true
    }
  }
  return false
}

interface TypeOptions {
  name         : string
  priority     : number
  convertable? : string[]
  validate?    : (t: string) => boolean
  evaluate?    : (t: string) => string | number
}

class Type {
  public name        : string
  public priority    : number
  public convertable : string[] = []
  public validate    : (t: string) => boolean         = (t) => true
  public evaluate    : (t: string) => string | number = (t) => t

  constructor (opts: TypeOptions) {
    this.name = opts.name
    this.priority = opts.priority
    if (opts.convertable) {
      this.convertable = opts.convertable
    }
    if (opts.validate) {
      this.validate = opts.validate
    }
    if (opts.evaluate) {
      this.evaluate = opts.evaluate
    }
  }

  toJSON () {
    return {
      name: this.name,
      priority: this.priority,
      convertable: this.convertable.length ? this.convertable : undefined,
    }
  }
}

interface OperatorOptions {
  symbol   : string
  types    : string[]
  aliases? : string[]
}

class Operator {
  public symbol  : string
  public types   : string[]
  public aliases : string[]

  constructor (opts: OperatorOptions) {
    this.symbol = opts.symbol
    this.types = opts.types
    this.aliases = opts.aliases ? opts.aliases : []
  }

  hasAlias (symbol: string) {
    return this.aliases.concat(this.symbol).indexOf(symbol) > -1
  }

  prefixedBy (prefix: string) {
    return prefixedBy(prefix, ...this.aliases.concat(this.symbol))
  }

  toJSON () {
    return {
      symbol: this.symbol,
      types: this.types,
      aliases: this.aliases.length ? this.aliases : undefined,
    }
  }
}

interface FilterOptions {
  name     : string
  type     : string
  aliases? : string[]
}

class Filter {
  public name    : string
  public type    : string
  public aliases : string[]

  constructor (opts: FilterOptions) {
    this.name = opts.name
    this.type = opts.type
    this.aliases = opts.aliases ? opts.aliases : []
  }

  prefixedBy (prefix: string) {
    return prefixedBy(prefix, ...this.aliases.concat(this.name))
  }

  toJSON () {
    return {
      name: this.name,
      type: this.type,
      aliases: this.aliases.length ? this.aliases : undefined,
    }
  }
}

interface MacroOptions {
  template  : string
  type      : string
  resolve   : (...argv: string[]) => string | number
  example   : (tokens: string[]) => string
  priority? : number
}

interface MacroParameter {
  type : 'parameter'
  name : string
}

interface MacroKeyword {
  type    : 'keyword'
  aliases : string[]
}

type MacroAttemptFailure = {
  success : false
  tokens  : RichToken[]
  partial : boolean
}

type MacroAttemptSuccess = {
  success : true
  tokens  : RichToken[]
  type    : string
  value   : string | number
}

class Macro {
  public type     : string
  public template : string
  public syntax   : (MacroParameter | MacroKeyword)[]
  public resolve  : (...argv: string[]) => string | number
  public example  : (tokens: string[]) => string
  public priority : number

  static process (template: string) {
    return Lexer.simpleTokens(template).filter(t => t.type === 'word').map(t => {
      if (t.lexeme[0] === '<') {
        // Parse token as a macro parameter.
        const match = t.lexeme.match(/^<(.+)>$/)
        if (match) {
          return { type: 'parameter', name: match[1] } as MacroParameter
        } else {
          throw fatal(`invalid macro parameter: "${t.lexeme}"`)
        }
      } else if (t.lexeme[0] === '[') {
        // Parse as macro keyword WITH aliases.
        const match = t.lexeme.match(/^\[(\w+(?:\|\w+)*)\]$/)
        if (match) {
          return { type: 'keyword', aliases: match[1].split('|') } as MacroKeyword
        } else {
          throw fatal(`invalid macro keyword: "${t.lexeme}"`)
        }
      } else {
        // Parse as macro keyword WITHOUT aliases.
        return { type: 'keyword', aliases: [ t.lexeme ] } as MacroKeyword
      }
    })
  }

  constructor (opts: MacroOptions) {
    this.type = opts.type
    this.template = opts.template
    this.syntax = Macro.process(opts.template)
    this.resolve = opts.resolve
    this.example = opts.example
    this.priority = opts.priority ? opts.priority : 0
  }

  attempt (lexer: Lexer, grammar: Grammar): MacroAttemptSuccess | MacroAttemptFailure {
    const tokens = [] as RichToken[]
    const argv = [] as (string | number)[]
    for (let templateToken of this.syntax) {
      const realToken = lexer.next()
      if (realToken === null) {
        return {
          success: false,
          tokens,
          partial: argv.length > 0,
        }
      }
      switch (templateToken.type) {
        case 'parameter':
          if (grammar.getType(templateToken.name).validate(realToken.lexeme)) {
            tokens.push(realToken)
            argv.push(realToken.lexeme)
            break
          } else {
            return {
              success: false,
              tokens,
              partial: argv.length > 0,
            }
          }
        case 'keyword':
          if (templateToken.aliases.indexOf(realToken.lexeme) > -1) {
            tokens.push(realToken)
            argv.push(realToken.lexeme)
            break
          } else {
            if (prefixedBy(realToken.lexeme, ...templateToken.aliases)) {
              tokens.push(realToken)
              return {
                success: false,
                tokens,
                partial: true,
              }
            } else {
              return {
                success: false,
                tokens,
                partial: argv.length > 0,
              }
            }
          }
      }
    }

    return {
      success: true,
      tokens,
      type: this.type,
      value: this.resolve.apply(this, argv),
    }
  }

  toJSON () {
    return {
      template: this.template,
      type: this.type,
      priority: this.priority,
    }
  }
}

interface GrammarOptions {
  types?     : TypeOptions[]
  filters?   : FilterOptions[]
  operators? : OperatorOptions[]
  macros?    : MacroOptions[]
}

export class Grammar {
  public types     : Type[]     = []
  public operators : Operator[] = []
  public filters   : Filter[]   = []
  public macros    : Macro[]    = []

  constructor (opts: GrammarOptions = {}) {
    for (let type of opts.types || []) {
      this.newType(type)
    }

    for (let filter of opts.filters || []) {
      this.newFilter(filter)
    }

    for (let operator of opts.operators || []) {
      this.newOperator(operator)
    }

    for (let macro of opts.macros || []) {
      this.newMacro(macro)
    }
  }

  public newType (opts: TypeOptions) {
    if (this.hasType(opts.name)) {
      throw fatal(`redeclared type: "${opts.name}"`)
    }

    for (let t of (opts.convertable || [])) {
      if (this.hasType(t) === false) {
        throw fatal(`referenced unknown type: "${opts.name}"`)
      }
    }

    this.types.push(new Type(opts))
    this.types.sort((a, b) => b.priority - a.priority)
  }

  public hasType (name: string) {
    for (let t of this.types) {
      if (t.name === name) {
        return true
      }
    }
    return false
  }

  public getType (name: string): Type {
    for (let t of this.types) {
      if (t.name === name) {
        return t
      }
    }
    throw fatal(`unknown type: "${name}"`)
  }

  public newOperator (opts: OperatorOptions) {
    this.operators.push(new Operator(opts))
  }

  public hasOperator (symbol: string) {
    for (let o of this.operators) {
      if (o.hasAlias(symbol)) {
        return true
      }
    }
    return false
  }

  public getOperator (symbol: string) {
    for (let o of this.operators) {
      if (o.hasAlias(symbol)) {
        return o
      }
    }
    throw fatal(`unknown operator: "${symbol}"`)
  }

  public newFilter (opts: FilterOptions) {
    this.filters.push(new Filter(opts))
  }

  public hasFilter (name: string) {
    for (let o of this.filters) {
      if (o.name === name) {
        return true
      }
    }
    return false
  }

  public getFilter (name: string) {
    for (let o of this.filters) {
      if (o.name === name) {
        return o
      }
    }
    throw fatal(`unknown filter: "${name}"`)
  }

  public newMacro (opts: MacroOptions) {
    this.macros.push(new Macro(opts))
    this.macros.sort((a, b) => b.priority - a.priority)
  }

  toJSON () {
    return {
      types: this.types,
      filters: this.filters,
      operators: this.operators,
      macros: this.macros,
    }
  }
}

interface SimpleToken {
  type   : 'whitespace' | 'word'
  lexeme : string
  pos    : number
}

interface RichToken {
  type   : 'value' | 'operator' | 'word'
  lexeme : string
  pos    : number
}

class Lexer {
  private stack   : RichToken[]
  private pointer : number = 0
  private stash   : number[] = []

  static simpleTokens (raw: string): SimpleToken[] {
    const tokens = [] as SimpleToken[]
    if (raw.length === 0) {
      return tokens
    }
    let curr = {
      type: (/^\s/.test(raw) ? 'whitespace' : 'word') as 'word' | 'whitespace',
      lexeme: '',
      pos: 0,
    }
    for (let i = 0; i < raw.length; i++) {
      const c = raw[i]
      if (/\s/.test(c)) {
        if (curr.type === 'whitespace') {
          // Was a whitespace token, still is.
          curr.lexeme += c
        } else {
          // Was a word token, now a whitespace token.
          tokens.push(curr)
          curr = {
            type: 'whitespace',
            lexeme: c,
            pos: i,
          }
        }
      } else {
        if (curr.type === 'whitespace') {
          // Was a whitespace token, now a word token.
          tokens.push(curr)
          curr = {
            type: 'word',
            lexeme: c,
            pos: i,
          }
        } else {
          // Was a word token, still is.
          curr.lexeme += c
        }
      }
    }
    tokens.push(curr)
    return tokens
  }

  static richTokens (raw: string, grammar: Grammar): RichToken[] {
    return Lexer.simpleTokens(raw).filter(t => t.type === 'word').map(t => {
      if (grammar.hasType(t.lexeme)) {
        return { type: 'value', lexeme: t.lexeme, pos: t.pos } as RichToken
      } else if (grammar.hasOperator(t.lexeme)) {
        return { type: 'operator', lexeme: t.lexeme, pos: t.pos } as RichToken
      } else {
        return { type: 'word', lexeme: t.lexeme, pos: t.pos } as RichToken
      }
    })
  }

  constructor (raw: string, grammar: Grammar) {
    this.stack = Lexer.richTokens(raw, grammar)
  }

  peek () {
    if (this.stack.length <= this.pointer) {
      return null
    } else {
      return this.stack[this.pointer]
    }
  }

  next () {
    if (this.stack.length <= this.pointer) {
      return null
    } else {
      return this.stack[this.pointer++]
    }
  }

  save () {
    this.stash.push(this.pointer)
  }

  undo () {
    this.pointer = this.stash.pop() as number
  }

  commit () {
    this.stash.pop()
  }
}

class FilterGuess {
  public name : string

  constructor (name: string) {
    this.name = name
  }
}

class OperatorGuess {
  public isPlaceholder : boolean
  public symbol?       : string

  constructor (isPlaceholder: true)
  constructor (isPlaceholder: false, symbol: string)
  constructor (isPlaceholder: boolean, symbol?: string) {
    this.isPlaceholder = isPlaceholder
    this.symbol = symbol
  }
}

class ArgumentGuess {
  public isPlaceholder : boolean
  public type          : string
  public example?      : string
  public weight?       : number

  constructor (isPlaceholder: true, type: string)
  constructor (isPlaceholder: false, type: string, example: string, weight: number)
  constructor (isPlaceholder: boolean, type: string, example?: string, weight?: number) {
    this.isPlaceholder = isPlaceholder
    this.type = type
    this.example = example
    this.weight = weight
  }
}

export class Guess {
  private filter   : FilterGuess
  private operator : OperatorGuess
  private argument : ArgumentGuess

  constructor (filter: FilterGuess, operator: OperatorGuess, argument: ArgumentGuess) {
    this.filter = filter
    this.operator = operator
    this.argument = argument
  }

  name () {
    return this.filter.name
  }

  type () {
    return this.argument.type
  }

  hasSymbol () {
    return this.operator.isPlaceholder === false
  }

  symbol () {
    if (this.operator.isPlaceholder) {
      throw new Error('cannot get symbol')
    }
    return this.operator.symbol as string
  }

  hasExample () {
    return this.argument.isPlaceholder === false
  }

  example () {
    if (this.argument.isPlaceholder) {
      throw new Error('cannot get example')
    }
    return this.argument.example as string
  }

  weight () {
    if (this.hasExample()) {
      return this.argument.weight as number
    } else {
      return 0
    }
  }

  toString (withPlaceholders: boolean = true) {
    let guess = this.name()
    if (this.hasSymbol()) {
      guess += ' ' + this.symbol()
      if (this.hasExample()) {
        return guess + ' ' + this.example()
      } else if (withPlaceholders) {
        return guess + ` <${this.type()}>`
      } else {
        return guess + ' '
      }
    } else if (withPlaceholders) {
      return guess + ` <operator> <${this.type()}>`
    } else {
      return guess + ' '
    }
  }
}

/**
 * The predictor takes the rules described by the Lexer and the Grammar to
 * convert a flat list of tokens into a structured and validated query. A major
 * goal of the predictor is to provide context-sensitive query completions and
 * suggestions based on the type relationships described in the Grammar and
 * based on what the user has already typed.
 *
 * If a user is in the middle of typing a query it makes sense that the query
 * at any given point in time is likely syntactically incomplete. Especially in
 * these cases it's important to give the user recommendations for how to
 * complete the query but these recommendations must always be syntactically
 * and semantically valid completions to the current query.
 *
 *
 * For example, given the incomplete query "created bef" good suggestions might
 * include:
 *
 * - created before <timestamp>
 * - created before "today"
 * - created before "yesterday"
 * - created before "1 week ago"
 *
 * In the example, the query is determined to be invalid as given by the user
 * but the filter "created" is itself valid and thus it can be inferred that
 * the user is partway though typing the "before" operator which is compatible
 * with the "created" filter. The list of completions can then be populated
 * with example arguments with the type "timestamp" to give the user a guide
 * for what they are able to write.
 *
 * However, in the case where the incomplete query is just "cre" good
 * suggestions might include only:
 *
 * - created <operator> <timestamp>
 * - created <operator> <timestamp>
 * - credit <operator> <user>
 *
 * If what the user has typed makes it ambiguous which filter the query should
 * use, wait to expand both the operators and the arguments.
 */

class Oracle {
  static query (lexer: Lexer, grammar: Grammar): Guess[] {
    return Oracle.filter(lexer, grammar)
  }

  // TODO: good grief this function needs to be broken down.
  static filter (lexer: Lexer, grammar: Grammar): Guess[] {
    const advice = [] as Guess[]
    if (lexer.peek() === null) {
      /**
       * The language expected the start of a filter but instead found the end
       * of the query. In this case offer completions representing all possible
       * filters.
       */
      grammar.filters.forEach(f => {
        const filter = new FilterGuess(f.name)
        const operator = new OperatorGuess(true)
        const argument = new ArgumentGuess(true, f.type)
        advice.push(new Guess(filter, operator, argument))
      })
    } else {
      const next = lexer.next() as RichToken
      grammar.filters
        .filter(f => f.prefixedBy(next.lexeme))
        .forEach((f, _, all) => {
          const filter = new FilterGuess(f.name)

          if (all.length > 1) {
            // Since the filter is still ambiguous, do not expand the operators.
            const operator = new OperatorGuess(true)
            const argument = new ArgumentGuess(true, f.type)
            advice.push(new Guess(filter, operator, argument))
            return
          }

          if (lexer.peek() === null) {
            // Nothing more in the query to parse.
            grammar.operators
              .filter(op => op.types.indexOf(f.type) > -1)
              .forEach(op => {
                const operator = new OperatorGuess(false, op.symbol)
                const argument = new ArgumentGuess(true, f.type)
                advice.push(new Guess(filter, operator, argument))
              })
          } else {
            // Parse the operator and then parse the argument.
            const next = lexer.next() as RichToken
            grammar.operators
              .filter(op => op.types.indexOf(f.type) > -1)
              .filter(op => op.prefixedBy(next.lexeme))
              .forEach(op => {
                const operator = new OperatorGuess(false, op.symbol)

                // Macros that return the same type as the filter.
                const worthyMacros = grammar.macros
                  .filter(macro => macro.type === f.type)

                if (lexer.peek() === null) {
                  // If there are not more tokens, suggest all possible macros.
                  worthyMacros
                    .forEach(macro => {
                      const argument = new ArgumentGuess(false, f.type, macro.example([]), 0)
                      advice.push(new Guess(filter, operator, argument))
                    })
                } else {
                  // If there are more tokens, attempt each macro then generate
                  // an example using existing tokens as much as possible.
                  worthyMacros
                    .map(macro => {
                      lexer.save()
                      const attempt = macro.attempt(lexer, grammar)
                      lexer.undo()
                      return { attempt, macro }
                    })
                    .forEach(pair => {
                      const { attempt, macro } = pair
                      const example = macro.example(attempt.tokens.map(t => t.lexeme))
                      const weight = attempt.tokens.reduce((weight, tok) => {
                        return weight + tok.lexeme.length
                      }, 0)
                      const argument = new ArgumentGuess(false, f.type, example, weight)
                      advice.push(new Guess(filter, operator, argument))
                    })
                }
              })
            }
        })
    }

    return advice
  }
}

export class QueryEngine {
  private grammar : Grammar

  constructor (grammar: Grammar) {
    this.grammar = grammar
  }

  public guess (partial: string): Guess[] {
    const lexer = new Lexer(partial, this.grammar)
    const guesses = Oracle.filter(lexer, this.grammar)

    // Weight guesses according to their respective weights. (Highest first)
    guesses.sort((a, b) => b.weight() - a.weight())

    return guesses
  }

  public validate (partial: string): boolean {
    // TODO
    return false
  }
}
