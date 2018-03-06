import * as React from 'react'
import Oracle from '../lang/oracle'
import { PredicatePlaceholder, Predicate } from '../lang/predicate'
import Grammar from '../grammar'
import { Input, SpecialKey } from './input'
import { Validator } from './validator'
import { Ghost } from './ghost'
import { Guesses, Guess } from './guesses'
import { PredicateSpan } from './predicate'
import './editor.css'

const NONE_PENDING = -1

interface EditorProps {
  onDebug : (debugging: { title: string, data: Object }[]) => void
}

interface EditorState {
  literal : string
  guesses : PredicatePlaceholder[]
  pending : number
  history : { past : string[], future : string[] },
  already : Predicate[]
}

export class Editor extends React.Component<EditorProps, EditorState> {
  private inputComponentRef : Input | null = null

  constructor (props: EditorProps) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
    this.handleSpecialKey = this.handleSpecialKey.bind(this)
    this.handlePredicateSelection = this.handlePredicateSelection.bind(this)

    this.state = {
      literal: '',
      guesses: Oracle.guess('', Grammar),
      pending: NONE_PENDING,
      history: { past: [], future: [] },
      already: [],
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

  handleClick (guess: PredicatePlaceholder) {
    this.setQuery(guess.toString())
    if (this.inputComponentRef) {
      this.inputComponentRef.focus()
    }
  }

  handlePredicateSelection (predicate: Predicate) {
    console.log(predicate)
    this.setState({
      already: this.state.already.concat(predicate),
    })
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
      <header id="editor">
        <div className="flexible">
          <p className="predicates">
            {this.state.already.map((predicate, i) => {
              return <PredicateSpan key={i} predicate={predicate} />
            })}
          </p>
          <Input
            ref={self => this.inputComponentRef = self}
            value={this.state.literal}
            onChange={this.handleChange}
            onSpecialKey={this.handleSpecialKey}
          />
        </div>
        <Validator query={this.state.literal} onClick={this.handlePredicateSelection} />
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
