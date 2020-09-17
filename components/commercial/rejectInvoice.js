const bill = require('../../utils/logs/addBillActivity')
const userActivity = require('../../utils/logs/addUserActivityLog')
const emailService = require(`../../services/email/email`).emailServiceCls
class RejectClass {
    async unTagLRToInvoice(lrNumbers) {
        try {
            console.log(lrNumbers)
            let url = `http://${process.env.BA_PORTAL_URL}/api/v1/sap/untagBaseTransaction`
            //let url = `http://localhost:8081/api/v1/sap/untagBaseTransaction`
            request.post({
                headers: {
                    'content-type': `application/json`,
                },
                url: url,
                json: true,
                body: lrNumbers
            }, (err, response, body) => {
                if (err) {
                    throw err;
                }
            })
        } catch (err) {
            throw err;
        }
    }
    async sendRejectMail(billId, userId) {
        try {
            var emailData = await db.mailformatModel.findOne({
                where: {
                    Mail_Titile: 'Invoice Rejected'
                },
                raw: true
            })
            var billData = await db.billDetails.findOne({
                where: {
                    BillDetails_ID: billId
                },
                raw: true,
                include: [{
                    model: db.ba,
                    required: true,
                    include: [{
                        model: db.users,
                        required: true
                    }]
                }]
            })
            var userData = await db.users.findOne({
                where: {
                    user_id: userId
                },
                raw: true,
            })

            if (emailData) {
                var emailBody = emailData.Mail_Body.replace(/#BA_Name#/g, billData['ba_detail.ba_name'])
                    .replace(/#number#/g, billData.BillNo)
                    .replace(/#Reason_for_rejection_remarks#/g, billData.Reason)
                var emailSubject = emailData.Mail_Subject.replace(/#number#/g, billData.BillNo)
                var emailArr = []
                emailArr.push(billData['ba_detail.user.email_id'])
                emailArr.push(userData.email_id)
                console.log(emailArr)
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
var rejectCls = new RejectClass()

const rejectInvoice = async (req, res) => {
    try {
        let reqBody = req.body
        var resData = []
        var rejectErr = false;
        var rejectLRBills = []
        if (reqBody.reason) {
            for (let i = 0; i < reqBody.bills.length; i++) {
                let singleRes = await db.sequelize.query(`CALL SP_rejectInvoiceByCommercial(:reason,:billId,:memoId,:userId,:currentStatus)`, {
                    replacements: {
                        reason: reqBody.reason ? reqBody.reason : '',
                        billId: reqBody.bills[i] ? reqBody.bills[i] : 0,
                        memoId: reqBody.memoId ? reqBody.memoId : 0,
                        userId: reqBody.userId ? reqBody.userId : 0,
                        currentStatus: reqBody.currentStatus ? reqBody.currentStatus : ''
                    },
                    type: db.sequelize.QueryTypes.SELECT
                });
                if (singleRes[0][0].success) {
                    rejectLRBills.push(reqBody.bills[i])
                    resData.push({
                        billNo: singleRes[0][0].billNo,
                        success: singleRes[0][0].success
                    })
                    rejectCls.sendRejectMail(reqBody.bills[i], reqBody.userId)
                    bill.billActivity.addLog({
                        billDetailsId: reqBody.bills[i],
                        activityCode: "Invoice_Rejected",
                        activityDes: "Invoice_Rejected",
                        currStatus: "C",
                        preStatus: singleRes[0][0].oldStatus,
                        updatedBy: reqBody.userId
                    });
                    userActivity.userActivityLog.addLog({
                        activityName: "Invoice_Rejected",
                        details: "Invoice Rejected - " + singleRes[0][0].billNo + "Memo: " + singleRes[0][0].memoNumber,
                        oldValue: singleRes[0][0].oldStatus,
                        newValue: 'C',
                        userId: reqBody.userId
                    });
                } else {
                    rejectErr = true
                    resData.push({
                        billNo: singleRes[0][0].billNo,
                        err: singleRes[0][0].err ? singleRes[0][0].err : 'something went wrong'
                    })
                }
            }
            if (rejectLRBills.length > 0) {
                var unTaggingLRs = await db.billBaseTransMapping.findAll({
                    where: {
                        Bill_details_id: rejectLRBills
                    },
                    raw: true,
                    attributes: [
                        ['Base_Transaction_Number', 'baseTransactionNumber'],
                        ['gl_number', 'glNumber']
                    ]
                })
                await rejectCls.unTagLRToInvoice(unTaggingLRs)
            }

            if (reqBody.currentStatus == 'S') {
                if (rejectErr) {
                    res.status(200).send(apiResponse.errorFormat(`fail`, resData, {}, []))
                } else {
                    res.status(200).send(apiResponse.successFormat(`success`, resData, {}, []))
                }
            } else {
                if (!_.isEmpty(resData)) {
                    if (!_.isEmpty(resData[0].success)) {
                        res.status(200).send(apiResponse.successFormat(`success`, resData[0].success, {}, []))
                    } else {
                        res.status(200).send(apiResponse.errorFormat(`fail`, resData[0].err ? resData[0].err : 'something went wrong', {}, []))
                    }
                } else {
                    res.status(200).send(apiResponse.errorFormat(`fail`, `No data found`, {}, []))
                }
            }
        } else {
            res.status(200).send(apiResponse.errorFormat(`fail`, "Please enter reason to reject invoice", {}, []))
        }
    } catch (error) {
        console.log(`error ${JSON.stringify(error)}`)
        const code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
        const response = errorResponse(error)
        res.status(code).send(response)
    }
}

module.exports.rejectInvoice = rejectInvoice