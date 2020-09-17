const errorResponse = (error) => {
  let errorResponse = {}
  if (Object.prototype.hasOwnProperty.call(error, 'status')) {
    errorResponse = error
    errorResponse = _.omit(errorResponse, ['code'])
  } else {
    errorResponse = {
      status: `fail`,
      message: `Something went wrong`,
      data: {},
      error: [{
        code: `ERR_001`,
        message: errorCode.ERR_001
      }]
    }
  }
  return errorResponse
}

module.exports = {
  errorResponse
}