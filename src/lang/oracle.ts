import { Type } from './type'
import Grammar from './grammar'
import Lexer, { RichToken } from './lexer'

class FilterGuess {
  public name : string
  public type : Type

  constructor (name: string, type: Type) {
    this.name = name
    this.type = type
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
 * For example, given the incomplete query "created before" good suggestions
 * might include:
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

  private static filter (lexer: Lexer, grammar: Grammar): Guess[] {
    if (lexer.peek() === null) {
      /**
       * The language expected the beginning of a filter but instead found an
       * empty line. Since the user has input nothing that can be used to limit
       * the breadth of guesses, offer 1 guess for every filter.
       */
      return grammar.filters.map(f => {
        const filter = new FilterGuess(f.name, f.type)
        const operator = new OperatorGuess(true)
        const argument = new ArgumentGuess(true, f.type)
        return new Guess(filter, operator, argument)
      })
    }

    const first = lexer.next() as RichToken

    /**
     * If the first token is the only token, identify all filters prefixed by
     * the first token. If there is only one filter that is prefixed by the
     * token then expand that filter's operators. If more than one filter is
     * still possible, do not expand any filter operators.
     */
    if (lexer.peek() === null) {
      const possibleFilters = grammar.filters.filter(f => {
        return f.prefixedBy(first.lexeme)
      }).map(f => {
        return new FilterGuess(f.name, f.type)
      })

      if (possibleFilters.length === 1) {
        const filter = possibleFilters[0]
        return grammar.compatibleOperators(filter.type).map(op => {
          const operator = new OperatorGuess(false, op.symbol)
          const argument = new ArgumentGuess(true, filter.type)
          return new Guess(filter, operator, argument)
        })
      } else {
        return possibleFilters.map(filter => {
          const operator = new OperatorGuess(true)
          const argument = new ArgumentGuess(true, filter.type)
          return new Guess(filter, operator, argument)
        })
      }
    }

    const second = lexer.next() as RichToken

    /**
     * If there is a second token then the only filters that can be considered
     * are the filters that perfectly matched the first token, not filters that
     * were merely prefixed by the first token.
     */
    const matchingFilters = grammar.filters.filter(f => {
      return f.name === first.lexeme
    }).map(f => {
      return new FilterGuess(f.name, f.type)
    })

    /**
     * If the second token is the last token, identify any operators compatible
     * with the matching filters and that are prefixed by the second token. If
     * there is only one operator that fits all of these criteria, expand the
     * arguments.
     */
    if (lexer.peek() === null) {
      return matchingFilters.reduce((guesses, filter) => {
        const possibleOperators = grammar.compatibleOperators(filter.type).filter(op => {
          return op.prefixedBy(second.lexeme)
        }).map(op => {
          return new OperatorGuess(false, op.symbol)
        })

        if (possibleOperators.length === 1) {
          const operator = possibleOperators[0]
          const examples = Oracle.argument(filter.type, lexer, grammar)

          const newGuesses = examples.map(argument => {
            return new Guess(filter, operator, argument)
          })

          return guesses.concat(newGuesses)
        } else {
          const newGuesses = possibleOperators.map(operator => {
            const argument = new ArgumentGuess(true, filter.type)
            return new Guess(filter, operator, argument)
          })

          return guesses.concat(newGuesses)
        }
      }, [] as Guess[])
    }

    return matchingFilters.reduce((guesses, filter) => {
      /**
       * Since there are still more tokens, the only operators that can be
       * considered are the operators that perfectly matched the second token,
       * not operators that were merely prefixed by the second token.
       */
      const matchingOperators = grammar.compatibleOperators(filter.type).filter(op => {
        return op.hasAlias(second.lexeme)
      }).map(op => {
        return new OperatorGuess(false, op.symbol, )
      })

      /**
       * Check each compatible macro to determine if it matches the upcoming
       * tokens and if so, count how many characters it matches. If the macro
       * matches none of the upcoming characters do not add it to the list of
       * guesses.
       *
       * If the macro matches some characters, generate an example for that
       * macro and add that result to the list of guesses.
       */
      const examples = Oracle.argument(filter.type, lexer, grammar)
      const newGuesses = examples.reduce((guesses, argument) => {
        const newGuesses = matchingOperators.map(operator => {
          return new Guess(filter, operator, argument)
        })

        return guesses.concat(newGuesses)
      }, [] as Guess[])

      return guesses.concat(newGuesses)
    }, [] as Guess[])
  }

  private static argument (type: Type, lexer: Lexer, grammar: Grammar): ArgumentGuess[] {
    return grammar.compatibleMacros(type).reduce((guesses, m) => {
      /**
       * If there are no upcoming tokens, every compatible macro should return
       * an example.
       */
      if (lexer.peek() === null) {
        const examples = m.example([])
        return guesses.concat(examples.map(example => {
          return new ArgumentGuess(false, type, example, 0)
        }))
      }

      /**
       * Try to apply the macro to the token stream but undo any changes that
       * parsing the macro made to the lexer.
       */
      lexer.save()
      const attempt = m.attempt(lexer, grammar)
      lexer.undo()

      // Macro matched nothing so reject it as a possibility.
      if (attempt.success === false && attempt.partial === false) {
        return guesses
      }

      const examples = m.example(attempt.tokens.map(t => t.lexeme))
      const weight = attempt.tokens.reduce((w, t) => w + t.lexeme.length, 0)
      return guesses.concat(examples.map(example => {
        return new ArgumentGuess(false, type, example, weight)
      }))
    }, [] as ArgumentGuess[])
  }
}
