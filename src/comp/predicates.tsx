import * as React from 'react'
import { EditorInputState } from './editor'
import { PredicateSpan } from './predicate'
import './predicates.css'

export class Predicates extends React.PureComponent<{ input: EditorInputState }> {
  render () {
    if (this.props.input.committed.length === 0) {
      return null
    }

    return (
      <div id="editor-predicates">
        {this.props.input.committed.map((predicate, i) => {
          return <PredicateSpan key={i} predicate={predicate} />
        })}
      </div>
    )
  }
}
