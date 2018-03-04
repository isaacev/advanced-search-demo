import Grammar from './grammar'
import Lexer from './lexer'
import * as errors from './errors'

class Runner {
  // ...
}

export class Compiler {
  static filter (lexer: Lexer, grammar: Grammar): errors.SyntaxError | Runner {
    return new errors.SyntaxError(0, '')
  }
}
