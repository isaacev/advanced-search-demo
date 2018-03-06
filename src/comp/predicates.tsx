import * as React from 'react'
import './predicates.css'

export class Predicates extends React.PureComponent {
  render () {
    return <div id="editor-predicates">{this.props.children}</div>
  }
}
