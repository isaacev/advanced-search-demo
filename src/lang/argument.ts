import { Type } from './type'

export class Argument {
  public type  : Type
  public value : string | number

  constructor (type: Type, value: string | number) {
    this.type = type
    this.value = value
  }
}
