import { Type } from './type'
import Grammar from './grammar'
import Lexer, { RichToken } from './lexer'

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
  public type          : Type
  public example?      : string
  public weight?       : number

  constructor (isPlaceholder: true, type: Type)
  constructor (isPlaceholder: false, type: Type, example: string, weight: number)
  constructor (isPlaceholder: boolean, type: Type, example?: string, weight?: number) {
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

export default class Oracle {
  public static guess (partial: string, grammar: Grammar) {
    const lexer = new Lexer(partial, grammar)
    const guesses = Oracle.filter(lexer, grammar)

    // Sort guesses from highest weight -> lowest weight.
    guesses.sort((a, b) => b.weight() - a.weight())
    return guesses
  }

  // TODO: good grief this function needs to be broken down.
  private static filter (lexer: Lexer, grammar: Grammar): Guess[] {
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
              .filter(op => op.type.equals(f.type)) // TODO: possible do type casting?
              .forEach(op => {
                const operator = new OperatorGuess(false, op.symbol)
                const argument = new ArgumentGuess(true, f.type)
                advice.push(new Guess(filter, operator, argument))
              })
          } else {
            // Parse the operator and then parse the argument.
            const next = lexer.next() as RichToken
            grammar.operators
              .filter(op => op.type.equals(f.type)) // TODO: possible do type casting?
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
