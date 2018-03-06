import { Type } from './type'
import { Example } from './macro'

export class ArgumentPlaceholder {
  public type     : Type
  public example? : Example

  constructor (type: Type, example?: Example) {
    this.type = type
    this.example = example
  }

  toJSON (): Object {
    return {
      type: this.type,
      placeholder: true,
      example: this.example,
    }
  }

  toString () {
    if (this.example) {
      return this.example.toString()
    } else {
      return `<${this.type.toString()}>`
    }
  }
}

export class Argument extends ArgumentPlaceholder {
  public literal  : string
  public resolved : string | number

  constructor (type: Type, literal: string, resolved: string | number) {
    super(type)
    this.literal = literal
    this.resolved = resolved
  }

  toJSON (): Object {
    return {
      type: this.type,
      literal: this.literal,
      resolved: this.resolved,
    }
  }

  toString () {
    return this.literal
  }
}
