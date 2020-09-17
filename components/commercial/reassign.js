const userActivity = require('../../utils/logs/addUserActivityLog')
const emailService = require(`../../services/email/email`).emailServiceCls
class ReassignClass {
    async sendReassignMail(memoDetails, submitToId) {
        try {
            var emailData = await db.mailformatModel.findOne({
                where: {
                    Mail_Titile: 'MEMO Reassigned'
                },
                raw: true
            })
            var users = []
            users.push(submitToId)
            users.push(memoDetails.Submit_To_ID)
            var userData = await db.users.findAll({
                where: {
                    user_id: users
                },
                raw: true,
            })
            var baData = await db.ba.findOne({
                where: {
                    ba_id: memoDetails.BA_Code
                },
                raw: true,
                include: [{
                    model: db.users,
                    required: true
                }]
            })
            var billCount = await db.billDetails.count({
                where: {
                    MemoID: memoDetails.Memo_ID
                }
            })
            if (emailData) {
                var emailArr = []
                var submitToName = ""
                var preSubmitToName = ""
                _.forEach(userData, u => {
                    if (u.user_id == submitToId) {
                        submitToName = (u.first_name + (u.last_name ? (' ' + u.last_name) : ''))
                    } else {
                        preSubmitToName = (u.first_name + (u.last_name ? (' ' + u.last_name) : ''))
                    }
                    emailArr.push(u.email_id)
                })
                emailArr.push(baData['user.email_id'])
                console.log(emailArr)
                // emailArr = ['kothavale.ganesh@mahindra.com']
                // console.log(emailArr)
                var emailBody = emailData.Mail_Body.replace(/#Submitted_To_Name#/g, submitToName)
                    .replace(/#MEMO_No#/g, memoDetails.Memo_Number)
                    .replace(/#PRE_Submitted_To_Name#/g, preSubmitToName)
                    .replace(/#BA_NAME#/g, baData.ba_name)
                    .replace(/#n#/g, billCount)
                var emailSubject = emailData.Mail_Subject.replace(/#MEMO_No#/g, memoDetails.Memo_Number)
                var resEmail = await emailService.sendEmailViaBH({
                    Mail_Subject: emailSubject,
                    Mail_Body: emailBody,
                    // Mail_Title: emailData.Mail_Titile,
                    Mail_Title: 'BAPortal',
                    ToMail_Ids: emailArr,
                    // CcMail_Ids: null
                })
                return resEmail
            }
        } catch (e) {
            console.log(e)
        }
    }
}
const reassignClass = new ReassignClass()

const reassignMemo = async (req, res) => {
    try {
        var reqBody = req.body;
        let memoDetails = await db.memoDetails.findOne({
            where: {
                Memo_ID: reqBody.memoId,
                Submit_To_ID: reqBody.userId
            }
        })
        if (memoDetails && memoDetails.dataValues) {
            await db.memoDetails.update({
                Submit_To_ID: reqBody.submitToId,
                Submittion_Location_Code: reqBody.submittionLocationCode
            }, {
                where: {
                    Memo_ID: reqBody.memoId
                },
            }).then(result => {
                console.log(result)
                if (result && result[0] > 0) {
                    res.status(200).send(apiResponse.successFormat(`success`, `Memo reassigned successfully`, {}, []))
                    userActivity.userActivityLog.addLog({
                        activityName: "Memo_Reassigned",
                        details: "Memo Reassigned - Memo: " + memoDetails.dataValues.Memo_Number + `(${memoDetails.dataValues.Memo_ID})`,
                        oldValue: memoDetails.dataValues.Submit_To_ID,
                        newValue: reqBody.submitToId,
                        userId: reqBody.userId
                    });
                    reassignClass.sendReassignMail(memoDetails.dataValues, reqBody.submitToId)
                } else {
                    res.status(200).send(apiResponse.successFormat(`success`, `Memo alredy reassigned`, {}, []))
                }
            }).catch(err => {
                res.status(200).send(apiResponse.errorFormat(`fail`, `Error occured while reassigning`, {}, []))
            })
        } else {
            res.status(200).send(apiResponse.errorFormat(`fail`, `You can not reassign memo as it has not submitted to you`, {}, []))
        }
    } catch (error) {
        console.log(`error ${JSON.stringify(error)}`)
        const code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
        const response = errorResponse(error)
        res.status(code).send(response)
    }
}

module.exports = {
    reassignMemo
}