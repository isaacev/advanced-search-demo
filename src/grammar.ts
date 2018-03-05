import Grammar from './lang/grammar'
import * as strings from './lang/strings'

function wordToMilliseconds (word: string) {
  const MS_SEC  = 1  * 1000
  const MS_MIN  = 60 * MS_SEC
  const MS_HOUR = 60 * MS_MIN
  const MS_DAY  = 24 * MS_HOUR
  const MS_WEEK =  7 * MS_DAY

  switch (word) {
    case 'sec':
    case 'secs':
    case 'second':
    case 'seconds':
      return MS_SEC
    case 'min':
    case 'mins':
    case 'minute':
    case 'minutes':
      return MS_MIN
    case 'hr':
    case 'hrs':
    case 'hour':
    case 'hours':
      return MS_HOUR
    case 'day':
    case 'days':
      return MS_DAY
    case 'wk':
    case 'wks':
    case 'week':
    case 'weeks':
      return MS_WEEK
    default:
      throw new Error(`unknown word: "${word}"`)
  }
}

export default new Grammar({
  /**
   * Types are a collection of regular expressions used to convert the raw
   * tokens in a query into more complex forms of data. Since the same token
   * can potentially be used as multiple types, each type is assigned a
   * precedence which defines the order in which types are compared. Higher
   * precedence types are compared first.
   *
   * If a token is tagged as a high precedence type and later that type is
   * found to be incompatible with a filter, the language will check if the
   * original type can be down-cast into a lower precedence type that *is*
   * compatible with the filter. If there is a legal down-cast type, convert
   * the token. If no legal down-cast is available then emit a syntax error.
   */
  types: [{
    name       : 'number',
    precedence : 1,
    validate   : (n) => /^\d+$/.test(n),
    evaluate   : (n) => parseInt(n, 10),
  }, {
    name       : 'user',
    precedence : 2,
    validate   : (u) => /^(user1|user2)$/i.test(u),
    evaluate   : (u) => u.toString(),
  }, {
    name       : 'timestamp',
    precedence : 2,
    supertype  : 'number',
    validate   : (n) => /^\d+$/.test(n),
    evaluate   : (n) => parseInt(n, 10),
  }, {
    name       : 'status',
    precedence : 2,
    validate   : (s) => /^(submitted|in-progress|archived)$/i.test(s),
    evaluate   : (s) => s.toLowerCase(),
  }],

  /**
   * Filters extract some metadata field from the post object and compare that
   * value to the filter's argument. Each filter has a type which is used to
   * determine which operators and arguments are compatible with the filter.
   */
  filters: [{
    name : 'created',
    type : 'timestamp',
  }, {
    name : 'last-updated',
    type : 'timestamp',
  }, {
    name : 'author',
    type : 'user',
  }, {
    name : 'status',
    type : 'status',
  }],

  /**
   * Operators are functions that compare the metadata extracted by a filter
   * against an argument supplied by the query. Each operator has a type which
   * describes the filters and arguments the operator is compatible with.
   */
  operators: [{
    symbol : '=',
    type   : '*',
  }, {
    symbol : '!=',
    type   : '*',
  }, {
    symbol : 'before',
    type   : 'timestamp',
  }, {
    symbol : 'after',
    type   : 'timestamp',
  }, {
    symbol : 'around',
    type   : 'timestamp',
  }],

  /**
   * Macros describe a pattern that when matched, is converted into a filter
   * argument.
   */
  macros: [{
    template : '<number> [day|days|week|weeks] ago',
    type     : 'timestamp',
    resolve  : (scalar, units) => {
      const scalarVal = parseInt(scalar, 10)
      const unitsVal = wordToMilliseconds(units)
      return Date.now() - (scalarVal * unitsVal)
    },
    example  : (tokens) => {
      if (tokens.length === 0) {
        return [
          `5 days ago`,
          `1 week ago`,
        ]
      } else if (tokens.length === 1) {
        const scalarVal = parseInt(tokens[0], 10)
        if (scalarVal > 1) {
          return [
            `${scalarVal} days ago`,
            `${scalarVal} weeks ago`,
          ]
        } else {
          return [
            `${scalarVal} day ago`,
            `${scalarVal} week ago`,
          ]
        }
      } else if (tokens.length === 2) {
        const scalar = parseInt(tokens[0], 10)
        let unit = tokens[1]

        // Make unit plural.
        if (unit[0] === 'd') {
          unit = (scalar > 1) ? 'days' : 'day'
        } else {
          unit = (scalar > 1) ? 'weeks' : 'week'
        }

        return [`${scalar} ${unit} ago`]
      } else {
        return [`${tokens[0]} ${tokens[1]} ago`]
      }
    },
  }, {
    template : '[now]',
    type     : 'timestamp',
    resolve  : () => Date.now(),
    example  : () => ['now'],
  }, {
    template : '[today]',
    type     : 'timestamp',
    resolve  : () => Date.now(),
    example  : () => ['today'],
  }, {
    template : '[yesterday]',
    type     : 'timestamp',
    resolve  : () => Date.now() - wordToMilliseconds('day'),
    example  : () => ['yesterday'],
  }, {
    template : '[me]',
    type     : 'user',
    resolve  : () => 'user1',
    example  : () => ['me'],
  }, {
    template : '[hpotter|rweasley|hgranger]',
    type     : 'user',
    resolve  : (username) => username,
    example  : (tokens) => {
      const username = (tokens[0] || '').toLowerCase()
      if (username === '') {
        return [ 'hpotter', 'rweasley', 'hgranger' ]
      } else if (strings.prefixedBy(status, 'hpotter')) {
        return [ 'hpotter' ]
      } else if (strings.prefixedBy(status, 'rweasley')) {
        return [ 'rweasley' ]
      } else if (strings.prefixedBy(status, 'hgranger')) {
        return [ 'hgranger' ]
      } else {
        return [ 'hpotter', 'rweasley', 'hgranger' ]
      }
    }
  }, {
    template : '[submitted|in-progress|archived]',
    type     : 'status',
    resolve  : (status) => status.toLowerCase(),
    example  : (tokens) => {
      const status = (tokens[0] || '').toLowerCase()
      if (status === '') {
        return [
          'submitted',
          'in-progress',
          'archived',
        ]
      } else if (strings.prefixedBy(status, 'submitted')) {
        return ['submitted']
      } else if (strings.prefixedBy(status, 'in-progress')) {
        return ['in-progress']
      } else if (strings.prefixedBy(status, 'archived')) {
        return ['archived']
      } else {
        return [
          'submitted',
          'in-progress',
          'archived',
        ]
      }
    }
  }]
})
