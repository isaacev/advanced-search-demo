import * as React from 'react'
import './input.css'

export type SpecialKey = 'tab' | 'enter' | 'up' | 'down' | 'esc' | 'undo' | 'redo'

interface InputProps {
  value        : string
  onChange     : (newValue: string) => void
  onSpecialKey : (key: SpecialKey) => void
}

export class Input extends React.PureComponent<InputProps> {
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
        id="input"
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
