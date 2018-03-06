import { Type } from './type'
import * as strings from './strings'

export interface OperatorOptions {
  symbol   : string
  type     : string
  aliases? : string[]
}

export class OperatorSyntax {
  public symbol  : string
  public type    : Type
  public aliases : string[]

  constructor (symbol: string, type: Type, aliases: string[] = []) {
    this.symbol = symbol
    this.type = type
    this.aliases = aliases
  }

  hasAlias (symbol: string) {
    return this.aliases.concat(this.symbol).indexOf(symbol) > -1
  }

  prefixedBy (prefix: string) {
    return strings.anyHavePrefix(prefix, ...this.aliases.concat(this.symbol))
  }

  toJSON () {
    return {
      symbol: this.symbol,
      type: this.type,
      aliases: this.aliases.length ? this.aliases : undefined,
    }
  }
}

export class OperatorPlaceholder {
  public type : Type

  constructor (type: Type) {
    this.type = type
  }

  toJSON (): Object {
    return {
      type: this.type,
      placeholder: true,
    }
  }

  toString () {
    return `<operator>`
  }
}

export class Operator extends OperatorPlaceholder {
  public symbol : string

  constructor (type: Type, symbol: string) {
    super(type)
    this.symbol = symbol
  }

  toJSON (): Object {
    return {
      type: this.type,
      symbol: this.symbol,
    }
  }

  toString () {
    return this.symbol
  }
}
