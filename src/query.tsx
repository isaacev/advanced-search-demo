import * as React from 'react'
import './query.css'
import Oracle, * as oracle from './lang/oracle'
import * as strings from './lang/strings'
import Grammar from './grammar'

const NONE_PENDING = -1
type SpecialKey = 'tab' | 'enter' | 'up' | 'down' | 'esc' | 'undo' | 'redo'

interface QueryProps {
  onDebug : (debugging: { title: string, data: Object }[]) => void
}

interface QueryState {
  literal : string
  guesses : oracle.Guess[]
  pending : number
  history : { past : string[], future : string[] },
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
      history: { past: [], future: [] },
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

  public setQuery (newValue: string, mutateHistory: boolean = true) {
    const guesses = Oracle.guess(newValue, Grammar)
    const literal = newValue
    const pending = (guesses.length > 0 && literal.length > 0) ? 0 : NONE_PENDING
    this.setState({
      literal,
      guesses,
      pending,
    })

    if (mutateHistory) {
      this.appendHistory(this.state.literal)
    }

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

  handleChange (newValue: string) {
    this.setQuery(newValue)
  }

  handleSpecialKey (key: SpecialKey) {
    const curr = this.state.pending
    const total = this.state.guesses.length

    switch (key) {
      case 'tab':
      case 'enter':
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
      case 'undo':
        this.undo()
        break
      case 'redo':
        this.redo()
        break
    }
  }

  handleClick (guess: oracle.Guess) {
    this.setQuery(guess.toString(false))
    if (this.inputComponentRef) {
      this.inputComponentRef.focus()
    }
  }

  appendHistory (state: string) {
    this.setState({
      history: {
        past: this.state.history.past.concat(state),
        future: [],
      },
    })
  }

  undo () {
    const depth = this.state.history.past.length
    if (depth === 0) {
      console.log('no past')
      return
    }

    const oldState = this.state.history.past[depth - 1]
    const fixedPast = this.state.history.past.slice(0, depth - 1)
    const fixedFuture = this.state.history.future.concat(this.state.literal)

    this.setQuery(oldState, false)
    this.setState({
      history: {
        past: fixedPast,
        future: fixedFuture,
      },
    })
  }

  redo () {
    const depth = this.state.history.future.length
    if (depth === 0) {
      console.log('no future')
      return
    }

    const newState = this.state.history.future[depth - 1]
    const fixedPast = this.state.history.past.concat(this.state.literal)
    const fixedFuture = this.state.history.future.slice(0, depth - 1)

    this.setQuery(newState, false)
    this.setState({
      history: {
        past: fixedPast,
        future: fixedFuture,
      },
    })
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
  onSpecialKey : (key: SpecialKey) => void
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
      13: 'enter',
      27: 'esc',
      38: 'up',
      40: 'down',
    }

    // Ctrl+Z and Ctrl+Y (Windows for undo/redo)
    const ctrlZ = (event.keyCode === 90 && event.ctrlKey)
    const ctrlY = (event.keyCode === 89 && event.ctrlKey)

    // Command+Z and Command+Shift+Z (MacOS for undo/redo)
    const cmdZ = (event.keyCode === 90 && !event.shiftKey && event.metaKey)
    const cmdShiftZ = (event.keyCode === 90 && event.shiftKey && event.metaKey)

    if (ctrlY || cmdShiftZ) {
      event.preventDefault()
      event.stopPropagation()
      this.props.onSpecialKey('redo')
    } else if (ctrlZ || cmdZ) {
      event.preventDefault()
      event.stopPropagation()
      this.props.onSpecialKey('undo')
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
  guess   : oracle.Guess
  pending : boolean
  onClick : (guess: oracle.Guess) => void
}

class Guess extends React.PureComponent<GuessProps> {
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
    const classes = 'query-guess' + (this.props.pending ? ' pending' : '')
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
