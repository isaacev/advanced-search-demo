import { Filter } from './filter'
import { Operator } from './operator'
import { Argument } from './argument'

export class Predicate {
  public filter   : Filter
  public operator : Operator
  public argument : Argument

  constructor (filter: Filter, operator: Operator, argument: Argument) {
    this.filter = filter
    this.operator = operator
    this.argument = argument
  }
}
