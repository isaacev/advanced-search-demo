import * as React from 'react'
import { PredicatePlaceholder } from '../lang/predicate'
import * as strings from '../strings'
import './ghost.css'

interface GhostProps {
  literal : string
  guess   : PredicatePlaceholder
}

export class Ghost extends React.PureComponent<GhostProps> {
  static noramalize (str: string) {
    return str
      .toLowerCase()
      .replace(/^\s+/, '')
      .replace(/\s+/g, ' ')
  }

  static getGhost (literal: string, guess: PredicatePlaceholder) {
    const normLiteral = Ghost.noramalize(literal)
    const normGuess = Ghost.noramalize(guess.toString())

    if (strings.hasPrefix(normLiteral, normGuess)) {
      return normGuess.substring(normLiteral.length)
    } else {
      return ''
    }
  }

  render () {
    const ghost = Ghost.getGhost(this.props.literal, this.props.guess)
    return (
      <div id="ghost">
        <span className="hidden">{this.props.literal}</span>
        <span className="ghost">{ghost}</span>
      </div>
    )
  }
}
