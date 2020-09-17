const bill = require('../../utils/logs/addBillActivity')
const userActivity = require('../../utils/logs/addUserActivityLog')
const moment = require('moment')

const acknowledgeInvoice = async (req, res) => {
    try {
        let reqBody = req.body
        var resData = []
        var acknowlegeErr = false;
        for (let i = 0; i < reqBody.bills.length; i++) {
            let singleRes = await db.sequelize.query(`CALL SP_acknowledgeInvoiceByCommercial(:billId,:memoId,:userId,:acknowledgeDate)`, {
                replacements: {
                    billId: reqBody.bills[i] ? reqBody.bills[i] : 0,
                    memoId: reqBody.memoId ? reqBody.memoId : 0,
                    userId: reqBody.userId ? reqBody.userId : 0,
                    acknowledgeDate: reqBody.acknowledgeDate ? reqBody.acknowledgeDate : moment().format('YYYY-MM-DD')
                },
                type: db.sequelize.QueryTypes.SELECT
            });
            if (singleRes[0][0].success) {
                resData.push({
                    billNo: singleRes[0][0].billNo,
                    success: singleRes[0][0].success
                })
                bill.billActivity.addLog({
                    billDetailsId: reqBody.bills[i],
                    activityCode: "Invoice_Acknowledged",
                    activityDes: "Invoice Acknowledged",
                    currStatus: "A",
                    preStatus: singleRes[0][0].oldStatus,
                    updatedBy: reqBody.userId
                });
                userActivity.userActivityLog.addLog({
                    activityName: "Invoice Acknowledged",
                    details: "Invoice Acknowledged :" + singleRes[0][0].billNo + "Ack Date :" + moment().format('DD-MMM-YYYY'),
                    oldValue: singleRes[0][0].oldStatus,
                    newValue: 'A',
                    userId: reqBody.userId
                });
            } else {
                acknowlegeErr = true
                resData.push({
                    billNo: singleRes[0][0].billNo,
                    err: singleRes[0][0].err ? singleRes[0][0].err : 'something went wrong'
                })
            }
        }
        if (acknowlegeErr) {
            res.status(200).send(apiResponse.errorFormat(`fail`, resData, {}, []))
        } else {
            res.status(200).send(apiResponse.successFormat(`success`, resData, {}, []))
        }
    } catch (error) {
        console.log(`something went wrong ${JSON.stringify(error)}`)
        let errorResponse = {}
        let code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500

        if (Object.prototype.hasOwnProperty.call(error, 'status')) {
            errorResponse = error
            errorResponse = _.omit(errorResponse, ['code'])
        } else {
            errorResponse = {
                status: 'fail',
                message: 'Something went wrong',
                data: {},
                error: [{
                    code: 'err_001',
                    message: errorCode.err_001
                }]
            }
        }

        res.status(code).send(errorResponse)
    }
}

module.exports.acknowledgeInvoice = acknowledgeInvoice