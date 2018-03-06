import * as React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinnerThird, faPlus, faTimes } from '@fortawesome/fontawesome-pro-regular'
import * as timing from '../timing'
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
  query   : string,
  onClick : (predicate: Predicate) => void,
}

interface ValidatorState {
  status     : Status
  predicate? : Predicate
}

export class Validator extends React.Component<ValidatorProps, ValidatorState> {
  constructor (props: ValidatorProps) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
    this.validateQuery = timing.unaryDebounce<string>(this.validateQuery.bind(this), 250)

    this.state = {
      status: Status.hidden,
    }
  }

  handleClick () {
    if (this.state.predicate) {
      this.props.onClick(this.state.predicate)
    }
  }

  componentWillReceiveProps (nextProps: ValidatorProps) {
    const nonEmptyQuery = nextProps.query.trim().length > 0

    if (nonEmptyQuery) {
      this.validateQuery(nextProps.query)
    }

    this.setState({
      status: nonEmptyQuery ? Status.waiting : Status.hidden
    })
  }

  validateQuery (query: string) {
    try {
      const predicate = Compile.predicate(query, Grammar)
      this.setState({
        status: Status.okay,
        predicate,
      })
    } catch (err) {
      this.setState({
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
        <button onClick={this.handleClick}>
          <FontAwesomeIcon
            icon={StatusToIcon[Status[this.state.status]]}
            spin={this.state.status === Status.waiting}
          />
        </button>
      </div>
    )
  }
}
