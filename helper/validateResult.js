const {
  validationResult
} = require('express-validator/check')

const checkValidationResult = (req, res, next) => {
  const result = validationResult(req)
  if (result.isEmpty()) {
    return next()
  }
  const errorArray = result.array().map((ele) => {
    if (Object.prototype.hasOwnProperty.call(errorCode, ele.msg)) {
      return {
        code: ele.msg,
        message: errorCode[ele.msg]
      }
    } else {
      return {
        code: 'err_001',
        message: 'Generic Error'
      }
    }
  })

  res.status(422).send(apiResponse.errorFormat('fail', 'Invaild Request', {}, errorArray))
}

module.exports = {
  checkValidationResult
}