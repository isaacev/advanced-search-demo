import { Type } from './type'

export class Value {
  public type  : Type
  public value : string | number

  constructor (type: Type, value: string | number) {
    this.type = type
    this.value = value
  }

  toJSON () {
    return {
      type: this.type,
      value: this.value,
    }
  }
}
