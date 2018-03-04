import Grammar from './grammar'

export interface SimpleToken {
  type   : 'whitespace' | 'word'
  lexeme : string
  pos    : number
}

export interface RichToken {
  type   : 'value' | 'operator' | 'word'
  lexeme : string
  pos    : number
}

export default class Lexer {
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
