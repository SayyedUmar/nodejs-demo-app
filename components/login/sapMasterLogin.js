class SAPMasterLogin {}
var sapMasterLoginCls = new SAPMasterLogin()
const sapMasterLogin = async (req, res) => {
    try {
        var reqBody = req.body;
        if (_.isEmpty(reqBody.user) || _.isEmpty(reqBody.password)) {
            var response = {
                "Record": {
                    "api_key": "null",
                    "MSG_SNO": "400",
                    "MSG_TYP": "E",
                    "MESSAGE": "Field missing",
                    "Validation": []
                }
            }
            if (_.isEmpty(reqBody.user)) {
                response.Record.Validation.push({
                    "Key": "user",
                    "Message": "User field is required."
                })
            }
            if (_.isEmpty(reqBody.password)) {
                response.Record.Validation.push({
                    "Key": "Password",
                    "Message": "Password field is required."
                })
            }
            res.status(400).send(response)
        } else {
            var usersData = await db.users.findOne({
                where: {
                    User_Name: reqBody.user,
                    active: 1
                },
                raw: true,
                include: [{
                    model: db.roleModel,
                    required: true
                }]
            })
            if (usersData) {
                if (reqBody.password && reqBody.password === usersData.password) {
                    res.status(200).send({
                        user: {
                            "Api_key": usersData.authToken,
                            "User_ID": usersData.user_id,
                            "User_Name": usersData.user_name,
                            "Role_Name": usersData['role.Role_Name'],
                            "Role_Code": usersData['role.Role_Code'],
                            "Role_ID": usersData.role_id,
                        }
                    })
                } else {
                    res.status(400).send({
                        "Record": {
                            "api_key": "null",
                            "MSG_SNO": "400",
                            "MSG_TYP": "E",
                            "MESSAGE": "Invalid credentials",
                            "Validation": [{
                                "Key": "password",
                                "Message": "wrong password"
                            }]
                        }
                    })
                }
            } else {
                res.status(400).send({
                    "Record": {
                        "api_key": "null",
                        "MSG_SNO": "400",
                        "MSG_TYP": "E",
                        "MESSAGE": "Invalid login credentials",
                        "Validation": "Invalid login credentials"
                    }
                })
            }
        }
    } catch (error) {
        console.log(`something went wrong ${JSON.stringify(error)}`)
        let response = {
            "Record": {
                "api_key": "null",
                "MSG_SNO": "500",
                "MSG_TYP": "E",
                "MESSAGE": _.isEmpty(error) ? `something went wrong` : error,
            }
        }
        res.status(500).send(response)
    }
}
module.exports.sapMasterLogin = sapMasterLogin