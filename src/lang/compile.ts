import Grammar from './grammar'
import Lexer, { RichToken } from './lexer'
import * as errors from './errors'
import { Type } from './type'
import { Filter } from './filter'
import { Operator } from './operator'
import { Argument } from './argument'
import { Predicate } from './predicate'

export default class Compile {
  public static predicate (literal: string, grammar: Grammar) {
    const lexer = new Lexer(literal, grammar)
    const filter = Compile.filter(lexer, grammar)
    const operator = Compile.operator(filter.type, lexer, grammar)
    const argument = Compile.argument(filter.type, lexer, grammar)
    return new Predicate(filter, operator, argument)
  }

  private static filter (lexer: Lexer, grammar: Grammar): Filter {
    if (lexer.peek() === null) {
      throw new errors.SyntaxError(lexer.firstPosition(), `predicate is empty`)
    }

    const tok = lexer.next() as RichToken
    if (grammar.hasFilter(tok.lexeme)) {
      const filter = grammar.getFilter(tok.lexeme)
      return new Filter(filter.type, filter.name)
    } else {
      throw new errors.SyntaxError(tok.pos, `unknown filter: "${tok.lexeme}"`)
    }
  }

  private static operator (type: Type, lexer: Lexer, grammar: Grammar): Operator {
    if (lexer.peek() === null) {
      throw new errors.SyntaxError(lexer.lastPosition(), `missing an operator and argument`)
    }

    const tok = lexer.next() as RichToken
    if (grammar.hasOperator(tok.lexeme)) {
      const operator = grammar.getOperator(tok.lexeme)
      if (grammar.isSubtypeOf(type, operator.type)) {
        return new Operator(type, operator.symbol)
      } else {
        throw new errors.SyntaxError(tok.pos, `"${tok.lexeme}" operator cannot be used on type: "${type}"`)
      }
    } else {
      throw new errors.SyntaxError(tok.pos, `unknown operator: "${tok.lexeme}"`)
    }
  }

  private static argument (type: Type, lexer: Lexer, grammar: Grammar): Argument {
    if (lexer.peek() === null) {
      throw new errors.SyntaxError(lexer.lastPosition(), `missing an argument`)
    }

    let partial = false
    for (let macro of grammar.compatibleMacros(type)) {
      lexer.save()
      const attempt = macro.attempt(lexer, grammar)
      lexer.undo()

      if (attempt.success) {
        const literal = attempt.tokens.map(t => t.lexeme).join(' ')
        return new Argument(type, literal, attempt.value)
      } else {
        partial = attempt.partial || partial
      }
    }

    const tok = lexer.next() as RichToken
    if (partial) {
      throw new errors.SyntaxError(tok.pos, `incomplete argument`)
    } else {
      throw new errors.SyntaxError(tok.pos, `unknown argument`)
    }
  }
}
