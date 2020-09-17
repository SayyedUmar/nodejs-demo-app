const billLog = require('../../utils/logs/addBillActivity')
const moment = require('moment')
const emailService = require(`../../services/email/email`).emailServiceCls
var workbook = new Excel.Workbook()

class PaymentRequest {
    calFiscalYear() {
        var allDate = {}
        if (moment().format('M') > 3) {
            allDate.startDate = moment().month('April').startOf('month').format('YYYY-MM-DD')
            allDate.endDate = moment().add(1, 'year').month('March').endOf('month').format('YYYY-MM-DD')
        } else {
            allDate.startDate = moment().subtract(1, 'year').month('April').startOf('month').format('YYYY-MM-DD')
            allDate.endDate = moment().month('March').endOf('month').format('YYYY-MM-DD')
        }
        allDate.fiscalYear = `${moment(allDate.startDate).format("YYYY")}-${moment(allDate.endDate).format("YY")}`
        return allDate;
    }
    async sendPaymentRequestMail(paymentReqNo, userId, noOfBills, filePath) {
        try {
            var emailData = await db.mailformatModel.findOne({
                where: {
                    Mail_Titile: 'Payment Request'
                },
                raw: true
            })
            var userData = await db.users.findAll({
                where: {
                    [Op.or]: [{
                        user_id: userId
                    }, {
                        Role_Id: 3
                    }]
                },
                raw: true,
            })
            if (emailData) {
                var commUser = _.find(userData, u => {
                    return u.user_id = userId
                })
                var userName = (commUser.first_name + (commUser.last_name ? (' ' + commUser.last_name) : ''))
                var emailBody = emailData.Mail_Body.replace(/#Request_Number#/g, paymentReqNo)
                    .replace(/#N#/g, noOfBills)
                    .replace(/#user#/g, userName)
                var emailSubject = emailData.Mail_Subject.replace(/#Request_Number#/g, paymentReqNo)
                var emailArr = _.map(userData, 'email_id')
                console.log(emailArr)
                // emailArr = ['kothavale.ganesh@mahindra.com']
                var resEmail = await emailService.sendEmailViaBH({
                    Mail_Subject: emailSubject,
                    Mail_Body: emailBody,
                    // Mail_Title: emailData.Mail_Titile,
                    Mail_Title: 'BAPortal',
                    ToMail_Ids: emailArr,
                    // CcMail_Ids: null,
                    Attachments: [filePath]
                    // Attachments: ["E:/APMS/APMS_TEST/HELP/BillHub BA UserManual.pdf"]
                })
                return resEmail
            }
        } catch (e) {
            console.log(e)
        }
    }
}
const paymentRequest = new PaymentRequest()
const createPaymentRequest = async (req, res) => {
    try {
        var reqBody = req.body;
        var allDate = paymentRequest.calFiscalYear()
        var payCount = await db.paymentProcessedDetails.count({
            distinct: true,
            col: 'paymentProcessedDetails.Payment_Req_No',
            where: {
                Created_On: {
                    [Op.gte]: allDate.startDate,
                    [Op.lte]: allDate.endDate
                }
            }
        })
        var lastCount = payCount > 0 ? payCount + 1 : 1
        // var costCenter = reqBody.paymentRequestData[0].costCenter.substring(reqBody.paymentRequestData[0].costCenter.length - 3)
        var paymentReqNo = `${reqBody.paymentRequestData[0].costCenter}/${lastCount.toString().padStart(5,'0')}/${moment().format('MMM')}/${allDate.fiscalYear}`
        var allPaymentReq = []
        var billDetails = await db.expenseModel.findAll({
            where: {
                Bill_Details_ID: _.map(reqBody.paymentRequestData, 'billId'),
                IsReversal: 0
            },
            raw: true,
            include: [{
                model: db.billDetails,
                required: true,
                include: [{
                    model: db.onholdBills,
                    required: false
                }]
            }, {
                model: db.ba,
                required: true
            }, {
                model: db.internalOrderData,
                required: true,
                include: [{
                    model: db.customerModel,
                    required: false
                }]
            }]
        })
        var billGrp = _.groupBy(billDetails, 'Bill_Details_ID')
        var billErrlog = {}
        var advanceDebits = []
        var excelData = []
        var billDetailsUpdate = []
        for (r = 0; r < reqBody.paymentRequestData.length; r++) {
            var pay = reqBody.paymentRequestData[r]
            var billErr = []
            if (_.isEmpty(billGrp[pay.billId])) {
                billErr.push("bill details not found")
            } else {
                var billInfo = billGrp[pay.billId][0]
                var totalPaymentRequested = billInfo['billDetail.TotalPayment_Requested']
                var preStatus = billInfo['billDetail.status']
                var totalDocPayment = 0
                for (let d = 0; d < pay.advanceDocuments.length; d++) {
                    if (pay.advanceDocuments[d].docType == 'KZ') {
                        var allAdvDoc = await db.advanceDocumentMapping.findAll({
                            where: {
                                advance_document_number: pay.advanceDocuments[d].documentNumber,
                                fiscal_year: pay.advanceDocuments[d].fiscalYear
                            },
                            raw: true,
                            attributes: ['advance_payment']
                        })
                        var allDocPayment = allAdvDoc.length > 0 ? _.sumBy(allAdvDoc, 'advance_payment') : 0
                        if (pay.advanceDocuments[d].advanceAmount < allDocPayment) {
                            billErr.push(`Advance amount utilize in all bills for ${pay.advanceDocuments[d].doumentNumber} should be less or equal to advance document amount limit`)
                        } else {
                            if (totalPaymentRequested == 0 || (totalPaymentRequested > 0 && _.isUndefined(pay.advanceDocuments[d].advanceDocumentId))) {
                                totalDocPayment += pay.advanceDocuments[d].advancePayment
                            }
                        }
                    } else {
                        if (totalPaymentRequested == 0 || (totalPaymentRequested > 0 && _.isUndefined(pay.advanceDocuments[d].advanceDocumentId))) {
                            totalDocPayment += pay.advanceDocuments[d].advancePayment
                        }
                    }
                }
                if (totalPaymentRequested + pay.paymentToBeMade + totalDocPayment > billInfo['Payment Amount']) {
                    billErr.push("payment to be made should not be greater than sum of payable amount and past payment request amount")
                }
                // if (totalPaymentRequested > 0 && (_.isEmpty(pay.abDocNo) || _.isEmpty(pay.abDocDate))) {
                //     billErr.push("AB document or AB document date is missing")
                // }
            }
            if (billErr.length == 0) {
                if (_.isEmpty(billErrlog)) {
                    allPaymentReq.push({
                        Amount: pay.paymentToBeMade + totalDocPayment,
                        BillDetails_ID: pay.billId,
                        Created_By: reqBody.userId,
                        Payment_Req_No: paymentReqNo,
                        Created_On: moment().format('YYYY-MM-DD HH:mm:ss'),
                        AB_Doc_No: pay.abDocNo,
                        AB_Doc_Date: pay.abDocDate ? moment(pay.abDocDate).format('YYYY-MM-DD HH:mm:ss') : null,
                        Status: "Open",
                        Customer_Code: billInfo['internal_order.Customer_Code']
                    })
                    excelData.push({
                        baCode: billInfo['ba_detail.ba_code'],
                        baName: billInfo['ba_detail.ba_name'],
                        billNo: billInfo['billDetail.BillNo'],
                        // krNo: pay.abDocNo ? pay.abDocNo : billInfo.Document_No,
                        krNo: billInfo.Document_No,
                        postDate: billInfo['Posting _Date'] ? moment(billInfo['Posting _Date']).format('DD-MMM-YYYY') : '',
                        busArea: billInfo.BusArea,
                        costCenter: billInfo.Cost_Ctr,
                        billAmt: billInfo['billDetail.Amount'],
                        tdPercent: (billInfo.TD * 100) / billInfo['billDetail.TaxableAmount'],
                        tdAmt: billInfo.TD,
                        tds: billInfo.TDS,
                        netpayble: billInfo['Payment Amount'],
                        paymentMade: billInfo['billDetail.TotalPayment_Requested'],
                        paymentToBeMade: pay.paymentToBeMade + totalDocPayment,
                        // refNo: pay.abDocNo ? billInfo.Document_No : '',
                        refNo: '',
                        customerName: billInfo['internal_order.customer.Customer_Name'] ? billInfo['internal_order.customer.Customer_Name'] : '',
                        vertical: billInfo['internal_order.Vertical_Name'] ? billInfo['internal_order.Vertical_Name'] : "",
                        accReason: billInfo['billDetail.onholdBills.Acc_Reason'],
                        taxReason: billInfo['billDetail.onholdBills.Tax_Reason'],
                        commercialReason: billInfo['billDetail.onholdBills.Status'],
                        generatedFrom: "Billhub"

                    })

                    _.forEach(pay.advanceDocuments, adv => {
                        if (_.isUndefined(adv.advanceDocumentId)) {
                            advanceDebits.push({
                                bill_detail_id: pay.billId,
                                advance_document_number: adv.documentNumber,
                                advance_payment: adv.advancePayment,
                                advance_tds: 0,
                                fiscal_year: adv.fiscalYear,
                                created_on: moment().format('YYYY-MM-DD HH:mm:ss'),
                                created_by: reqBody.userId,
                                doc_type: adv.docType,
                                doc_date: adv.docDate ? moment(adv.docDate).format('YYYY-MM-DD') : null,
                                post_date: adv.postDate ? moment(adv.postDate).format('YYYY-MM-DD') : null,
                                profit_center: adv.profitCenter,
                                bussiness_place: adv.businessPlace,
                                payment_req_no: paymentReqNo,
                                document_amount: adv.advanceAmount
                            })
                        }
                        if (totalPaymentRequested == 0 || (totalPaymentRequested > 0 && _.isUndefined(adv.advanceDocumentId))) {
                            excelData.push({
                                baCode: billInfo['ba_detail.ba_code'],
                                baName: billInfo['ba_detail.ba_name'],
                                billNo: billInfo['billDetail.BillNo'],
                                krNo: adv.documentNumber,
                                postDate: adv.postDate ? moment(adv.postDate).format('DD-MMM-YYYY') : '',
                                busArea: adv.businessPlace,
                                costCenter: '',
                                billAmt: -1 * adv.advancePayment,
                                tdPercent: 0,
                                tdAmt: 0,
                                tds: 0,
                                netpayble: -1 * adv.advancePayment,
                                paymentMade: billInfo['billDetail.TotalPayment_Requested'],
                                paymentToBeMade: -1 * adv.advancePayment,
                                refNo: billInfo.Document_No,
                                customerName: '',
                                accReason: '',
                                taxReason: '',
                                commercialReason: '',
                                vertical: '',
                                generatedFrom: "Billhub"
                            })
                        }
                    })

                    var currentStatus = totalPaymentRequested + pay.paymentToBeMade + totalDocPayment == billInfo['Payment Amount'] ? "R" : preStatus;
                    billDetailsUpdate.push({
                        billId: pay.billId,
                        preStatus: preStatus,
                        currentStatus: currentStatus,
                        totalPaymentRequested: totalPaymentRequested + pay.paymentToBeMade + totalDocPayment
                    })
                }
            } else {
                billErrlog[pay.billId] = {
                    billId: pay.billId,
                    billNo: pay.billNo,
                    err: billErr
                }
            }
        }
        if (_.isEmpty(billErrlog)) {
            if (!_.isEmpty(billDetailsUpdate)) {
                for (var b = 0; b < billDetailsUpdate.length; b++) {
                    var bill = billDetailsUpdate[b]
                    var billUpdate = await db.billDetails.update({
                        status: bill.currentStatus,
                        TotalPayment_Requested: bill.totalPaymentRequested,
                        PaymentRequestedOn: moment().format('YYYY-MM-DD'),
                        UpdatedBy: reqBody.userId,
                        UpdatedOn: moment().format('YYYY-MM-DD'),
                    }, {
                        where: {
                            BillDetails_ID: bill.billId
                        }
                    })
                    billLog.billActivity.addLog({
                        billDetailsId: bill.billId,
                        activityCode: "Invoice_Processed",
                        activityDes: "Payment Request is created for Invoice",
                        currStatus: bill.currentStatus,
                        preStatus: bill.preStatus,
                        updatedBy: reqBody.userId
                    });
                }
            }
            if (!_.isEmpty(allPaymentReq)) {
                var paymentRequestDetails = await db.paymentProcessedDetails.bulkCreate(allPaymentReq)
            }
            if (!_.isEmpty(advanceDebits)) {
                var advanceMappingUpdate = await db.advanceDocumentMapping.bulkCreate(advanceDebits)
            }
            if (!_.isEmpty(excelData)) {
                workbook.xlsx.readFile('public/uploads/templates/paymentRequestExcel.xlsx')
                    .then(async function () {
                        var payReqSheet = workbook.getWorksheet(1);
                        payReqSheet.getRow(1).getCell(2).value = paymentReqNo ? paymentReqNo : ''
                        payReqSheet.getRow(2).getCell(2).value = moment().format('DD-MMM-YYYY')
                        _.forEach(excelData, function (b, i) {
                            var row = payReqSheet.getRow(i + 5);
                            row.getCell(1).value = b.baCode;
                            row.getCell(2).value = b.baName;
                            row.getCell(3).value = b.billNo;
                            row.getCell(4).value = b.krNo;
                            row.getCell(5).value = b.postDate;
                            row.getCell(6).value = b.busArea;
                            row.getCell(7).value = b.costCenter;
                            row.getCell(8).value = b.billAmt;
                            row.getCell(9).value = b.tdPercent;
                            row.getCell(10).value = b.tdAmt;
                            row.getCell(11).value = b.tds;
                            row.getCell(12).value = b.netpayble;
                            row.getCell(13).value = b.paymentMade;
                            row.getCell(14).value = b.paymentToBeMade;
                            row.getCell(15).value = b.refNo;
                            row.getCell(16).value = b.customerName;
                            row.getCell(17).value = b.vertical;
                            row.getCell(18).value = b.accReason;
                            row.getCell(19).value = b.taxReason;
                            row.getCell(20).value = b.commercialReason;
                            row.getCell(21).value = b.generatedFrom;
                            row.commit();
                        })
                        var fileName = paymentReqNo.replace(/\//g, '_')
                        var filePath = `${__basedir}/public/uploads/paymentRequestExcel/${fileName}.xlsx`
                        await workbook.xlsx.writeFile(filePath);
                        paymentRequest.sendPaymentRequestMail(paymentReqNo, reqBody.userId, reqBody.paymentRequestData.length, filePath)
                        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                        res.setHeader("Content-Disposition", "attachment; filename=" + 'paymentRequest.xlsx');
                        workbook.xlsx.write(res).then(function () {
                            res.end();
                        });
                    }).catch((err) => {
                        res.status(200).send(apiResponse.errorFormat(`fail`, `error occurred while downloading excel`, {}, []))
                    })
            }
            // res.status(200).send(apiResponse.successFormat(`success`, `Payment request created successfully`, {
            //     excelLink
            // }, []))
        } else {
            res.status(200).send(apiResponse.errorFormat(`fail`, `Error occurred while creating payment request`, {}, {
                billsErr: _.toArray(billErrlog)
            }))
        }
    } catch (error) {
        console.log(`error ${JSON.stringify(error)}`)
        const code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
        const response = errorResponse(error)
        res.status(code).send(response)
    }
}

module.exports.createPaymentRequest = createPaymentRequest