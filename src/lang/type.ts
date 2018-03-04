import { Value } from './value'

export interface TypeOptions {
  name       : string
  precedence : number
  supertype? : string
  validate   : (token: string) => boolean
  evaluate   : (token: string) => string | number
}

export class Type {
  public name       : string
  public precedence : number
  public supertype  : Type
  public validate   : (token: string) => boolean
  public evaluate   : (token: string) => Value

  constructor (name: '*')
  constructor (name: string, supertype: Type, opts: TypeOptions)
  constructor (name: string, supertype?: Type, opts?: TypeOptions) {
    if (name === '*') {
      this.name = '*'
      this.precedence = -1
      this.supertype = this
      this.validate = () => true
      this.evaluate = (a) => new Value(this, a)
    } else {
      this.name = name
      this.supertype = supertype as Type

      if (opts && opts.precedence) {
        this.precedence = opts.precedence
      }

      this.validate = (opts as TypeOptions).validate
      this.evaluate = (token: string) => {
        const raw = (opts as TypeOptions).evaluate(token)
        return new Value(this, raw)
      }
    }
  }

  equals (other: Type) {
    return this.name === other.name
  }

  toJSON () {
    return this.name
  }
}
