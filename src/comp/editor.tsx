import * as React from 'react'
import Oracle from '../lang/oracle'
import { PredicatePlaceholder, Predicate } from '../lang/predicate'
import Grammar from '../grammar'
import Validate from '../lang/validate'
import { Ghost } from './ghost'
import { Input, SpecialKey } from './input'
import { Validator } from './validator'
import { Completions } from './completions'
import { Flexible } from './flexible'
import { Predicates } from './predicates'
import './editor.css'

export class EditorInputState {
  public value     : string
  public committed : Predicate[]

  constructor (value: string, committed: Predicate[]) {
    this.value = value
    this.committed = committed
  }

  setValue (newValue: string) {
    return new EditorInputState(newValue, this.committed)
  }

  commitPredicate (predicate: Predicate) {
    return new EditorInputState('', this.committed.concat(predicate))
  }

  popPredicate () {
    const total = this.committed.length
    if (total === 0) {
      console.log('nothing to pop')
      return new EditorInputState('', this.committed)
    }

    const popped = this.committed[total - 1]
    return new EditorInputState(popped.toString(), this.committed.slice(0, total - 1))
  }
}

export class EditorAdviceState {
  public index       : number | null
  public pending     : PredicatePlaceholder | null
  public completions : PredicatePlaceholder[]

  constructor (pending: 'none' | number, completions: PredicatePlaceholder[]) {
    this.index = null
    this.pending = null
    if (completions.length > 0) {
      if (typeof pending === 'number' && pending < completions.length && pending >= 0) {
        this.index = pending
        this.pending = completions[pending]
      }
    }
    this.completions = completions
  }

  setPending (change: 'none' | 'up' | 'down') {
    if (change === 'none' || this.completions.length === 0) {
      return new EditorAdviceState('none', this.completions)
    }

    if (this.index === null || this.index < 0 || this.index >= this.completions.length) {
      return new EditorAdviceState(0, this.completions)
    } else if (change === 'up') {
      const newIndex = Math.max(0, this.index - 1)
      return new EditorAdviceState(newIndex, this.completions)
    } else {
      const newIndex = Math.min(this.completions.length - 1, this.index + 1)
      return new EditorAdviceState(newIndex, this.completions)
    }
  }

  toJSON (): Object {
    return this.completions
  }
}

interface EditorProps {
  onDebug : (debugging: { title: string, data: Object }[]) => void
}

interface EditorState {
  input   : EditorInputState
  advice  : EditorAdviceState
  history : {
    past   : EditorInputState[],
    future : EditorInputState[],
  },
}

export class Editor extends React.Component<EditorProps, EditorState> {
  private inputComponentRef : Input | null = null

  constructor (props: EditorProps) {
    super(props)

    // Bind event handlers.
    this.handleInputChange          = this.handleInputChange.bind(this)
    this.handleInputSpecialKey      = this.handleInputSpecialKey.bind(this)
    this.handleCommitPredicateClick = this.handleCommitPredicateClick.bind(this)
    this.handleCompletionClick      = this.handleCompletionClick.bind(this)

    // Initialize component state.
    this.state = {
      input: new EditorInputState('', []),
      advice: new EditorAdviceState('none', []),
      history: {
        past: [],
        future: [],
      },
    }
  }

  componentDidMount () {
    this.updateAdvice()
  }

  render () {
    return (
      <header id="editor">
        <Flexible>
          <Predicates input={this.state.input} />
          <Input
            ref={self => this.inputComponentRef = self}
            input={this.state.input}
            advice={this.state.advice}
            onChange={this.handleInputChange}
            onSpecialKey={this.handleInputSpecialKey}
          />
          <Validator
            input={this.state.input}
            onCommitPredicateClick={this.handleCommitPredicateClick}
          />
        </Flexible>
        <Completions
          advice={this.state.advice}
          onCompletionClick={this.handleCompletionClick}
        />
      </header>
    )
  }

  private focusOnInput () {
    if (this.inputComponentRef) {
      this.inputComponentRef.focus()
    }
  }

  private updateDebug (inputState: EditorInputState, adviceState: EditorAdviceState) {
    const predicate = Validate.predicate(inputState.value, Grammar)
    this.props.onDebug([{
      title: 'Input',
      data: {
        valid: !!predicate,
        query: predicate ? predicate : undefined,
      },
    }, {
      title: 'Completions',
      data: adviceState.completions,
    }, {
      title: 'Grammar',
      data: Grammar,
    }])
  }

  private updateAdvice (inputState: EditorInputState = this.state.input) {
    const completions = Oracle.guess(inputState.value, Grammar)
    const newAdviceState = new EditorAdviceState(0, completions)
    this.setState({ advice: newAdviceState })
    this.updateDebug(inputState, newAdviceState)
  }

  private updateInput (newValue: EditorInputState) {
    this.historyDo()
    this.updateInputWithoutMutatingHistory(newValue)
  }

  private updateInputWithoutMutatingHistory (newInputState: EditorInputState) {
    this.setState({ input: newInputState })
    this.updateAdvice(newInputState)
  }

  private handleInputChange (newValue: string) {
    this.updateInput(this.state.input.setValue(newValue))
  }

  private handleInputSpecialKey (key: SpecialKey) {
    switch (key) {
      case 'backspace':
        if (this.state.input.value === '') {
          this.updateInput(this.state.input.popPredicate())
        }
        break
      case 'tab':
        if (this.state.advice.pending) {
          const value = this.state.input.value
          const pending = this.state.advice.pending
          const ghost = Ghost.getGhost(value, pending)
          this.updateInput(this.state.input.setValue(value + ghost))
        }
        break
      case 'enter':
        const predicate = Validate.predicate(this.state.input.value, Grammar)
        if (predicate) {
          this.handleCommitPredicateClick(predicate)
        }
        break
      case 'esc':
        this.setState({ advice: this.state.advice.setPending('none') })
        break
      case 'up':
        this.setState({ advice: this.state.advice.setPending('up') })
        break
      case 'down':
        this.setState({ advice: this.state.advice.setPending('down') })
        break
      case 'undo':
        this.historyUndo()
        break
      case 'redo':
        this.historyRedo()
        break
    }
  }

  private handleCompletionClick (completion: PredicatePlaceholder) {
    const newInputState = this.state.input.setValue(completion.toString())
    this.updateInput(newInputState)
    this.focusOnInput()
  }

  private handleCommitPredicateClick (predicate: Predicate) {
    const newInputState = this.state.input.commitPredicate(predicate)
    this.updateInput(newInputState)
    this.focusOnInput()
  }

  private historyUndo () {
    const depth = this.state.history.past.length
    if (depth === 0) {
      return
    }

    const oldState = this.state.history.past[depth - 1]
    const fixedPast = this.state.history.past.slice(0, depth - 1)
    const fixedFuture = this.state.history.future.concat(this.state.input)

    this.updateInputWithoutMutatingHistory(oldState)
    this.setState({
      history: {
        past: fixedPast,
        future: fixedFuture,
      },
    })
  }

  private historyDo () {
    const fixedPast = this.state.history.past.concat(this.state.input)
    this.setState({
      history: {
        past: fixedPast,
        future: [],
      },
    })
  }

  private historyRedo () {
    const depth = this.state.history.future.length
    if (depth === 0) {
      return
    }

    const newState = this.state.history.future[depth - 1]
    const fixedPast = this.state.history.past.concat(this.state.input)
    const fixedFuture = this.state.history.future.slice(0, depth - 1)

    this.updateInputWithoutMutatingHistory(newState)
    this.setState({
      history: {
        past: fixedPast,
        future: fixedFuture,
      },
    })
  }
}
