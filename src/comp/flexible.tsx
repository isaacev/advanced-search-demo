import * as React from 'react'
import './flexible.css'

export class Flexible extends React.PureComponent {
  render () {
    return <div id="editor-flexible">{this.props.children}</div>
  }
}
