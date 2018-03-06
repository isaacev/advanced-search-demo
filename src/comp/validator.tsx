import * as React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinnerThird, faPlus, faTimes } from '@fortawesome/fontawesome-pro-regular'
import './validator.css'

export enum Status {
  waiting,
  okay,
  error,
}

const statusToIcon = {
  waiting: faSpinnerThird,
  okay: faPlus,
  error: faTimes,
}

export class Validator extends React.PureComponent<{ query: string }> {
  render () {
    const status = Status.waiting

    if (this.props.query.trim() === '') {
      return null
    }

    return (
      <div id="validator" className={Status[status]}>
        <button>
          <FontAwesomeIcon icon={statusToIcon[Status[status]]} spin={status === Status.waiting} />
        </button>
      </div>
    )
  }
}
