require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const logger = require('morgan')
const bodyParser = require('body-parser')
const pkg = require('./package.json')
const { wrapAsync, ErrorWithCode } = require('./errorHandler')
const Queue = require('bull')

const app = express()

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

// STEPS:
// 1. Connect to the video url and create a pipe that handles the downloading
// 2. Plug that pipe into the ffmpeg command
// 3. Get ffmpeg progress, error and complete events and send them to the queue
// 4. Save result of transcoding into a file
const ffmpeg = require('fluent-ffmpeg')
const axios = require('axios')
const tempy = require('tempy')
const del = require('del')
const fs = require('fs')

videoQueue.process(async (job, done) => {
  const url = job.data.url
  job.log(`starting job for resource ${url}`)

  try {
    const res = await axios({ url, method: 'get', responseType: 'stream' })
    const tempPath = tempy.file()
    job.log(`[tempy] Created temporary file in ${tempPath}`)
    res.data.pipe(fs.createWriteStream(tempPath))
    ffmpegCommand(tempPath, job, done)
  } catch (err) {
    console.error('error processing video', err)
    done(err)
  }
})

function parseDuration (timeStr) {
  const [h, m, s] = timeStr.split(':').map(Number)
  return (h * 60 * 60) + (m * 60) + s
}

function ffmpegCommand (path, job, done) {
  let duration = 0
  ffmpeg(path)
    .videoCodec('libvpx')
    .audioCodec('libvorbis')
    .format('webm')
    .audioBitrate(128)
    .videoBitrate(1024)
    .outputOptions([
      '-crf 17',
      '-error-resilient 1',
      '-deadline good',
      '-cpu-used 2'
    ])
    .on('start', cmd => {
      job.log(`[ffmpeg] ${cmd}`)
    })
    .on('error', err => {
      job.log(`[ffmpeg] ${err}`)
      done(err)
    })
    .on('codecData', data => {
      job.log(`[codec-data] ${JSON.stringify(data)}`)
      duration = parseDuration(data.duration)
    })
    .on('progress', (progress) => {
      job.log(`[ffmpeg] progress: ${JSON.stringify(progress)}`)
      const time = parseDuration(progress.timemark)
      const percent = duration && (time / duration) * 100
      job.progress(percent)
    })
    .on('end', async () => {
      const deleted = await del([path], { force: true })
      job.progress(100)
      job.log(`[del] Deleted temporary file in ${deleted}`)
      done()
    })
    .saveToFile('./output.webm')
}

app.get('/', (req, res) => {
  res.json({
    name: pkg.name,
    version: pkg.version,
    descriptipn: pkg.descriptipn,
    endpoints: [
      'GET /counts',
      'GET /jobs?status=&start=&end=&asc=',
      'GET /jobs/:id',
      'GET /jobs/:id/logs?start=&end=',
      'POST /job { url }',
      'DELETE /jobs?grace=1000&status=&limit='
    ]
  })
})  

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
  const job = await videoQueue.add({ time: Date.now(), url: req.body.url })
  res.json({ message: 'job added', job })
}))

app.delete('/jobs', wrapAsync(async (req, res) => {
  const gracePeriod = req.query.grace || 1000
  const limit = req.query.limit
  const status = req.query.status
  if (!status) {
    res.status(400).json({ error: 'Parameter "?status" is required. Valid values are completed, wait, active, sdelayed, and failed.' })
  }
  const ids = await videoQueue.clean(gracePeriod, status, limit)
  res.json({ message: `cleaned ${ids.length} jobs`, deleted_ids: ids })
}))

app.delete('/jobs/:id', wrapAsync(async (req, res) => {
  const job = await videoQueue.getJob(req.params.id)
  if (!job) {
    res.status(404).json({ error: 'job not found' })
  }
  await job.discard()
  await job.remove()
  res.json({ message: `deleted job with id ${job.id}` })
}))

const port = process.env.PORT || 4000
app.listen(port, () => {
  console.log(`> app is listening at port ${port}`)
})
