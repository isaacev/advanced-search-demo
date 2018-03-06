import * as React from 'react'
import { EditorAdviceState } from './editor'
import { PredicatePlaceholder } from '../lang/predicate'
import { PredicateSpan } from './predicate'
import './completions.css'

interface CompletionsProps {
  advice            : EditorAdviceState
  onCompletionClick : (completion: PredicatePlaceholder) => void
}

export class Completions extends React.PureComponent<CompletionsProps> {
  render () {
    return (
      <ul id="completions">
        {this.props.advice.completions.map((completion, i) =>
          <Completion
            key={i}
            completion={completion}
            isPending={completion === this.props.advice.pending}
            onCompletionClick={() => this.props.onCompletionClick(completion)}
          />
        )}
      </ul>
    )
  }
}

class DetailSpan extends React.PureComponent<{ detail: string }> {
  render () {
    return <span className="detail">{this.props.detail}</span>
  }
}

interface CompletionProps {
  completion        : PredicatePlaceholder
  isPending         : boolean
  onCompletionClick : () => void
}

class Completion extends React.PureComponent<CompletionProps> {
  getDetailSpan () {
    if (this.props.completion.argument.example) {
      if (this.props.completion.argument.example.detail) {
        const detail = this.props.completion.argument.example.detail
        return <DetailSpan detail={detail} />
      }
    }
    return null
  }

  render () {
    const classes = 'completion' + (this.props.isPending ? ' is-pending' : '')
    return (
      <li className={classes} onClick={this.props.onCompletionClick}>
        <PredicateSpan predicate={this.props.completion} />
        {this.getDetailSpan()}
      </li>
    )
  }
}
