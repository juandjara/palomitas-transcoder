// global error handler
const errorHandler = (err, req, res, next) => {
  if (typeof err === 'string') {
    err = { message: err }
  }
  if (process.env.ENV === 'dev') {
    console.error(err)
  } else {
    console.error(err.message)
    err.message = "Internal server error"
  }
  const statusCode = isNaN(err.code) ? 500 : err.code
  res.status(statusCode).json({ code: statusCode, error: err.message })
}

function wrapAsync (fn) {
  return async function wrappedAsyncHandler (req, res, next) {
    try {
      await fn(req, res, next)
    } catch (err) {
      errorHandler(err, req, res, next)
    }
  }
}

class ErrorWithCode extends Error {
  constructor (code, message) {
    super(message)
    this.code = code
  }
}

module.exports = { errorHandler, wrapAsync, ErrorWithCode }
