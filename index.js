module.exports = function createRedisLogger (redis, options) {
  var defaults = {
    key: 'driftwood-logs',
    channel: 'driftwood-logs',
    limit: 100000,
    publish: true
  }

  options = Object.assign(defaults, options || {})

  return function redisLogger (name, level, now, components) {
    var output = {
      name: name,
      level: level,
      message: components.message,
      timestamp: now.toJSON()
    }

    if (components.metadata) output.metadata = components.metadata
    if (components.error) {
      output.error = {
        message: components.error.message,
        type: components.error.type,
        stack: components.error.stack
      }
    }

    output = JSON.stringify(output)

    redis.lpush(options.key, output).then(() => {
      redis.ltrim(options.key, 0, options.limit - 1) 
    })

    if (options.publish) {
      redis.publish(options.channel, output)
    }
  }
}
