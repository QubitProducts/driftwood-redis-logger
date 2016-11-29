# driftwood-redis-logger

A driftwood logger that persists logs to redis and provides a CLI utility for searching/streaming said logs.


## Installation

### Logger

Augment your root drifwood logger with the redis logger, giving it an instance of redis and some options:

```js
const createLogger = require('driftwood')
const createRedisLogger = require('driftwood-redis-logger')
const Redis = require('ioredis')

// Create an instance of ioredis
const redis = Redis()

// Create the redis logger as an additional logger to pass to driftwood
const additionalLoggers = [createRedisLogger(redis)]

// Create driftwood, passing in the additional loggers
module.exports = createLogger('my-app', additionalLoggers)
```

### CLI

Create a file called `bin/log` in your app that pulls in the logger CLI:

```js
#!/usr/bin/env node

// Function that returns a redis instance based on the environment given
function getRedis (environment) {
  return new Redis()
}

require('driftwood-redis-logger/cli')(getRedis)
```

After making it executable (`chmod +x ./bin/log`) you can then invoke it: `./bin/log --help`. For ease of use, you could add it to your `npm run` scripts or to a `Makefile`.


## API

### `createRedisLogger(redis, {options})`

Creates the logger. `redis` should be an instance of `ioredis`. `options` is optional, and can contain the following keys:

- `key`: key to use for the list that will contain the logs, defaults to `driftwood-logs`
- `channel`: channel to publish logs on, defaults to `driftwood-logs`
- `limit`: number of logs to keep, defaults to `100000`
- `publish`: whether to publish logs, defaults to `true`. If disabled you cannot use the stream functionality in the CLI.

### `require('driftwood-redis-logger/cli')(getRedis(environment), options)`

Runs the CLI utility. `getRedis()` should be a function that receives the current environment and returns an instance of ioredis for that environment. `options` is optional and can contain the following keys:

- `key`: key for the list that will contain the logs, defaults to `driftwood-logs`
- `channel`: channel to listen for logs on, defaults to `driftwood-logs`
