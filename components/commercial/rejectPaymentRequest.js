const bill = require('../../utils/logs/addBillActivity')
const emailService = require(`../../services/email/email`).emailServiceCls

class RejectPaymentRequest {
    async sendRejectPaymentMail(userData, invData, reason) {
        try {
            var emailData = await db.mailformatModel.findOne({
                where: {
                    Mail_Titile: 'Payment Request Rejected'
                },
                raw: true
            });

            var commercialUser = await db.users.findOne({
                where: {
                    user_id: invData[0].Created_By
                },
                raw: true,
            })
            var allAccUser = await db.users.findAll({
                where: {
                    Role_Id: 3
                },
                raw: true,
            })
            var toEmailArr = []
            if (commercialUser) {
                toEmailArr.push(commercialUser.email_id)
            }
            if (userData) {
                toEmailArr.push(userData.email_id)
            }
            if (allAccUser.length) {
                toEmailArr = _.concat(toEmailArr, _.map(allAccUser, 'email_id'))
            }
            console.log('To-', toEmailArr)
            var invoiceTable = `<table border=1><tr><th>Invoice No</th><th>KR No</th><th>Rejected Payment</th><th>Reason</th></tr>`
            _.forEach(invData, inv => {
                invoiceTable += `<tr><td>${inv['billDetail.BillNo']}</td><td>${inv['expense.Document_No']}</td><td>${inv.Amount}</td><td>${reason}</td></tr>`
            })
            invoiceTable += '</table>'
            var emailBody = emailData.Mail_Body.replace(/#user#/g, commercialUser.first_name + ' ' + commercialUser.last_name)
                .replace(/#Request_Number#/g, invData[0].Payment_Req_No)
                .replace(/#Reject_Invoice_Table#/g, invoiceTable);
            var resEmail = await emailService.sendEmailViaBH({
                Mail_Subject: emailData.Mail_Subject,
                Mail_Body: emailBody,
                // Mail_Title: emailData.Mail_Titile,
                Mail_Title: 'BAPortal',
                ToMail_Ids: _.uniq(toEmailArr)
            })
        } catch (err) {
            console.log(err)
        }
    }
}
const rejectPaymentRequestCls = new RejectPaymentRequest()
const rejectPaymentRequest = async (req, res) => {
    try {
        var reqBody = req.body
        var userDetails = await db.users.findOne({
            where: {
                user_id: reqBody.userId
            },
            raw: true
        })
        if (userDetails && _.indexOf([2, 3, 5], userDetails.role_id) > -1) {
            var resData = []
            var invData = []
            if (reqBody.paymentRequest && reqBody.paymentRequest.length > 0) {
                for (var p = 0; p < reqBody.paymentRequest.length; p++) {
                    var billErr = []
                    var payData = reqBody.paymentRequest[p]
                    var paymentProcessDeatils = await db.paymentProcessedDetails.findOne({
                        where: {
                            Process_ID: payData.paymentProcessId
                        },
                        raw: true,
                        include: [{
                            model: db.billDetails,
                            required: true,
                            where: {
                                TotalPayment_Released: 0
                            }
                        }, {
                            model: db.expenseModel,
                            required: true,
                        }]
                    })
                    if (_.isEmpty(paymentProcessDeatils)) {
                        billErr.push("payment request and bill details not found")
                    }
                    if (paymentProcessDeatils && paymentProcessDeatils.Status == 'Closed') {
                        billErr.push("payment request has already closed")
                    }
                    if (paymentProcessDeatils && paymentProcessDeatils.Status == 'Rejected') {
                        billErr.push("payment request has already rejected")
                    }
                    if (paymentProcessDeatils && paymentProcessDeatils.Status == 'Reversed') {
                        billErr.push("payment request has already reversed")
                    }
                    if (billErr.length == 0) {
                        var updatePaymentDetails = await db.paymentProcessedDetails.update({
                            Reject_Reason: reqBody.reason,
                            Status: 'Rejected'
                        }, {
                            where: {
                                Process_ID: payData.paymentProcessId
                            }
                        });
                        await db.advanceDocumentMapping.destroy({
                            where: {
                                payment_req_no: paymentProcessDeatils.Payment_Req_No,
                                bill_detail_id: paymentProcessDeatils['billDetail.BillDetails_ID']
                            }
                        });
                        var totalPaymentRequested = paymentProcessDeatils['billDetail.TotalPayment_Requested'] - paymentProcessDeatils.Amount
                        var billUpdate = await db.billDetails.update({
                            status: 'B',
                            TotalPayment_Requested: totalPaymentRequested,
                            UpdatedBy: reqBody.userId,
                            UpdatedOn: moment().format('YYYY-MM-DD')
                        }, {
                            where: {
                                BillDetails_ID: paymentProcessDeatils['billDetail.BillDetails_ID']
                            }
                        })
                        // if (paymentProcessDeatils['billDetail.status'] == 'R') {
                        bill.billActivity.addLog({
                            billDetailsId: paymentProcessDeatils['billDetail.BillDetails_ID'],
                            activityCode: "Payment_Rejected",
                            activityDes: "Payment Rejected",
                            currStatus: "B",
                            preStatus: paymentProcessDeatils['billDetail.status'],
                            updatedBy: reqBody.userId
                        });
                        // }
                        resData.push({
                            billId: payData.billId,
                            billNo: payData.billNo,
                            type: "S",
                            msg: "Payment rejected successfully"
                        })
                        invData.push(paymentProcessDeatils)
                    } else {
                        resData.push({
                            billId: payData.billId,
                            billNo: payData.billNo,
                            type: "E",
                            msg: billErr
                        })
                    }
                }
                rejectPaymentRequestCls.sendRejectPaymentMail(userDetails, invData, reqBody.reason)
                res.status(200).send(apiResponse.successFormat(`success`, `Payment request response`, resData, []))
            } else {
                res.status(200).send(apiResponse.errorFormat(`fail`, `Please add payment request to reject`, {}, []))
            }
        } else {
            res.status(200).send(apiResponse.errorFormat(`fail`, `You do not have access to reject payment`, {}, []))
        }
    } catch (error) {
        console.log(`error ${JSON.stringify(error)}`)
        const code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
        const response = errorResponse(error)
        res.status(code).send(response)
    }
}

module.exports.rejectPaymentRequest = rejectPaymentRequest