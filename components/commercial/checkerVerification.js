const vendorInvoice = require('./invoicePosting').invoicePostingClass
const emailService = require(`../../services/email/email`).emailServiceCls
const billLog = require('../../utils/logs/addBillActivity')

class CheckerVerificationClass {
    async updateVendorInvoice(transactionBatchId, status, userId) {
        try {
            var updateRes = await db.vendorInvoice.update({
                status: status,
                updated_by: userId,
                updated_on: moment().format('YYYY-MM-DD HH:mm:ss')
            }, {
                where: {
                    trn_batchid: transactionBatchId.toString()
                }
            })
            return updateRes
        } catch (e) {
            return Promise.reject(e)
        }
    }
    async updateTransactionBatchLogs(transactionBatchId, status, userId, sapRes) {
        try {
            var upadteQuery = {
                status: status,
                updated_by: userId,
                updated_on: moment().format('YYYY-MM-DD HH:mm:ss')
            }
            if (status == 'success') {
                upadteQuery.success_log = JSON.stringify(sapRes)
            } else {
                upadteQuery.error_log = JSON.stringify(sapRes)
            }
            var updateRes = await db.transactionBatchLog.update(upadteQuery, {
                where: {
                    transaction_batch_id: transactionBatchId.toString()
                }
            })
            return updateRes
        } catch (e) {
            return Promise.reject(e)
        }
    }
    async sendBatchEmail(userData, noOfRecords, batchId) {
        try {
            var emailData = await db.mailformatModel.findOne({
                where: {
                    Mail_Titile: 'Batch ID Submission'
                },
                raw: true
            })

            if (emailData) {
                var checkerName = (userData.first_name + (userData.last_name ? (' ' + userData.last_name) : ''))
                var emailBody = emailData.Mail_Body.replace(/#Commercial_Checker_Name#/g, checkerName)
                    .replace(/#N# invoices/g, noOfRecords > 1 ? noOfRecords + ' invoices' : noOfRecords + ' invoice')
                    .replace(/#date#/g, moment().format('DD-MMM-YYYY'))
                    .replace(/#Batch_ID#/g, batchId)
                var emailArr = []
                emailArr.push(userData.email_id)
                console.log(emailArr)
                var emailSubject = emailData.Mail_Subject
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
const checkerVerificationcls = new CheckerVerificationClass()

const checkerVerification = async (req, res) => {
    try {
        var reqBody = req.body

        //latest batchid wise take all success records
        //booked status
        var transIds = await db.vendorInvoice.findAll({
            attributes: [
                [db.sequelize.fn('max', db.sequelize.col('trn_batchid')), 'trn_batchid']
            ],
            raw: true,
            where: {
                bill_details_id: reqBody.bills,
                status: 'success',
                event: 'SIM'
            },
            // order: [
            //     ['trn_batchid', 'DESC']
            // ],
            group: ['bill_details_id']
        })
        var alltrIds = _.map(transIds, 'trn_batchid')
        var invoiceDetails = await db.vendorInvoice.findAll({
            where: {
                trn_batchid: alltrIds
            }
        })
        var userDetails = await db.users.findOne({
            where: {
                user_id: reqBody.userId
            },
            raw: true
        })
        var batchId = 'T-' + userDetails.token_id + '-' + moment().utcOffset('+0530').format("DDMMMYYYY@hh:mm:ss")
        var auditLogDetails = await db.auditLogExpense.create({
            File_Name: batchId,
            Upload_Date: moment().format('YYYY-MM-DD HH:mm:ss'),
            Total_No_of_Records: reqBody.bills.length,
            User: reqBody.userId
        })
        await checkerVerificationcls.sendBatchEmail(userDetails, reqBody.bills.length, batchId)
        var transactionBatchList = []
        _.forEach(reqBody.bills, bill => {
            transactionBatchList.push({
                bill_id: bill,
                created_by: reqBody.userId,
                status: 'pending',
                created_on: moment().format('YYYY-MM-DD HH:mm:ss'),
                AuditLogID: auditLogDetails.dataValues.AuditLogID
            })
        })
        var transactionBatchDetails = await db.transactionBatchLog.bulkCreate(transactionBatchList)
        var batchIds = {}
        var batchList = []
        var allInvoices = {}
        _.forEach(transactionBatchDetails, batch => {
            batchList.push(batch.dataValues.transaction_batch_id)
            batchIds[batch.dataValues.bill_id] = batch.dataValues.transaction_batch_id
        })
        var postingInv = _.map(invoiceDetails, inv => {
            allInvoices[inv.reference] = inv.bill_details_id
            inv = inv.dataValues
            delete inv.vendor_invoice_id
            inv.event = 'PST'
            inv.created_by = reqBody.userId
            inv.created_on = moment().format('YYYY-MM-DD HH:mm:ss')
            inv.trn_batchid = batchIds[inv.bill_details_id]
            inv.status = 'Pending'
            return inv;
        })
        await db.vendorInvoice.bulkCreate(postingInv)

        res.status(200).send(apiResponse.successFormat(`success`, `Reverification audit log batch Id`, {
            auditBatchId: auditLogDetails.dataValues.File_Name,
            auditId: auditLogDetails.dataValues.AuditLogID
        }, []))

        //send mail of audit log id for future ref
        // var postingFinalRes = []
        var expenseBulk = []
        var errorCount = 0
        var succesCount = 0
        var allPostingRes = await vendorInvoice.invPosting(batchList, false)
        for (let i = 0; i < allPostingRes.length; i++) {
            var postingRes = allPostingRes[i]
            var transactionId = postingRes.sapReq.TRN_BATCHID
            if (postingRes.error) {
                errorCount++;
                await checkerVerificationcls.updateVendorInvoice(transactionId, 'fail', reqBody.userId)
                await checkerVerificationcls.updateTransactionBatchLogs(transactionId, 'fail', reqBody.userId, postingRes.sapRes)
                // postingFinalRes.push({
                //     transactionBatchId: transactionId,
                //     logs: postingRes.error,
                //     flag: 'E'
                // })
            } else
            if (postingRes.isError == true) {
                errorCount++;
                await checkerVerificationcls.updateVendorInvoice(transactionId, 'fail', reqBody.userId)
                await checkerVerificationcls.updateTransactionBatchLogs(transactionId, 'fail', reqBody.userId, postingRes.sapRes)
                // postingFinalRes.push({
                //     transactionBatchId: transactionId,
                //     invoiceNumber: postingRes.simulationData[0] && postingRes.simulationData[0].invoiceNumber ? postingRes.simulationData[0].invoiceNumber : 0,
                //     logs: postingRes.simulationData,
                //     flag: 'E'
                // })
            } else {
                succesCount++;
                await checkerVerificationcls.updateVendorInvoice(transactionId, 'success', reqBody.userId)
                await checkerVerificationcls.updateTransactionBatchLogs(transactionId, 'success', reqBody.userId, postingRes.sapRes)
                try {
                    var ioDetails = await db.internalOrderData.findOne({
                        where: {
                            Internal_order_Number: postingRes.sapReq.ITEM_DETAILS[0].INTRNL_ORDR
                        }
                    })
                    console.log(ioDetails)
                    var billDetails = await db.billDetails.findOne({
                        where: {
                            [Op.or]: [{
                                    BillDetails_ID: allInvoices[postingRes.sapReq.REFERENCE]
                                },
                                {
                                    BillNo: postingRes.sapReq.REFERENCE
                                }
                            ]
                        },
                        order: [
                            ['BillDetails_ID', 'DESC']
                        ]
                    })
                    var ioMapDetails = await db.billInternalOrderMapping.findAll({
                        where: {
                            BillDetails_Id: billDetails.dataValues.BillDetails_ID
                        },
                        raw: true
                    })
                    var tdAmt = ioMapDetails && ioMapDetails.length > 0 ? _.sumBy(ioMapDetails, 'TD') : null;
                    console.log(billDetails)
                    var sgst = 0
                    var igst = 0
                    var cgst = 0
                    _.forEach(postingRes.simulationData, tx => {
                        if (tx.taxDetails) {
                            console.log(tx.taxDetails)
                            _.forEach(tx.taxDetails, tax => {
                                if (tax.taxType == 'CGST') {
                                    cgst = cgst + tax.taxAmt
                                }
                                if (tax.taxType == 'SGST') {
                                    sgst = sgst + tax.taxAmt
                                }
                                if (tax.taxType == 'IGST') {
                                    igst = igst + tax.taxAmt
                                }
                            })
                        }
                    })
                    var venAmtVal = _.find(postingRes.sapRes, ven => {
                        // ven.VEN_INV_AMT = parseFloat(ven.VEN_INV_AMT)
                        // return ven.VEN_INV_AMT > 0
                        if (1900000000 <= ven.DOC_NO && ven.DOC_NO <= 1999999999) {
                            ven.VEN_INV_AMT = parseFloat(ven.VEN_INV_AMT)
                            return ven
                        }
                    })
                    if (venAmtVal.VEN_INV_AMT) {
                        var withHoldingTaxAmt = parseFloat(venAmtVal.MESSAGE_DETAILS[0].INV_AMOUNT) - parseFloat(venAmtVal.VEN_INV_AMT)
                    } else {
                        var withHoldingTaxAmt = parseFloat(venAmtVal.MESSAGE_DETAILS[0].INV_AMOUNT)
                    }
                    console.log(withHoldingTaxAmt)
                } catch (e) {
                    console.log("while data ", e)
                }
                try {
                    var expenseData = {
                        AuditLogID: auditLogDetails.dataValues.AuditLogID,
                        Bill_Details_ID: billDetails.dataValues.BillDetails_ID,
                        Profit_Ctr: ioDetails.dataValues.Profit_center,
                        Cost_Ctr: ioDetails.dataValues.Cost_center,
                        Order_no: postingRes.sapReq.ITEM_DETAILS[0].INTRNL_ORDR,
                        Assignment: postingRes.sapReq.ITEM_DETAILS[0].ASSIGNMENT,
                        Invoice_No: venAmtVal.DOC_NO,
                        Bill_No: postingRes.sapReq.REFERENCE,
                        Document_No: venAmtVal.DOC_NO,
                        BusArea: ioDetails.dataValues.Business_Area,
                        'Posting _Date': moment(postingRes.sapReq.POST_DATE.toString()).format('YYYY-MM-DD'),
                        Doc_Date: moment(postingRes.sapReq.DOC_DATE.toString()).format('YYYY-MM-DD'),
                        Amount: billDetails.dataValues.Amount,
                        Doc_Type: postingRes.sapReq.DOC_TYPE,
                        With_tax_base_amount: postingRes.sapReq.WITH_BASE != '' ? postingRes.sapReq.WITH_BASE : 0,
                        Withholding_tax_amnt: withHoldingTaxAmt,
                        Year_Month: venAmtVal.FISC_YEAR ? venAmtVal.FISC_YEAR : moment().format('YYYY'),
                        Tax: postingRes.sapReq.ITEM_DETAILS[0].TAX_CODE,
                        Vendor: postingRes.sapReq.VEN_CODE,
                        Segment: ioDetails.dataValues.Vertical_Name,
                        CGST: cgst,
                        SGST: sgst,
                        IGST: igst,
                        TDS: withHoldingTaxAmt,
                        'Payment Amount': parseFloat(venAmtVal.VEN_INV_AMT),
                        IsPaymentDetailsUpdated: 1,
                        GST: cgst + sgst + igst,
                        TD: tdAmt ? tdAmt : billDetails.dataValues.Trade_Discount,
                        Expense_Amount: parseFloat(venAmtVal.MESSAGE_DETAILS[0].INV_AMOUNT),
                        IsReversal: 0,
                        Deviation_Reason: ""
                    }
                } catch (e) {
                    console.log("in expense", e)
                }
                expenseBulk.push(expenseData)
                try {
                    var updatebill = await db.billDetails.update({
                        status: 'B',
                        UpdatedBy: req.body.userId,
                        UpdatedOn: moment().format('YYYY-MM-DD'),
                        SAPUploadOn: moment().format('YYYY-MM-DD')
                    }, {
                        where: {
                            BillDetails_ID: billDetails.dataValues.BillDetails_ID
                        }
                    })
                } catch (e) {
                    console.log("while updateing billdetails", e)
                }
                try {
                    billLog.billActivity.addLog({
                        billDetailsId: billDetails.dataValues.BillDetails_ID,
                        activityCode: "Invoice_Booked",
                        activityDes: "Invoice Booked",
                        currStatus: "B",
                        preStatus: billDetails.dataValues.status,
                        updatedBy: req.body.userId
                    });
                } catch (e) {
                    console.log("while adding bill logs", e)
                }
                // postingFinalRes.push({
                //     transactionBatchId: batchIds[reqBody.bills[i]],
                //     docNumber: postingRes.sapRes.DOC_NO,
                //     logs: postingRes.simulationData,
                //     flag: 'S',
                //     invoiceNumber: postingRes.simulationData[0] && postingRes.simulationData[0].invoiceNumber ? postingRes.simulationData[0].invoiceNumber : 0
                // })
            }
        }
        try {
            await db.auditLogExpense.update({
                No_of_Records_added: succesCount,
                No_of_Exceptions: succesCount + errorCount == batchList.length ? errorCount : batchList.length - succesCount
            }, {
                where: {
                    AuditLogID: auditLogDetails.dataValues.AuditLogID
                }
            })
        } catch (e) {
            console.log("while updating audit expense", e)
        }
        if (expenseBulk.length > 0) {
            try {
                await db.expenseModel.bulkCreate(expenseBulk)
            } catch (e) {
                console.log("while adding in expense", e)
            }
        }
        // res.status(200).send(apiResponse.successFormat(`success`, `multiple postingRes res`, {
        //     postingFinalRes: postingFinalRes
        // }, []))
    } catch (error) {
        console.log(`error ${JSON.stringify(error)}`)
        const code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
        const response = errorResponse(error)
        res.status(code).send(response)
    }
}
module.exports = {
    checkerVerification
}