import * as React from 'react'
import { EditorInputState, EditorAdviceState } from './editor'
import { Ghost } from './ghost'
import './input.css'

export type SpecialKey = 'tab'
                       | 'enter'
                       | 'up'
                       | 'down'
                       | 'esc'
                       | 'undo'
                       | 'redo'
                       | 'backspace'

interface InputProps {
  input        : EditorInputState
  advice       : EditorAdviceState
  onChange     : (newValue: string) => void
  onSpecialKey : (key: SpecialKey) => void
}

export class Input extends React.PureComponent<InputProps> {
  private inputElementRef : HTMLInputElement | null

  constructor (props: InputProps) {
    super(props)

    // Bind event handlers.
    this.handleChange  = this.handleChange.bind(this)
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

    if (event.keyCode === 8 && this.props.input.value === '') {
      event.preventDefault()
      event.stopPropagation()
      this.props.onSpecialKey('backspace')
      return
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
      <div id="editor-input">
        <input
          type="text"
          autoFocus={true}
          spellCheck={false}
          value={this.props.input.value}
          onChange={this.handleChange}
          onKeyDown={this.handleKeyDown}
          ref={self => this.inputElementRef = self}
        />
        {(this.props.advice.pending !== null) && (
          <Ghost
            literal={this.props.input.value}
            pending={this.props.advice.pending}
          />
        )}
      </div>
    )
  }
}
