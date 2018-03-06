import * as React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinnerThird, faPlus, faTimes } from '@fortawesome/fontawesome-pro-regular'
import * as timing from '../timing'
import { EditorInputState } from './editor'
import Grammar from '../grammar'
import Compile from '../lang/compile'
import { Predicate } from '../lang/predicate'
import './validator.css'

enum Status {
  hidden,
  waiting,
  okay,
  error,
}

const StatusToIcon = {
  waiting: faSpinnerThird,
  okay: faPlus,
  error: faTimes,
}

interface ValidatorProps {
  input                  : EditorInputState,
  onCommitPredicateClick : (predicate: Predicate) => void,
}

interface ValidatorState {
  info       : string
  status     : Status
  predicate? : Predicate
}

export class Validator extends React.Component<ValidatorProps, ValidatorState> {
  constructor (props: ValidatorProps) {
    super(props)

    // Bind event handlers.
    this.handleCommitPredicateClick = this.handleCommitPredicateClick.bind(this)

    // Attach debounce timer so that Validator#validateQuery is not run
    // *every* time that the input value is changed. The input is only
    // validated once there have been no changes to the input value for
    // 250 milliseconds.
    this.validateQuery = timing.unaryDebounce<string>(this.validateQuery.bind(this), 250)

    // Initialize component state.
    this.state = {
      info: '',
      status: Status.hidden,
    }
  }

  handleCommitPredicateClick () {
    if (this.state.predicate) {
      this.props.onCommitPredicateClick(this.state.predicate)
    }
  }

  componentWillReceiveProps (nextProps: ValidatorProps) {
    const nonEmptyQuery = nextProps.input.value.trim().length > 0

    if (nonEmptyQuery) {
      this.validateQuery(nextProps.input.value)
    }

    this.setState({
      info: '',
      status: nonEmptyQuery ? Status.waiting : Status.hidden
    })
  }

  validateQuery (query: string) {
    try {
      const predicate = Compile.predicate(query, Grammar)
      this.setState({
        info: '',
        status: Status.okay,
        predicate,
      })
    } catch (err) {
      this.setState({
        info: err.message,
        status: Status.error,
      })
    }
  }

  render () {
    if (this.state.status === Status.hidden) {
      return null
    }

    return (
      <div id="validator" className={Status[this.state.status]}>
        <p className="info">{this.state.info}</p>
        <button onClick={this.handleCommitPredicateClick}>
          <FontAwesomeIcon
            icon={StatusToIcon[Status[this.state.status]]}
            spin={this.state.status === Status.waiting}
          />
        </button>
      </div>
    )
  }
}
