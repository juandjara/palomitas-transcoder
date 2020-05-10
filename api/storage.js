const path = require('path')
const fs = require('fs').promises

function getVideoName (job, extension = '.webm') {
  const name = path.basename(job.data.url)
  const ext = path.extname(job.data.url)
  return name.replace(ext, extension)
}

function deleteVideo (job) {
}

module.exports = { getVideoName, deleteVideo }
