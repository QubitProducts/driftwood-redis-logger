var program = require('commander')
var stripAnsi = require('strip-ansi')
var levels = require('driftwood').LEVELS
var wildstring = require('wildstring')
var chalk = require('chalk')
var logger = require('driftwood/src/logger/node')()

process.on('unhandledException', (err) => { throw err })

var fieldsToMatch = ['name', 'message', 'timestamp']
var levelColors = {
  trace: 'gray',
  debug: 'green',
  info: 'blue',
  warn: 'yellow',
  error: 'red'
}

module.exports = function cli (getRedis, options) {
  var defaults = {
    key: 'driftwood-logs',
    channel: 'driftwood-logs'
  }

  options = Object.assign(defaults, options || {})

  program
    .option('-f, --stream', 'Stream realtime logs')
    .option('-n, --limit [limit]', 'Tail the last n logs', parseInt)
    .option('-p, --pattern [pattern]', 'Only output logs that match the specified wildstring pattern')
    .option('-l, --level [level]', 'Only output logs above a level')
    .option('-e, --environment [environment]', 'Environment to read logs from. Defaults to production.')
    .parse(process.argv)

  var limit = program.limit || 100
  var pattern = program.pattern
  var level = program.level
  var environment = program.environment || 'production'

  process.env.NODE_ENV = environment

  var redis = getRedis(environment)

  tail()
    .then(() => {
      if (program.stream) {
        return stream()
      }
    })
    .finally(() => redis.quit())


  function tail () {
    return redis.lrange(options.key, 0, limit-1).then((results) => {
      results.reverse().forEach(output)
    })
  }

  function stream () {
    redis.on('message', (channel, message) => {
      if (channel === options.channel) {
        output(message)
      }
    })
    return redis.subscribe(options.channel).then(() => new Promise(() => {}))
  }

  function output (rawLog) {
    let log
    try {
      log = JSON.parse(rawLog)
    } catch (e) {
      return
    }

    if (typeof log !== 'object' || !log) {
      return
    }

    if (pattern && !matches(log)) {
      return
    }

    if (level && levels.indexOf(level) > levels.indexOf(log.level)) {
      return
    }

    logger(log.name, log.level, new Date(log.timestamp), {
      error: log.error,
      metadata: log.metadata,
      message: log.message
    })
  }
}

function matches (log) {
  return fieldsToMatch.some((field) => {
    var value = log[field] || ''
    return wildstring.match(pattern, stripAnsi(field).toLowerCase())
  })
}
