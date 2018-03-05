import { Type, TypeOptions } from './type'
import { FilterSyntax, FilterOptions } from './filter'
import { OperatorSyntax, OperatorOptions } from './operator'
import { MacroSyntax, MacroOptions } from './macro'
import * as errors from './errors'

interface GrammarOptions {
  types?     : TypeOptions[]
  filters?   : FilterOptions[]
  operators? : OperatorOptions[]
  macros?    : MacroOptions[]
}

export default class Grammar {
  public types     : Type[]           = []
  public operators : OperatorSyntax[] = []
  public filters   : FilterSyntax[]   = []
  public macros    : MacroSyntax[]    = []

  constructor (opts: GrammarOptions = {}) {
    const star = new Type('*')
    this.types.push(star)

    for (let type of opts.types || []) {
      this.newType(type)
    }

    for (let filter of opts.filters || []) {
      this.newFilter(filter)
    }

    for (let operator of opts.operators || []) {
      this.newOperator(operator)
    }

    for (let macro of opts.macros || []) {
      this.newMacro(macro)
    }
  }

  public newType (opts: TypeOptions) {
    if (this.hasType(opts.name)) {
      throw errors.fatal(`redeclared type: "${opts.name}"`)
    }

    let supertype = this.getType('*')
    if (opts.supertype && typeof opts.supertype === 'string') {
      supertype = this.getType(opts.supertype || '*')
    }

    this.types.push(new Type(opts.name, supertype, opts))
    this.types.sort((a, b) => b.precedence - a.precedence)
  }

  public hasType (name: string) {
    for (let t of this.types) {
      if (t.name === name) {
        return true
      }
    }
    return false
  }

  public getType (name: string): Type {
    for (let t of this.types) {
      if (t.name === name) {
        return t
      }
    }
    throw errors.fatal(`unknown type: "${name}"`)
  }

  public allSupertypes (type: Type): Type[] {
    if (type.name === '*') {
      return [type]
    } else {
      return [type].concat(this.allSupertypes(type.supertype))
    }
  }

  public newOperator (opts: OperatorOptions) {
    const type = this.getType(opts.type)
    this.operators.push(new OperatorSyntax(opts.symbol, type, opts.aliases))
  }

  public hasOperator (symbol: string) {
    for (let o of this.operators) {
      if (o.hasAlias(symbol)) {
        return true
      }
    }
    return false
  }

  public getOperator (symbol: string) {
    for (let o of this.operators) {
      if (o.hasAlias(symbol)) {
        return o
      }
    }
    throw errors.fatal(`unknown operator: "${symbol}"`)
  }

  public compatibleOperators (type: Type): OperatorSyntax[] {
    const allSupertypes = this.allSupertypes(type)
    return this.operators.filter(op => {
      return allSupertypes.indexOf(op.type) > -1
    })
  }

  public newFilter (opts: FilterOptions) {
    const type = this.getType(opts.type)
    this.filters.push(new FilterSyntax(opts.name, type, opts.aliases))
  }

  public hasFilter (name: string) {
    for (let o of this.filters) {
      if (o.name === name) {
        return true
      }
    }
    return false
  }

  public getFilter (name: string) {
    for (let o of this.filters) {
      if (o.name === name) {
        return o
      }
    }
    throw errors.fatal(`unknown filter: "${name}"`)
  }

  public newMacro (opts: MacroOptions) {
    const type = this.getType(opts.type)
    this.macros.push(new MacroSyntax(type, opts))
    this.macros.sort((a, b) => b.precedence - a.precedence)
  }

  public compatibleMacros (type: Type): MacroSyntax[] {
    const allSupertypes = this.allSupertypes(type)
    return this.macros.filter(op => {
      return allSupertypes.indexOf(op.type) > -1
    })
  }

  toJSON () {
    return {
      types: this.types,
      filters: this.filters,
      operators: this.operators,
      macros: this.macros,
    }
  }
}
