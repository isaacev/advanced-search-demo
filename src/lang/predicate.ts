import { Filter } from './filter'
import { OperatorPlaceholder, Operator } from './operator'
import { ArgumentPlaceholder, Argument } from './argument'

export class PredicatePlaceholder {
  public filter   : Filter
  public operator : OperatorPlaceholder
  public argument : ArgumentPlaceholder

  constructor (filter: Filter, operator: OperatorPlaceholder, argument: ArgumentPlaceholder) {
    this.filter = filter
    this.operator = operator
    this.argument = argument
  }

  toJSON (): Object {
    return {
      filter: this.filter,
      operator: this.operator,
      argument: this.argument,
    }
  }

  toString () {
    if (this.argument instanceof Argument || this.argument.example) {
      return `${this.filter.toString()} ${this.operator.toString()} ${this.argument.toString()}`
    } else if (this.operator instanceof Operator) {
      return `${this.filter.toString()} ${this.operator.toString()}`
    } else {
      return `${this.filter.toString()}`
    }
  }
}

export class Predicate extends PredicatePlaceholder {
  public filter   : Filter
  public operator : Operator
  public argument : Argument

  constructor (filter: Filter, operator: Operator, argument: Argument) {
    super(filter, operator, argument)
  }
}
