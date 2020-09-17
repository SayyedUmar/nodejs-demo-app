const request = require(`request`)

const apiResponse = require(`../../helper/formatResponse`)
const errorResponse = require(`../../helper/errorResponse`).errorResponse
const errorCode = require(`../../config/errorCode/errorCode`)

class Authenticate {
  authorizeApp(params, passedUserId) {
    return new Promise((resolve, reject) => {
      try {
        request.post({
          headers: {
            'Content-type': `application/json`,
            'authtoken': params.authToken,
            'userid': params.userid
          },
          url: `http://${process.env.SSO_URL}/token`,
          json: true,
          body: {
            userId: passedUserId
          }
        }, function (err, ssoResponse, body) {
          console.log(body)
          if (err) {
            console.log(`err ${err}`)
            const errorObj = {
              code: `err_99`,
              message: errorCode.err_99
            }
            // res.status(401).send(response)
            return reject(apiResponse.errorFormat(`fail`, errorCode.err_99, {}, [errorObj], 401))
          } else {
            if (ssoResponse.statusCode === 200 && ssoResponse.body.status === `success`) {
              return resolve()
            } else {
              const code = ssoResponse.statusCode
              let errObj = {
                message: errorCode.err_99,
                code: `err_99`
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

  verifyJWT(accessToken, userId) {
    return new Promise(async (resolve, reject) => {
      try {
        const verifyOptions = {
          expiresIn: "4h",
          algorithm: ['RS256']
        }
        // public key to generate jwt authToken
        const publicKey = fs.readFileSync(`${__basedir}/config/keys/public.key`, `utf8`)
        const legit = JWT.verify(accessToken, publicKey, verifyOptions)
        if (legit) {
          var usersToken = await db.users.findOne({
            where: {
              user_id: legit.userId,
              authToken: accessToken
            },
            raw: true,
            attributes: ['authToken', 'user_id']
          })
          if (legit.userId != userId || _.isEmpty(usersToken)) {
            reject(apiResponse.errorFormat(`fail`, `Invalid accesstoken`, {}, [], 401))
          } else {
            resolve()
          }
        } else {
          reject(apiResponse.errorFormat(`fail`, `Token Expired`, {}, [], 401))
        }
      } catch (e) {
        reject(apiResponse.errorFormat(`fail`, `Token Expired`, {}, [], 401))
      }
    })
  }

  validateApiKey(apikey, userId) {
    return new Promise(async (resolve, reject) => {
      try {
        var userData = await db.users.findOne({
          where: {
            user_id: userId,
            authToken: apikey
          },
          raw: true
        })
        if (userData && userData.role_id == process.env.SAP_MASTER_ROLE) {
          resolve()
        } else {
          reject({
            "Record": {
              "api_key": "null",
              "MSG_SNO": "400",
              "MSG_TYP": "E",
              "MESSAGE": "Invalid apikey",
              "Validation": "Invalid apikey"
            }
          })
        }
      } catch (e) {
        console.log(e)
        reject({
          "Record": {
            "api_key": "null",
            "MSG_SNO": "400",
            "MSG_TYP": "E",
            "MESSAGE": "Invalid apikey",
            "Validation": "Invalid apikey"
          }
        })
      }
    })
  }
}
const authenticateCls = new Authenticate()

const authenticate = async (req, res, next) => {
  try {
    if (req.headers.authtoken) {
      const authToken = req.headers.authtoken
      const appid = req.headers.appid
      const appToken = req.headers.apptoken
      const userid = req.headers.userid
      const devicetype = req.headers.devicetype
      const passedUserId = (req.body && req.body.userId) ? req.body.userId : (req.params && req.params.userId) ? req.params.userId : ''


      const params = {
        authToken,
        appid,
        appToken,
        userid,
        devicetype
      }

      await authenticateCls.authorizeApp(params, passedUserId)
      next()
    } else if (req.headers.accesstoken) {
      var accessToken = req.headers.accesstoken
      var userId = req.headers.userid
      await authenticateCls.verifyJWT(accessToken, userId)
      next()
    } else {
      throw (apiResponse.errorFormat(`fail`, `Token Misssing`, {}, [], 401))
    }
  } catch (error) {
    console.log(`error ${JSON.stringify(error)}`)
    let code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
    let response = errorResponse(error)
    res.status(code).send(response)
  }
}

const sapAuthenticate = async (req, res, next) => {
  try {
    if (req.headers['x-billhub-api-key']) {
      var userId = req.headers.userid ? req.headers.userid : process.env.SAP_MASTER_USERID;
      await authenticateCls.validateApiKey(req.headers['x-billhub-api-key'], userId)
      next()
    } else {
      throw ({
        "Record": {
          "api_key": "null",
          "MSG_SNO": "400",
          "MSG_TYP": "E",
          "MESSAGE": "Apikey missing",
          "Validation": "Apikey missing"
        }
      })
    }
  } catch (error) {
    console.log(`error ${JSON.stringify(error)}`)
    var response = _.isEmpty(error) ? {
      "Record": {
        "api_key": "null",
        "MSG_SNO": "500",
        "MSG_TYP": "E",
        "MESSAGE": _.isEmpty(error) ? `something went wrong` : error,
      }
    } : error
    res.status(500).send(response)
  }
}

module.exports = {
  authenticate,
  sapAuthenticate
}