import * as React from 'react'
import './query.css'
import * as lang from './lang'
import Grammar from './grammar'

const engine = new lang.QueryEngine(Grammar)

const NONE_PENDING = -1

interface QueryState {
  literal : string
  guesses : lang.Guess[]
  showing : boolean
  pending : number
}

export class Query extends React.Component<{}, QueryState> {
  constructor (props: {}) {
    super(props)
    this.handleFocus = this.handleFocus.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.handleBlur = this.handleBlur.bind(this)
    this.handleSpecialKey = this.handleSpecialKey.bind(this)
    this.handleMouseEnter = this.handleMouseEnter.bind(this)
    this.handleMouseLeave = this.handleMouseLeave.bind(this)

    this.state = {
      literal: '',
      guesses: engine.guess(''),
      showing: false,
      pending: NONE_PENDING,
    }
  }

  handleFocus () {
    this.setState({
      showing: true,
      pending: NONE_PENDING,
    })
  }

  handleChange (newValue: string) {
    this.setState({
      literal: newValue,
      guesses: engine.guess(newValue),
      pending: NONE_PENDING,
    })
  }

  handleBlur () {
    const shouldShow = (this.state.literal.length > 0)
    this.setState({
      showing: shouldShow,
      pending: shouldShow ? this.state.pending : NONE_PENDING,
    })
  }

  handleSpecialKey (key: 'enter' | 'esc' | 'up' | 'down') {
    const curr = this.state.pending
    const total = this.state.guesses.length

    switch (key) {
      case 'enter':
        // TODO
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

  handleMouseEnter (index: number) {
    this.setState({
      pending: index,
    })
  }

  handleMouseLeave () {
    this.setState({
      pending: NONE_PENDING,
    })
  }

  handleClick (guess: lang.Guess, index: number) {
    // ...
  }

  render () {
    return (
      <header id="query">
        <Input
          value={this.state.literal}
          onFocus={this.handleFocus}
          onChange={this.handleChange}
          onBlur={this.handleBlur}
          onSpecialKey={this.handleSpecialKey}
        />
        <Guesses showing={this.state.showing}>
          {this.state.guesses.map((guess, i) =>
            <Guess
              key={i}
              guess={guess}
              hovered={i === this.state.pending}
              onMouseEnter={() => this.handleMouseEnter(i)}
              onMouseLeave={this.handleMouseLeave}
              onClick={(guess) => this.handleClick(guess, i)}
            />
          )}
        </Guesses>
      </header>
    )
  }
}

interface InputProps {
  value        : string
  onFocus      : () => void
  onChange     : (newValue: string) => void
  onBlur       : () => void
  onSpecialKey : (key: 'up' | 'down' | 'enter' | 'esc') => void
}

class Input extends React.PureComponent<InputProps> {
  constructor (props: InputProps) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
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
        value={this.props.value}
        onFocus={this.props.onFocus}
        onChange={this.handleChange}
        onBlur={this.props.onBlur}
        onKeyDown={this.handleKeyDown}
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
  guess       : lang.Guess
  hovered      : boolean
  onMouseEnter : () => void
  onMouseLeave : () => void
  onClick      : (guess: lang.Guess) => void
}

class Guess extends React.PureComponent<GuessProps> {
  render () {
    return (
      <li
        className={'query-guess' + (this.props.hovered ? ' hovered' : '')}
        onMouseEnter={this.props.onMouseEnter}
        onMouseLeave={this.props.onMouseLeave}
        onClick={() => this.props.onClick(this.props.guess)}
      >
        <FilterSpan name={this.props.guess.name()} />
        {(this.props.guess.hasSymbol())
            ? <OperatorSpan symbol={this.props.guess.symbol()} />
            : <OperatorSpan />}
        {(this.props.guess.hasExample())
            ? <ArgumentSpan type={this.props.guess.type()} example={this.props.guess.example()} />
            : <ArgumentSpan type={this.props.guess.type()} />}
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
