import * as React from 'react'
import './query.css'
import * as lang from './lang'
import Grammar from './grammar'

const engine = new lang.QueryEngine(Grammar)

const NONE_PENDING = -1

interface QueryState {
  literal : string
  choices : Choice[]
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
      choices: engine.predict('').map(c => new Choice(c)),
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
    const structure = engine.predict(newValue)
    const choices = structure.map(completion => new Choice(completion))
    this.setState({
      literal: newValue,
      choices: choices,
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
    const total = this.state.choices.length

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

  handleClick (choice: Choice, index: number) {
    // ...
  }

  render () {
    return (
      <header id="query">
        <QueryInput
          value={this.state.literal}
          onFocus={this.handleFocus}
          onChange={this.handleChange}
          onBlur={this.handleBlur}
          onSpecialKey={this.handleSpecialKey}
        />
        <QueryChoices showing={this.state.showing}>
          {this.state.choices.map((choice, i) =>
            <QueryChoice
              key={i}
              choice={choice}
              hovered={i === this.state.pending}
              onMouseEnter={() => this.handleMouseEnter(i)}
              onMouseLeave={this.handleMouseLeave}
              onClick={(choice) => this.handleClick(choice, i)}
            />
          )}
        </QueryChoices>
      </header>
    )
  }
}

interface QueryInputProps {
  value        : string
  onFocus      : () => void
  onChange     : (newValue: string) => void
  onBlur       : () => void
  onSpecialKey : (key: 'up' | 'down' | 'enter' | 'esc') => void
}

class QueryInput extends React.PureComponent<QueryInputProps> {
  constructor (props: QueryInputProps) {
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

class QueryChoices extends React.PureComponent<{ showing: boolean }> {
  render () {
    return (
      <ul id="query-choices" className={this.props.showing ? 'showing' : 'hidden'}>
        {this.props.children}
      </ul>
    )
  }
}

interface QueryChoiceProps {
  choice       : Choice
  hovered      : boolean
  onMouseEnter : () => void
  onMouseLeave : () => void
  onClick      : (choice: Choice) => void
}

class QueryChoice extends React.PureComponent<QueryChoiceProps> {
  render () {
    return (
      <li
        className={'query-choice' + (this.props.hovered ? ' hovered' : '')}
        onMouseEnter={this.props.onMouseEnter}
        onMouseLeave={this.props.onMouseLeave}
        onClick={() => this.props.onClick(this.props.choice)}
      >
        <FilterSpan name={this.props.choice.name()} />
        {(this.props.choice.operatorIsPlaceholder())
            ? <OperatorSpan />
            : <OperatorSpan symbol={this.props.choice.symbol()} />}
        {(this.props.choice.argumentIsPlaceholder())
            ? <ArgumentSpan type={this.props.choice.type()} />
            : <ArgumentSpan type={this.props.choice.type()} example={this.props.choice.example()} />}
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

class Choice {
  private completion : lang.Completion

  constructor (completion: lang.Completion) {
    this.completion = completion
  }

  name () {
    return this.completion.filter.name
  }

  operatorIsPlaceholder () {
    return (this.completion.argument instanceof lang.OperatorPlaceholder)
  }

  symbol () {
    return (this.completion.operator as lang.OperatorCompletion).symbol
  }

  argumentIsPlaceholder () {
    return (this.completion.argument instanceof lang.ArgumentPlaceholder)
  }

  type () {
    return this.completion.argument.type
  }

  example () {
    return (this.completion.argument as lang.ArgumentCompletion).example
  }
}
