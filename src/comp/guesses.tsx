import * as React from 'react'
import { PredicatePlaceholder } from '../lang/predicate'
import { PredicateSpan } from './predicate'
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

class DetailSpan extends React.PureComponent<{ detail: string }> {
  render () {
    return <span className="detail">{this.props.detail}</span>
  }
}

interface GuessProps {
  guess   : PredicatePlaceholder
  pending : boolean
  onClick : (guess: PredicatePlaceholder) => void
}

export class Guess extends React.PureComponent<GuessProps> {
  handleClick (event: React.MouseEvent<HTMLLIElement>) {
    this.props.onClick(this.props.guess)
  }

  getDetailSpan () {
    if (this.props.guess.argument.example) {
      if (this.props.guess.argument.example.detail) {
        const detail = this.props.guess.argument.example.detail
        return <DetailSpan detail={detail} />
      }
    }
    return null
  }

  render () {
    const classes = 'guess' + (this.props.pending ? ' pending' : '')
    return (
      <li className={classes} onClick={e => this.handleClick(e)}>
        <PredicateSpan predicate={this.props.guess} />
        {this.getDetailSpan()}
      </li>
    )
  }
}
