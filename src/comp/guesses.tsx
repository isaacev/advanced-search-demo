import * as React from 'react'
import * as oracle from '../lang/oracle'
import './guesses.css'

export class Guesses extends React.PureComponent {
  render () {
    return (
      <ul id="guesses">
        {this.props.children}
      </ul>
    )
  }
}

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

class DetailSpan extends React.PureComponent<{ detail: string }> {
  render () {
    return <span className="detail">{this.props.detail}</span>
  }
}

interface GuessProps {
  guess   : oracle.Guess
  pending : boolean
  onClick : (guess: oracle.Guess) => void
}

export class Guess extends React.PureComponent<GuessProps> {
  handleClick (event: React.MouseEvent<HTMLLIElement>) {
    this.props.onClick(this.props.guess)
  }

  getFilterSpan () {
    return <FilterSpan name={this.props.guess.name()} />
  }

  getOperatorSpan () {
    if (this.props.guess.hasSymbol()) {
      return <OperatorSpan symbol={this.props.guess.symbol()} />
    } else {
      return <OperatorSpan />
    }
  }

  getArgumentSpan () {
    if (this.props.guess.hasExample()) {
      return (
        <ArgumentSpan
          type={this.props.guess.type().name}
          example={this.props.guess.example().toString()}
        />
      )
    } else {
      return (
        <ArgumentSpan type={this.props.guess.type().name} />
      )
    }
  }

  getDetailSpan () {
    if (this.props.guess.hasExample()) {
      if (this.props.guess.example().hasDetails()) {
        return <DetailSpan detail={this.props.guess.example().details()} />
      }
    }

    return null
  }

  render () {
    const classes = 'guess' + (this.props.pending ? ' pending' : '')
    return (
      <li className={classes} onClick={e => this.handleClick(e)}>
        {this.getFilterSpan()}
        {this.getOperatorSpan()}
        {this.getArgumentSpan()}
        {this.getDetailSpan()}
      </li>
    )
  }
}
