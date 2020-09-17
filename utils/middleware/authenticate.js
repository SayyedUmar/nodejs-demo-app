class Authenticate {
  authorizeApp(params, passedUserId) {
    return new Promise((resolve, reject) => {
      try {
        request.post({
          headers: {
            'Content-type': `application/json`,
            'authToken': params.authToken,
            'appId': params.appid,
            'appToken': params.appToken,
            'userId': params.userid,
            'devicetype': params.devicetype
          },
          url: `http://${process.env.SSO_URL}/authorizeApp`,
          json: true,
          body: {
            userId: passedUserId
          }
        }, function (err, ssoResponse, body) {
          console.log(body)
          if (err) {
            console.log(`err ${err}`)
            const errorObj = {
              code: `err_099`,
              message: errorCode.err_099
            }
            // res.status(401).send(response)
            return reject(apiResponse.errorFormat(`fail`, errorCode.err_099, {}, [errorObj], 401))
          } else {
            if (ssoResponse.statusCode === 200 && ssoResponse.body.status === `success`) {
              console.log('************body*******', body.data)
              let result = body.data
              return resolve(result)
            } else {
              const code = ssoResponse.statusCode
              let errObj = {
                message: errorCode.err_099,
                code: `err_099`
              }
              // res.status(code).send(response)
              return reject(apiResponse.errorFormat(`fail`, `Auth token Expired`, {}, [errObj], 401))
            }
          }
        })
      } catch (error) {
        return reject(error)
      }
    })
  }
}

const authenticate = async (req, res, next) => {
  try {
    if (req.headers.authtoken) {
      console.log(`authToken ${JSON.stringify(req.headers)}`)
      const authToken = req.headers.authtoken
      const appid = req.headers.appid
      const appToken = req.headers.apptoken
      const userid = req.headers.userid
      const devicetype = req.headers.devicetype
      const passedUserId = (req.body && req.body.userId) ? req.body.userId : (req.params && req.params.userId) ? req.params.userId : ''

      const authenticateCls = new Authenticate()

      const params = {
        authToken,
        appid,
        appToken,
        userid,
        devicetype
      }

      let data = await authenticateCls.authorizeApp(params, passedUserId)
      console.log('***datat**', data)
      req.user = data
      next()
    } else {
      throw (apiResponse.errorFormat(`fail`, `AuthToken Misssing`, {}, [], 400))
    }
  } catch (error) {
    console.log(`error ${JSON.stringify(error)}`)
    let code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
    let response = errorResponse(error)
    res.status(code).send(response)
  }
}

module.exports = {
  authenticate
}