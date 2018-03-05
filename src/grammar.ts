import Grammar from './lang/grammar'
import * as strings from './lang/strings'
import { Example } from './lang/macro'

function wordToMilliseconds (word: string) {
  const MS_SEC  =   1 * 1000
  const MS_MIN  =  60 * MS_SEC
  const MS_HOUR =  60 * MS_MIN
  const MS_DAY  =  24 * MS_HOUR
  const MS_WEEK =   7 * MS_DAY
  const MS_YEAR = 365 * MS_DAY

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
    case 'yr':
    case 'yrs':
    case 'year':
    case 'years':
      return MS_YEAR
    default:
      throw new Error(`unknown word: "${word}"`)
  }
}

function formatDate (timestamp: number) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const date = new Date(timestamp)

  if (timestamp < (Date.now() - 25 * wordToMilliseconds('week'))) {
    return `${months[date.getMonth()]}. ${date.getDate()}, ${date.getFullYear()}`
  } else {
    return `${months[date.getMonth()]}. ${date.getDate()}`
  }
}

function phraseToDate (phrase: string) {
  if (phrase === 'now' || phrase === 'today') {
    return formatDate(Date.now())
  } else if (phrase === 'yesterday') {
    return formatDate(Date.now() - wordToMilliseconds('day'))
  }

  const days = /(\d+)\s+(day|days)\s+ago/i
  const weeks = /(\d+)\s+(week|weeks)\s+ago/i

  const match = (days.test(phrase))
    ? phrase.match(days)
    : (weeks.test(phrase))
      ? phrase.match(weeks)
      : null

  if (match === null) {
    return undefined
  }

  const scalarRaw = match[1]
  const unitsRaw = match[2]

  const scalarVal = parseInt(scalarRaw, 10)
  const unitsVal = wordToMilliseconds(unitsRaw)
  const timestamp = Date.now() - (scalarVal * unitsVal)
  return formatDate(timestamp)
}

class TimestampExample extends Example {
  constructor (example: string) {
    super(example, phraseToDate(example))
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
    name : 'published',
    type : 'timestamp',
  }, {
    name : 'created',
    type : 'timestamp',
  }, {
    name : 'updated',
    type : 'timestamp',
  }, {
    name : 'group',
    type : 'user',
  }, {
    name : 'status',
    type : 'status',
  }, {
    name : 'creator',
    type : 'user',
  }, {
    name : 'publisher',
    type : 'user',
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
    symbol : 'since',
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
    template : 'last login',
    type     : 'timestamp',
    resolve  : () => {
      return Date.now()
    },
    example : (tokens): Example => {
      return new Example('last login', 'Mar. 2')
    },
  }, {
    template : '<number> [day|days|week|weeks] ago',
    type     : 'timestamp',
    resolve  : (scalar, units) => {
      const scalarVal = parseInt(scalar, 10)
      const unitsVal = wordToMilliseconds(units)
      return Date.now() - (scalarVal * unitsVal)
    },
    example  : (tokens): Example | Example[] => {
      if (tokens.length === 0) {
        return [
          new TimestampExample(`5 days ago`),
          new TimestampExample(`1 week ago`),
        ]
      } else if (tokens.length === 1) {
        const scalarVal = parseInt(tokens[0], 10)
        if (scalarVal > 1) {
          return [
            new TimestampExample(`${scalarVal} days ago`),
            new TimestampExample(`${scalarVal} weeks ago`),
          ]
        } else {
          return [
            new TimestampExample(`${scalarVal} day ago`),
            new TimestampExample(`${scalarVal} week ago`),
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

        return new TimestampExample(`${scalar} ${unit} ago`)
      } else {
        return new TimestampExample(`${tokens[0]} ${tokens[1]} ago`)
      }
    },
  }, {
    template : '[now]',
    type     : 'timestamp',
    resolve  : () => Date.now(),
    example  : () => new TimestampExample('now'),
  }, {
    template : '[today]',
    type     : 'timestamp',
    resolve  : () => Date.now(),
    example  : () => new TimestampExample('today'),
  }, {
    template : '[yesterday]',
    type     : 'timestamp',
    resolve  : () => Date.now() - wordToMilliseconds('day'),
    example  : () => new TimestampExample('yesterday'),
  }, {
    template : '[me]',
    type     : 'user',
    resolve  : () => 'user1',
    example  : () => new Example('me', '@ievavold'),
  }, {
    template : '[hpotter|rweasley|hgranger]',
    type     : 'user',
    resolve  : (username) => username,
    example  : (tokens) => {
      const username = (tokens[0] || '').toLowerCase()
      return strings.thoseWithPrefix(username, ...[
        'hpotter',
        'rweasley',
        'hgranger',
      ])
    }
  }, {
    template : '[submitted|in-progress|archived]',
    type     : 'status',
    resolve  : (status) => status.toLowerCase(),
    example  : (tokens) => {
      const status = (tokens[0] || '').toLowerCase()
      return strings.thoseWithPrefix(status, ...[
        'submitted',
        'in-progress',
        'archived',
      ])
    }
  }]
})
