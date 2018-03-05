import * as React from 'react'
import './query.css'
import Oracle, * as oracle from './lang/oracle'
import * as strings from './lang/strings'
import Grammar from './grammar'

const NONE_PENDING = -1

interface QueryProps {
  onDebug : (debugging: { title: string, data: Object }[]) => void
}

interface QueryState {
  literal : string
  guesses : oracle.Guess[]
  pending : number
}

export class Query extends React.Component<QueryProps, QueryState> {
  private inputComponentRef : Input | null = null

  constructor (props: QueryProps) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
    this.handleSpecialKey = this.handleSpecialKey.bind(this)

    this.state = {
      literal: '',
      guesses: Oracle.guess('', Grammar),
      pending: NONE_PENDING,
    }

    if (this.props.onDebug) {
      this.props.onDebug([{
        title: 'Guesses',
        data: this.state.guesses,
      }, {
        title: 'Grammar',
        data: Grammar,
      }])
    }
  }

  public setQuery (newValue: string) {
    const guesses = Oracle.guess(newValue, Grammar)
    this.setState({
      literal: newValue,
      guesses,
      pending: this.pendingGuessIndexAtRest(guesses, newValue),
    })
    if (this.props.onDebug) {
      this.props.onDebug([{
        title: 'Guesses',
        data: guesses,
      }, {
        title: 'Grammar',
        data: Grammar,
      }])
    }
  }

  pendingGuessIndexAtRest (guesses: oracle.Guess[] = this.state.guesses, literal: string = this.state.literal) {
    if (guesses.length > 0 && literal.length > 0) {
      return 0
    } else {
      return NONE_PENDING
    }
  }

  handleChange (newValue: string) {
    this.setQuery(newValue)
  }

  handleSpecialKey (key: 'tab' | 'esc' | 'up' | 'down') {
    const curr = this.state.pending
    const total = this.state.guesses.length

    switch (key) {
      case 'tab':
        if (curr > NONE_PENDING) {
          const literal = this.state.literal
          const guess = this.state.guesses[curr]
          const ghost = Ghost.getGhost(literal, guess)
          this.setQuery(literal + ghost)
        }
        break
      case 'esc':
        this.setState({ pending: NONE_PENDING })
        break
      case 'up':
        if (curr - 1 >= 0) {
          this.setState({ pending: curr - 1 })
        } else {
          this.setState({ pending: 0 })
        }
        break
      case 'down':
        if (curr + 1 < total) {
          this.setState({ pending: curr + 1 })
        }
        break
    }
  }

  handleClick (guess: oracle.Guess) {
    this.setQuery(guess.toString(false))
    if (this.inputComponentRef) {
      this.inputComponentRef.focus()
    }
  }

  render () {
    return (
      <header id="query">
        <Input
          ref={self => this.inputComponentRef = self}
          value={this.state.literal}
          onChange={this.handleChange}
          onSpecialKey={this.handleSpecialKey}
        />
        {(this.state.pending > NONE_PENDING) && (
          <Ghost
            literal={this.state.literal}
            guess={this.state.guesses[this.state.pending]}
          />
        )}
        <Guesses>
          {this.state.guesses.map((guess, i) =>
            <Guess
              key={i}
              guess={guess}
              pending={i === this.state.pending}
              onClick={(guess) => this.handleClick(guess)}
            />
          )}
        </Guesses>
      </header>
    )
  }
}

interface InputProps {
  value        : string
  onChange     : (newValue: string) => void
  onSpecialKey : (key: 'tab' | 'up' | 'down' | 'esc') => void
}

class Input extends React.PureComponent<InputProps> {
  private inputElementRef : HTMLInputElement | null

  constructor (props: InputProps) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
  }

  public focus () {
    if (this.inputElementRef) {
      this.inputElementRef.focus()
    }
  }

  handleChange (event: React.ChangeEvent<HTMLInputElement>) {
    this.props.onChange(event.target.value)
  }

  handleKeyDown (event: React.KeyboardEvent<HTMLInputElement>) {
    const keys = {
      9: 'tab',
      27: 'esc',
      38: 'up',
      40: 'down',
    }

    if (keys[event.keyCode]) {
      event.preventDefault()
      event.stopPropagation()
      this.props.onSpecialKey(keys[event.keyCode])
    }
  }

  render () {
    return (
      <input
        type="text"
        autoFocus={true}
        spellCheck={false}
        value={this.props.value}
        onChange={this.handleChange}
        onKeyDown={this.handleKeyDown}
        ref={self => this.inputElementRef = self}
      />
    )
  }
}

class Ghost extends React.PureComponent<{ literal: string, guess: oracle.Guess }> {
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
      <div id="query-ghost">
        <span className="hidden">{this.props.literal}</span>
        <span className="ghost">{ghost}</span>
      </div>
    )
  }
}

class Guesses extends React.PureComponent {
  render () {
    return (
      <ul id="query-guesses">
        {this.props.children}
      </ul>
    )
  }
}

interface GuessProps {
  guess        : oracle.Guess
  pending      : boolean
  onClick      : (guess: oracle.Guess) => void
}

class Guess extends React.PureComponent<GuessProps> {
  render () {
    return (
      <li
        className={'query-guess' + (this.props.pending ? ' pending' : '')}
        onClick={() => this.props.onClick(this.props.guess)}
      >
        <FilterSpan name={this.props.guess.name()} />
        {(this.props.guess.hasSymbol())
          ? <OperatorSpan symbol={this.props.guess.symbol()} />
          : <OperatorSpan />}
        {(this.props.guess.hasExample())
          ? <ArgumentSpan type={this.props.guess.type().name} example={this.props.guess.example().toString()} />
          : <ArgumentSpan type={this.props.guess.type().name} />}
        {(this.props.guess.hasExample() && this.props.guess.example().hasDetails()) &&
            <DetailSpan detail={this.props.guess.example().details()} />}
      </li>
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
