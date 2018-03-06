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
  public value : string | number

  constructor (type: Type, value: string | number) {
    super(type)
    this.value = value
  }

  toJSON (): Object {
    return {
      type: this.type,
      value: this.value,
    }
  }

  toString () {
    return this.value.toString()
  }
}
