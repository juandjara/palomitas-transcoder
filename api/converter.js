const ffmpeg = require('fluent-ffmpeg')
const del = require('del')
const { getVideoName } = require('./storage')

function parseDuration (timeStr) {
  const [h, m, s] = timeStr.split(':').map(Number)
  return (h * 60 * 60) + (m * 60) + s
}

function ffmpegCommand (path, job, done) {
  let duration = 0
  const command = ffmpeg(path)
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
    .on('progress', async (progress) => {
      const isActive = await job.isActive()
      if (!isActive) {
        job.log(`[converter.js] Detected inactive job #${job.id}. Stopping ffmpeg process.`)
        command.kill()
        return
      }

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
    .saveToFile(getVideoName(job))
}

module.exports = { ffmpegCommand }
