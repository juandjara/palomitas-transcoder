require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const helmet = require('helmet')
const logger = require('morgan')
const bodyParser = require('body-parser')
const pkg = require('./package.json')
const { wrapAsync, ErrorWithCode } = require('./errorHandler')
const Queue = require('bull')
const redisMetrics = require('./redisMetrics')
const { processVideo } = require('./converter')
const { deleteVideo } = require('./storage')
const serveIndex = require('serve-index')

app.set('json spaces', 2)
app.use(cors())
app.use(helmet())
app.use(logger('tiny'))
app.use(bodyParser.json())

const videoQueue = new Queue('video transcoding', {
  redis: {
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_HOST
  }
})
videoQueue.process(processVideo)

app.use('/files', express.static(`${__dirname}/files`), serveIndex(`${__dirname}/files`, { icons: true }))

app.get('/', (req, res) => {
  res.json({
    name: pkg.name,
    version: pkg.version,
    descriptipn: pkg.descriptipn,
    endpoints: [
      'GET /metrics',
      'GET /counts',
      'GET /jobs?status=&start=&end=&asc=',
      'GET /jobs/:id',
      'GET /jobs/:id/logs?start=&end=',
      'POST /job { url }',
      'PUT /jobs/:id/cancel',
      'DELETE /jobs?grace=1000&status=&limit=',
      'DELETE /jobs/:id'
    ]
  })
})

app.get('/metrics', wrapAsync(async (req, res) => {
  const metrics = await redisMetrics(videoQueue)
  res.json(metrics)
}))

app.get('/counts', wrapAsync(async (req, res) => {
  const counts = await videoQueue.getJobCounts()
  res.json(counts)
}))

app.get('/jobs', wrapAsync(async (req, res) => {
  const statuses = (req.query.status || '').split(',')
  const start = req.query.start // first index to fetch for every state
  const end = req.query.end     // last index to fetch for every state
  const asc = req.query.asc     // sort ascending or descending
  const jobs = await videoQueue.getJobs(statuses, start, end, asc)
  res.json(jobs)
}))

app.get('/jobs/:id', wrapAsync(async (req, res) => {
  const job = await videoQueue.getJob(req.params.id)
  if (!job) {
    res.status(404).json({ error: 'job not found' })
  }
  res.json({ job })
}))

app.get('/jobs/:id/logs', wrapAsync(async (req, res) => {
  const start = req.query.start // first index to fetch
  const end = req.query.end     // last index to fetch
  const logs = await videoQueue.getJobLogs(req.params.id, start, end)
  res.json(logs)
}))

app.post('/jobs', wrapAsync(async (req, res) => {
  const url = req.body.url
  if (!url) {
    throw new ErrorWithCode(400, 'Failed to create job. Invalid URL param')
  }
  // TODO: check if file exists and throw error
  const job = await videoQueue.add({ url: req.body.url })
  res.json({ message: 'job added', job })
}))

app.put('/jobs/:id/cancel', wrapAsync(async (req, res) => {
  const job = await videoQueue.getJob(req.params.id)
  if (!job) {
    throw new ErrorWithCode(404, 'job not found')
  }
  const isActive = await job.isActive()
  if (!isActive) {
    throw new ErrorWithCode(400, 'Only active jobs can be cancelled')
  }

  await job.discard()
  await job.moveToFailed({ message: 'Job cancelled by user' }, true)
  await job.releaseLock()
  res.json({ message: `cancelled job with id ${job.id}` })
}))

app.delete('/jobs', wrapAsync(async (req, res) => {
  const gracePeriod = req.query.grace || 1000
  const limit = req.query.limit
  const status = req.query.status
  if (!status) {
    throw new ErrorWithCode(400, 'Parameter "?status" is required. Valid values are completed, wait, active, delayed, and failed.')
  }
  const ids = await videoQueue.clean(gracePeriod, status, limit)
  res.json({ message: `cleaned ${ids.length} jobs`, deleted_ids: ids })
}))

app.delete('/jobs/:id', wrapAsync(async (req, res) => {
  const job = await videoQueue.getJob(req.params.id)
  if (!job) {
    throw new ErrorWithCode(404, 'job not found')
  }
  const isActive = await job.isActive()
  if (isActive) {
    throw new ErrorWithCode(400, 'Active jobs must be cancelled before being deleted')
  }
  await job.remove()
  await deleteVideo(job)
  res.json({ message: `deleted job with id ${job.id}` })
}))

const port = process.env.PORT || 4000
app.listen(port, () => {
  console.log(`> app is listening at port ${port}`)
})
