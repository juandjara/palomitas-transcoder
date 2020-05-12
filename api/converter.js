const fs = require('fs')
const axios = require('axios')
const tempy = require('tempy')
const ffmpeg = require('fluent-ffmpeg')
const { getVideoName, STORAGE_PATH } = require('./storage')

function parseDuration (timeStr) {
  const [h, m, s] = timeStr.split(':').map(Number)
  return (h * 60 * 60) + (m * 60) + s
}

async function processVideo (job, done) {
  const url = job.data.url
  job.log(`[converter.js] starting job for resource ${url}`)
  if (fs.existsSync(getVideoName(job))) {
    done(new Error(`Converted file already exists for the input url`))
    return
  }

  try {
    const res = await axios({ url, method: 'get', responseType: 'stream' })
    const tempPath = tempy.file()
    job.log(`[converter.js] Created temporary file in ${tempPath}`)
    res.data.pipe(fs.createWriteStream(tempPath))
    ffmpegCommand(tempPath, job, done)
  } catch (err) {
    console.error('error processing video', err)
    done(err)
  }
}

function ffmpegCommand (tempPath, job, done) {
  let duration = 0
  const outputFile = getVideoName(job)

  async function deleteTempFile () {
    await fs.promises.unlink(tempPath)
    job.log(`[converter.js] Deleted temporary file in ${tempPath}`)
  }

  const command = ffmpeg(tempPath)
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
      job.log(`[ffmpeg] command: ${cmd}`)
    })
    .on('error', err => {
      job.log(`[ffmpeg] ${err}`)
      done(err)
    })
    .on('codecData', data => {
      job.log(`[ffmpeg] codec-data: ${JSON.stringify(data)}`)
      duration = parseDuration(data.duration)
    })
    .on('progress', async (progress) => {
      const isActive = await job.isActive()
      if (!isActive) {
        job.log(`[converter.js] Detected inactive job #${job.id}. Stopping ffmpeg process.`)
        command.kill()
        await deleteTempFile()
        return
      }

      job.log(`[ffmpeg] progress: ${JSON.stringify(progress)}`)
      const time = parseDuration(progress.timemark)
      const percent = duration && (time / duration) * 100
      job.progress(percent)
    })
    .on('end', async () => {
      await deleteTempFile()
      job.progress(100)
      job.log(`[converter.js] Finished transcoding job for output file ${outputFile}`)
      done(null, outputFile.replace(`${STORAGE_PATH}/`, ''))
    })
    .saveToFile(outputFile)
}

module.exports = { processVideo, ffmpegCommand }
