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

class App extends React.Component<{}, { guesses: Object }> {
  constructor (props: {}) {
    super(props)
    this.state = {
      guesses: [],
    }
  }

  render() {
    return (
      <main>
        <Query onNewGuesses={(guesses) => this.setState({ guesses })} />
        <JsonBlob title="Guesses" data={this.state.guesses} />
      </main>
    )
  }
}

export default App
