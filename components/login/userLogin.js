const userActivity = require('../../utils/logs/addUserActivityLog')
class Login {
    generateAccessToken(userId) {
        // return new Promise((resolve, reject) => {
        const payload = {
            userId
        }
        const privateKey = fs.readFileSync(`${__basedir}/config/keys/private.key`, `utf8`)
        const signOptions = {
            expiresIn: "4h",
            algorithm: 'RS256'
        }
        var accessToken = JWT.sign(payload, privateKey, signOptions)
        return accessToken
        // resolve(accessToken)
        // })
    }
    updateUserToken(userId, accessToken) {
        return new Promise(async (resolve, reject) => {
            try {
                var updateUser = await db.users.update({
                    authToken: accessToken
                }, {
                    where: {
                        user_id: userId
                    }
                })
                resolve(updateUser)
            } catch (e) {
                console.log(e)
                reject(e)
            }
        })
    }
    authorizeSSO(params) {
        return new Promise((resolve, reject) => {
            try {
                request.post({
                    headers: {
                        'authToken': params.authToken,
                        'appId': params.appid,
                        'userId': params.userid,
                        'devicetype': params.devicetype
                    },
                    url: `http://${process.env.SSO_URL}/authorize`,
                    json: true
                }, function (err, ssoResponse, body) {
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
var loginCls = new Login()
const userLogin = async (req, res) => {
    try {
        var reqBody = req.body;
        var reqHeaders = req.headers
        if (reqBody.password) {
            var usersData = await db.users.findOne({
                where: {
                    User_Name: reqBody.userName,
                    active: 1
                },
                raw: true,
                include: [{
                    model: db.roleModel,
                    required: true
                }]
            })
            if (usersData) {
                var userActivityData = await db.userActivityLog.findAll({
                    where: {
                        User_ID: usersData.user_id,
                        Activity_Name: 'User_Login'
                    },
                    order: [
                        ['Time', 'DESC']
                    ],
                    limit: 5,
                    raw: true
                })
                var wrongCount = _.filter(userActivityData, n => {
                    return n.Details == 'User Login Failed'
                })
                if (wrongCount && wrongCount.length == 5 && (moment().diff(moment(wrongCount[0].Time), 'minutes') <= 30)) {
                    throw apiResponse.errorFormat(`fail`, `Your account has temporarily been locked due to failed login attempts  try after 30 minutes`, {}, [])
                } else {
                    if (reqBody.password && reqBody.password === usersData.password) {
                        var accessToken = await loginCls.generateAccessToken(usersData.user_id)
                        userActivity.userActivityLog.addLog({
                            activityName: "User_Login",
                            details: "User Login Accesstoken",
                            oldValue: usersData.authToken,
                            newValue: accessToken,
                            userId: usersData.user_id
                        });
                        await loginCls.updateUserToken(usersData.user_id, accessToken)
                        var resData = {
                            "access_token": accessToken,
                            "User_ID": usersData.user_id,
                            "User_Name": usersData.user_name,
                            "Token_ID": usersData.token_id,
                            "First_Name": usersData.first_name,
                            "Last_Name": usersData.last_name,
                            "Role_Name": usersData['role.Role_Name'],
                            "Role_Code": usersData['role.Role_Code'],
                            "Role_ID": usersData.role_id,
                            "appToken": "",
                            "authUserId": "",
                            "authToken": "",
                            "appid": ""
                        }
                        res.status(200).send(apiResponse.successFormat(`success`, 'User details', resData, []))
                    } else {
                        userActivity.userActivityLog.addLog({
                            activityName: "User_Login",
                            details: "User Login Failed",
                            oldValue: usersData.authToken,
                            newValue: "Failed",
                            userId: usersData.user_id
                        });
                        throw apiResponse.errorFormat(`fail`, `Invalid login credentials`, {}, [])
                    }
                }
            } else {
                throw apiResponse.errorFormat(`fail`, `User details not found`, {}, [])
            }
        } else {
            if (reqHeaders.authtoken && reqHeaders.userid && reqHeaders.bacode) {
                var params = {
                    authToken: reqHeaders.authtoken,
                    appid: 7,
                    userid: reqHeaders.userid,
                    devicetype: reqHeaders.devicetype ? reqHeaders.devicetype : "web"
                }
                var appData = await loginCls.authorizeSSO(params)
                var usersData = await db.users.findOne({
                    where: {
                        User_Name: reqBody.userName ? reqBody.userName : reqHeaders.bacode,
                        active: 1
                    },
                    raw: true,
                    include: [{
                        model: db.roleModel,
                        required: true
                    }]
                })
                if (usersData) {
                    userActivity.userActivityLog.addLog({
                        activityName: "User_Login",
                        details: "User Login apptoken",
                        oldValue: usersData.authToken,
                        newValue: appData,
                        userId: usersData.user_id
                    });
                    await loginCls.updateUserToken(usersData.user_id, appData)
                    var resData = {
                        "access_token": "",
                        "appid": 3,
                        "authToken": reqHeaders.authtoken,
                        "User_ID": usersData.user_id,
                        "User_Name": usersData.user_name,
                        "Token_ID": usersData.token_id,
                        "First_Name": usersData.first_name,
                        "Last_Name": usersData.last_name,
                        "Role_Name": usersData['role.Role_Name'],
                        "Role_Code": usersData['role.Role_Code'],
                        "Role_ID": usersData.role_id,
                        "appToken": appData,
                        "authUserId": reqHeaders.userid
                    }
                    res.status(200).send(apiResponse.successFormat(`success`, 'User details', resData, []))
                } else {
                    throw apiResponse.errorFormat(`fail`, `User details not found`, {}, [])
                }
            } else {
                throw apiResponse.errorFormat(`fail`, `Incorrect details`, {}, [])
            }
        }
    } catch (error) {
        console.log(`something went wrong ${JSON.stringify(error)}`)
        let code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
        let response = errorResponse(error)
        res.status(code).send(response)
    }
}
module.exports.userLogin = userLogin