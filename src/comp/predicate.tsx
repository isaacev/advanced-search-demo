import * as React from 'react'
import { PredicatePlaceholder } from '../lang/predicate'
import { Operator } from '../lang/operator'
import { Argument } from '../lang/argument'
import './predicate.css'

class FilterSpan extends React.PureComponent<{ name: string }> {
  render () {
    return <span className="filter">{this.props.name}</span>
  }
}

class OperatorSpan extends React.PureComponent<{ symbol?: string }> {
  render () {
    if (this.props.symbol) {
      return <span className="operator completion">{this.props.symbol}</span>
    } else {
      return <span className="operator placeholder">&nbsp;&nbsp;</span>
    }
  }
}

class ArgumentSpan extends React.PureComponent<{ type: string, example?: string }> {
  render () {
    if (this.props.example) {
      return <span className="argument completion">{this.props.example}</span>
    } else {
      return <span className="argument completion">{this.props.type}</span>
    }
  }
}

export class PredicateSpan extends React.PureComponent<{ predicate: PredicatePlaceholder }> {
  getFilterSpan () {
    const name = this.props.predicate.filter.name
    return <FilterSpan name={name} />
  }

  getOperatorSpan () {
    if (this.props.predicate.operator instanceof Operator) {
      const symbol = this.props.predicate.operator.symbol
      return <OperatorSpan symbol={symbol} />
    } else {
      return <OperatorSpan />
    }
  }

  getArgumentSpan () {
    const type = this.props.predicate.argument.type.name
    if (this.props.predicate.argument instanceof Argument) {
      const example = this.props.predicate.argument.toString()
      return <ArgumentSpan type={type} example={example} />
    } else if (this.props.predicate.argument.example) {
      const example = this.props.predicate.argument.example.toString()
      return <ArgumentSpan type={type} example={example} />
    } else {
      return <ArgumentSpan type={type} />
    }
  }

  render () {
    return (
      <span className="predicate">
        {this.getFilterSpan()}
        {this.getOperatorSpan()}
        {this.getArgumentSpan()}
      </span>
    )
  }
}
