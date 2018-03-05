import * as React from 'react'
import { Query } from './query'

class JsonBlob extends React.PureComponent<{ title: string, data: Object }> {
  render () {
    return (
      <pre className="json-blob">
        <h2>{this.props.title}</h2>
        <code>{JSON.stringify(this.props.data, null, '  ')}</code>
      </pre>
    )
  }
}

class App extends React.Component<{}, { debugging: { title: string, data: Object }[] }> {
  constructor (props: {}) {
    super(props)
    this.state = {
      debugging: [],
    }
  }

  render() {
    return (
      <main>
        <Query onDebug={debugging => this.setState({ debugging })} />
        {this.state.debugging.map((blob, i) => {
          return <JsonBlob key={i} title={blob.title} data={blob.data} />
        })}
      </main>
    )
  }
}

export default App
