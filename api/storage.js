const path = require('path')
const fs = require('fs').promises

const STORAGE_PATH = './files'

function getVideoName (job, extension = '.webm') {
  const urlFilename = path.basename(job.data.url)
  const ext = path.extname(job.data.url)  
  const outputFilename = decodeURIComponent(urlFilename.replace(ext, '')) + extension
  return path.join(STORAGE_PATH, outputFilename)
}

function deleteVideo (job) {
  const file = getVideoName(job)
  return fs.unlink(file)
}

module.exports = { STORAGE_PATH, getVideoName, deleteVideo }
