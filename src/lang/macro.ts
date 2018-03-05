import { Type } from './type'
import Lexer, * as lexer from './lexer'
import Grammar from './grammar'
import * as errors from './errors'
import * as strings from './strings'

export interface MacroOptions {
  template    : string
  type        : string
  resolve     : (...argv: string[]) => string | number
  example     : (tokens: string[]) => string[]
  precedence? : number
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
  tokens  : lexer.RichToken[]
  partial : boolean
}

type MacroAttemptSuccess = {
  success : true
  tokens  : lexer.RichToken[]
  type    : Type
  value   : string | number
}

export class Macro {
  public type       : Type
  public template   : string
  public syntax     : (MacroParameter | MacroKeyword)[]
  public resolve    : (...argv: string[]) => string | number
  public example    : (tokens: string[]) => string[]
  public precedence : number = 0

  static process (template: string) {
    return Lexer.simpleTokens(template).filter(t => t.type === 'word').map(t => {
      if (t.lexeme[0] === '<') {
        // Parse token as a macro parameter.
        const match = t.lexeme.match(/^<(.+)>$/)
        if (match) {
          return { type: 'parameter', name: match[1] } as MacroParameter
        } else {
          throw errors.fatal(`invalid macro parameter: "${t.lexeme}"`)
        }
      } else if (t.lexeme[0] === '[') {
        // Parse as macro keyword WITH aliases.
        const match = t.lexeme.match(/^\[([^\|]+(?:\|[^\|]+)*)\]$/)
        if (match) {
          return { type: 'keyword', aliases: match[1].split('|') } as MacroKeyword
        } else {
          throw errors.fatal(`invalid macro keyword: "${t.lexeme}"`)
        }
      } else {
        // Parse as macro keyword WITHOUT aliases.
        return { type: 'keyword', aliases: [ t.lexeme ] } as MacroKeyword
      }
    })
  }

  constructor (type: Type, opts: MacroOptions) {
    this.type = type
    this.template = opts.template
    this.syntax = Macro.process(opts.template)
    this.resolve = opts.resolve
    this.example = opts.example

    if (opts.precedence) {
      this.precedence = opts.precedence
    }
  }

  attempt (lexer: Lexer, grammar: Grammar): MacroAttemptSuccess | MacroAttemptFailure {
    const tokens = [] as lexer.RichToken[]
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
            if (strings.prefixedBy(realToken.lexeme, ...templateToken.aliases)) {
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
      precedence: this.precedence,
    }
  }
}
