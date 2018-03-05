import { Type } from './type'
import * as strings from './strings'

export interface OperatorOptions {
  symbol   : string
  type     : string
  aliases? : string[]
}

export class Operator {
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
