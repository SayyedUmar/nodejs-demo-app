const bill = require('../../utils/logs/addBillActivity')
const userActivity = require('../../utils/logs/addUserActivityLog')
const moment = require('moment')
class ReverseKRClass {

}
var reverseKRClass = new ReverseKRClass()

const reverseKRFromSAP = async (req, res) => {
    try {
        var reqBody = req.body
        // for (var d = 0; d < reqBody.docList.length; d++) {
        // var docDetails = reqBody.docList[d]
        if (reqBody.docNo && reqBody.clearingDoc) {
            var billDetails = await db.expenseModel.findOne({
                where: {
                    Document_No: reqBody.docNo,
                    Bill_No: reqBody.reference
                },
                raw: true
            })
            if (!_.isEmpty(billDetails)) {
                if (billDetails.IsReversal == 0) {
                    await db.billDetails.update({
                        status: 'A',
                        ReversedOn: moment().format('YYYY-MM-DD HH:mm:ss')
                    }, {
                        where: {
                            BillDetails_ID: billDetails.Bill_Details_ID
                        }
                    })
                    await db.expenseModel.update({
                        IsReversal: 1,
                        Clearing_Date: moment().format('YYYY-MM-DD'),
                        Clearing_Doc: reqBody.clearingDoc,
                        Reversal_Document: reqBody.clearingDoc
                    }, {
                        where: {
                            Document_No: reqBody.docNo
                        }
                    })
                    bill.billActivity.addLog({
                        billDetailsId: billDetails.Bill_Details_ID,
                        activityCode: "KR_Reversed",
                        activityDes: `KR Reversed- ${reqBody.docNo} and clearing doc ${reqBody.clearingDoc} `,
                        currStatus: 'A',
                        preStatus: 'B',
                        updatedBy: 1
                    });
                    res.status(200).send(apiResponse.successFormat(`success`, `Data updated Successfully Document Number ${reqBody.docNo}`, {}, []))
                } else {
                    res.status(200).send(apiResponse.errorFormat(`fail`, `Invoice is already reversed with documnet no ${billDetails.clearingDoc}`, {
                        isError: true
                    }, []))
                }
            } else {
                res.status(200).send(apiResponse.errorFormat(`fail`, `No Data Found for ${reqBody.docNo}`, {
                    isError: true
                }, []))
            }

        } else {
            res.status(200).send(apiResponse.errorFormat(`fail`, `Invalid KR Document number  ${reqBody.docNo} and Clearing Document number ${reqBody.clearingDoc}`, {}, []))
        }

        // }
    } catch (error) {
        console.log(`error ${JSON.stringify(error)}`)
        const code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
        const response = errorResponse(error)
        res.status(code).send(response)
    }
}

module.exports.reverseKRFromSAP = reverseKRFromSAP