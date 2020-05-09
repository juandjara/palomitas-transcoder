const { parse: parseRedisInfo } = require('redis-info')

const metrics = [
  'redis_version',
  'used_memory',
  'mem_fragmentation_ratio',
  'connected_clients',
  'blocked_clients',
]

const getStats = async queue => {
  const redisClient = await queue.client
  const redisInfoRaw = await redisClient.info()
  const redisInfo = parseRedisInfo(redisInfoRaw)

  const validMetrics = metrics.reduce((acc, metric) => {
    if (redisInfo[metric]) {
      acc[metric] = redisInfo[metric]
    }

    return acc
  }, {})

  validMetrics.total_system_memory =
    redisInfo.total_system_memory || redisInfo.maxmemory

  return validMetrics
}

module.exports = getStats
