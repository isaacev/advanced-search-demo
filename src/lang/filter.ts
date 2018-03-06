import { Type } from './type'
import * as strings from './strings'

export interface FilterOptions {
  name     : string
  type     : string
  aliases? : string[]
}

export class FilterSyntax {
  public name    : string
  public type    : Type
  public aliases : string[]

  constructor (name: string, type: Type, aliases: string[] = []) {
    this.name = name
    this.type = type
    this.aliases = aliases
  }

  prefixedBy (prefix: string) {
    return strings.anyHavePrefix(prefix, ...this.aliases.concat(this.name))
  }

  toJSON () {
    return {
      name: this.name,
      type: this.type,
      aliases: this.aliases.length ? this.aliases : undefined,
    }
  }
}

export class Filter {
  public type : Type
  public name : string

  constructor (type: Type, name: string) {
    this.type = type
    this.name = name
  }
}
