import * as React from 'react'
import * as oracle from '../lang/oracle'
import * as strings from '../lang/strings'
import './ghost.css'

interface GhostProps {
  literal : string
  guess   : oracle.Guess
}

export class Ghost extends React.PureComponent<GhostProps> {
  static noramalize (str: string) {
    return str
      .toLowerCase()
      .replace(/^\s+/, '')
      .replace(/\s+/g, ' ')
  }

  static getGhost (literal: string, guess: oracle.Guess) {
    const normLiteral = Ghost.noramalize(literal)
    const normGuess = Ghost.noramalize(guess.toString(false))

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
