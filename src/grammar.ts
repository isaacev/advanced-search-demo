import Grammar from './lang/grammar'

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
  types: [{
    name       : 'any',
    precedence : 0,
    validate   : (a) => /^.+$/.test(a),
    evaluate   : (a) => a.toString(),
  }, {
    name       : 'number',
    precedence : 1,
    supertype  : 'any',
    validate   : (n) => /^\d+$/.test(n),
    evaluate   : (n) => parseInt(n, 10),
  }, {
    name       : 'user',
    precedence : 2,
    supertype  : 'any',
    validate   : (u) => /^(user1|user2)$/i.test(u),
    evaluate   : (u) => u.toString(),
  }, {
    name       : 'timestamp',
    precedence : 2,
    supertype  : 'number',
    validate   : (n) => /^\d+$/.test(n),
    evaluate   : (n) => parseInt(n, 10),
  }],

  filters: [{
    name : 'created',
    type : 'timestamp',
  }, {
    name : 'last-updated',
    type : 'timestamp',
  }, {
    name : 'author',
    type : 'user',
  }],

  operators: [{
    symbol : '=',
    type   : 'any',
  }, {
    symbol : '!=',
    type   : 'any',
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
        return `3 days ago`
      } else if (tokens.length === 1) {
        const scalarVal = parseInt(tokens[0], 10)
        if (scalarVal > 1) {
          return `${scalarVal} days ago`
        } else {
          return `${scalarVal} day ago`
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

        return `${scalar} ${unit} ago`
      } else {
        return `${tokens[0]} ${tokens[1]} ago`
      }
    },
  }, {
    template : '[now]',
    type     : 'timestamp',
    resolve  : () => Date.now(),
    example  : () => 'now',
  }, {
    template : '[today]',
    type     : 'timestamp',
    resolve  : () => Date.now(),
    example  : () => 'today',
  }, {
    template : '[yesterday]',
    type     : 'timestamp',
    resolve  : () => Date.now() - wordToMilliseconds('day'),
    example  : () => 'yesterday',
  }, {
    template : '[me]',
    type     : 'user',
    resolve  : () => 'user1',
    example  : () => 'me',
  }]
})
