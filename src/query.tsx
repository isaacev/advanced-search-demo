import * as React from 'react'
import './query.css'
import Oracle, * as oracle from './lang/oracle'
import Grammar from './grammar'

const NONE_PENDING = -1

interface QueryProps {
  onNewGuesses? : (guesses: oracle.Guess[]) => void
}

interface QueryState {
  literal : string
  guesses : oracle.Guess[]
  showing : boolean
  pending : number
}

export class Query extends React.Component<QueryProps, QueryState> {
  private inputComponentRef : Input | null = null

  constructor (props: QueryProps) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
    this.handleSpecialKey = this.handleSpecialKey.bind(this)
    this.handleMouseMove = this.handleMouseMove.bind(this)

    this.state = {
      literal: '',
      guesses: Oracle.guess('', Grammar),
      showing: true,
      pending: NONE_PENDING,
    }

    if (this.props.onNewGuesses) {
      this.props.onNewGuesses(this.state.guesses)
    }
  }

  public setQuery (newValue: string) {
    const guesses = Oracle.guess(newValue, Grammar)
    this.setState({
      literal: newValue,
      guesses,
      pending: NONE_PENDING,
    })
    if (this.props.onNewGuesses) {
      this.props.onNewGuesses(guesses)
    }
  }

  handleChange (newValue: string) {
    this.setQuery(newValue)
  }

  handleSpecialKey (key: 'enter' | 'esc' | 'up' | 'down') {
    const curr = this.state.pending
    const total = this.state.guesses.length

    switch (key) {
      case 'enter':
        const guess = this.state.guesses[curr]
        this.setQuery(guess.toString(false))
        this.setState({ pending: NONE_PENDING })
        break
      case 'esc':
        // TODO
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

  handleMouseMove (index: number) {
    this.setState({
      pending: index,
    })
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
        <Guesses showing={this.state.showing}>
          {this.state.guesses.map((guess, i) =>
            <Guess
              key={i}
              guess={guess}
              hovered={i === this.state.pending}
              onMouseMove={() => this.handleMouseMove(i)}
              onMouseLeave={() => this.setState({ pending: NONE_PENDING })}
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
  onSpecialKey : (key: 'up' | 'down' | 'enter' | 'esc') => void
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
      13: 'enter',
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

class Guesses extends React.PureComponent<{ showing: boolean }> {
  render () {
    return (
      <ul id="query-guesses" className={this.props.showing ? 'showing' : 'hidden'}>
        {this.props.children}
      </ul>
    )
  }
}

interface GuessProps {
  guess        : oracle.Guess
  hovered      : boolean
  onMouseMove  : () => void
  onMouseLeave : () => void
  onClick      : (guess: oracle.Guess) => void
}

class Guess extends React.PureComponent<GuessProps> {
  render () {
    return (
      <li
        className={'query-guess' + (this.props.hovered ? ' hovered' : '')}
        onMouseMove={this.props.onMouseMove}
        onMouseLeave={this.props.onMouseLeave}
        onClick={() => this.props.onClick(this.props.guess)}
      >
        <FilterSpan name={this.props.guess.name()} />
        {(this.props.guess.hasSymbol())
            ? <OperatorSpan symbol={this.props.guess.symbol()} />
            : <OperatorSpan />}
        {(this.props.guess.hasExample())
            ? <ArgumentSpan type={this.props.guess.type().name} example={this.props.guess.example()} />
            : <ArgumentSpan type={this.props.guess.type().name} />}
        <DetailSpan detail="0 matches" />
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
