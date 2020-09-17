const bill = require('../../utils/logs/addBillActivity')
const moment = require('moment')

class OpenItemsClass {
    covertAmount(amt) {
        return amt.indexOf("-") > -1 ? parseFloat(amt) * -1 : parseFloat(amt)
    }
    async addAuditLog(records) {
        try {
            return await db.auditLogPayment.create({
                File_Name: 'T-' + "admin" + '-' + moment().utcOffset('+0530').format("DDMMMYYYY@hh:mm:ss"),
                Upload_Date: moment().format('YYYY-MM-DD HH:mm:ss'),
                User: 1,
                Total_No_of_Records: records ? records.length : 0
            })
        } catch (e) {
            console.log(e)
        }
    }
    async deleteAllOpenPayments() {
        try {
            return await db.openPayments.destroy({
                truncate: true,
                cascade: false
            })
        } catch (e) {
            console.log(e)
        }
    }
    async formatOpenPayment(allRecords, auditLogDetails) {
        try {
            var allOpenPayments = []
            _.forEach(allRecords, record => {
                if (record.DOC_NO) {
                    allOpenPayments.push({
                        co_code: record.CO_CODE,
                        fiscal_year: record.FISC_YEAR,
                        gl_id: record.GL_ID,
                        post_date: record.POST_DATE == '9999-12-31' ? null : moment(record.POST_DATE).format('YYYY-MM-DD'),
                        doc_date: record.DOC_DATE == '9999-12-31' ? null : moment(record.DOC_DATE).format('YYYY-MM-DD'),
                        reference: record.REFERENCE,
                        header_text: record.HEADER_TEXT,
                        doc_type: record.DOC_TYPE,
                        doc_no: record.DOC_NO,
                        doc_item_no: record.DOC_ITEM_NO,
                        ven_code: parseInt(record.VEN_CODE),
                        recon_gl: record.RECON_GL,
                        base_date: record.BASE_DATE == '9999-12-31' ? null : moment(record.BASE_DATE).format('YYYY-MM-DD'),
                        profit_center: record.PROFIT_CENTER,
                        amt_transaction: this.covertAmount(record.AMT_TRANS),
                        currency: record.CURRENCY,
                        special_gl: record.SPECIAL_GL,
                        business_place: record.BUPLA,
                        item_text: record.TEXT,
                        assignment: record.ASSIGNMENT,
                        entry_date: record.ENTRY_DATE == '9999-12-31' ? null : moment(record.ENTRY_DATE).format('YYYY-MM-DD'),
                        inv_reference: record.INV_REFERENCE,
                        inv_ref_fy: record.INV_REF_FY,
                        clear_doc_no: record.CLEAR_DOC_NO,
                        clear_fy: record.CLEAR_FY == '0000' ? null : record.CLEAR_FY,
                        clear_date: record.CLEAR_DATE == '9999-12-31' ? null : moment(record.CLEAR_DATE).format('YYYY-MM-DD'),
                        audit_log_id: auditLogDetails.dataValues.AuditLogID,
                        created_by: 1,
                        created_on: moment().format('YYYY-MM-DD HH:mm:ss')
                    })
                }
            })
            return allOpenPayments
        } catch (e) {
            console.log(e)
        }
    }
    async insertOpenPayment(allOpenPayments) {
        try {
            var openPaymentsCreate = await db.openPayments.bulkCreate(allOpenPayments, {})
            return openPaymentsCreate
        } catch (e) {
            console.log(e)
        }
    }
    async updateAuditLog(auditLogDetails, records, addedRecords) {
        try {
            return await db.auditLogPayment.update({
                No_of_Records_added: addedRecords,
                No_of_Exceptions: records - addedRecords
            }, {
                where: {
                    AuditLogID: auditLogDetails.dataValues.AuditLogID
                }
            })
        } catch (e) {
            console.log(e)
        }
    }
    async groupByKR() {
        try {
            let paymentGroup = await db.sequelize.query(`CALL SP_GroupPaymentByKR()`, {
                replacements: {},
            });
            var groupByKR = _.groupBy(paymentGroup, k => {
                return `${k.doc_no}_${k.fiscal_year}_${k.ven_code}`
            })
            var openKr = []
            var partialKr = []
            _.forEach(groupByKR, (n, i) => {
                // console.log(i)
                // console.log(n[0].p_open_payment_id)
                var partialIndex = _.findIndex(n, p => {
                    return p.p_open_payment_id != null
                })
                if (partialIndex > -1) {
                    partialKr.push(n)
                } else {
                    openKr.push(n)
                }
            })
            return {
                groupByKR,
                openKr,
                partialKr
            }
        } catch (e) {
            console.log(e)
        }
    }
    async updateFullOpen(openKr) {
        try {
            for (let o = 0; o < openKr.length; o++) {
                var krData = openKr[o]
                if (krData[0].TotalPayment_Released > 0) {
                    var TotalPayment_Requested = krData[0].TotalPayment_Requested - _.sumBy(openKr[o], p => {
                        return p.py_amount ? p.py_amount : 0
                    })
                    var updateBills = await db.billDetails.update({
                        TotalPayment_Requested: TotalPayment_Requested,
                        TotalPayment_Released: 0,
                        status: krData[0]['Payment Amount'] == TotalPayment_Requested ? 'R' : 'B'
                    }, {
                        where: {
                            BillDetails_ID: krData[0].billId
                        }
                    })
                    for (let a = 0; a < krData.length; a++) {
                        //doubt
                        if (krData[a].advance_document_id) {
                            var advanceDocument = await db.advanceDocumentMapping.destroy({
                                where: {
                                    advance_document_id: krData[a].advance_document_id
                                }
                            })
                        }
                        if (krData[a].py_id) {
                            var paymentUpdate = await db.paymentModel.update({
                                Status: 'Reversed'
                            }, {
                                where: {
                                    ID: krData[a].py_id,
                                    Status: "Released"
                                }
                            })
                        }
                    }

                    //doubt 
                    var paymentProcessedUpdate = await db.paymentProcessedDetails.update({
                        Status: 'Reversed'
                    }, {
                        where: {
                            BillDetails_ID: krData[0].billId,
                            Status: "Closed"
                        }
                    })
                    bill.billActivity.addLog({
                        billDetailsId: krData[0].billId,
                        activityCode: "Payment_Reversed",
                        activityDes: `Payment Reversed - ${krData[0].doc_no}`,
                        currStatus: krData[0]['Payment Amount'] == TotalPayment_Requested ? 'R' : 'B',
                        preStatus: krData[0].billStatus,
                        updatedBy: 1
                    });
                }
            }
        } catch (e) {
            console.log(e)
        }
    }
    async updatePartialKr(partialKr, auditLogDetails) {
        var paymentDocType = ['AB', 'KZ', 'BD'];
        for (let outer = 0; outer < partialKr.length; outer++) {
            var krData = partialKr[outer]
            var TotalPayment_Released = krData[0].TotalPayment_Released
            var TotalPayment_Requested = krData[0].TotalPayment_Requested
            var addPaymentArr = []
            var isNew = false;
            var isReverse = false;
            var krAmount = 0
            for (let inner = 0; inner < krData.length; inner++) {
                var payData = krData[inner]
                if (payData.paymentStatus == 'added') {
                    //no action
                } else
                if (payData.paymentStatus == 'new') {
                    isNew = true
                    var addInPay = false
                    // if (payData.p_doc_type == 'KZ') {
                    if (_.indexOf(paymentDocType, payData.p_doc_type) > -1) {
                        if (_.isNull(payData.advance_document_id) /*for payment */ ||
                            (payData.advance_document_id && payData.payment_req_no) /*for adv doc which has pay req no */ ) {
                            addInPay = true
                            TotalPayment_Released += payData.p_amt_transaction
                            krAmount += payData.p_amt_transaction
                        }
                        // if (_.isNull(payData.advance_document_id)) {
                        //payment doc and not adv doc
                        // addInPay = true
                        // var paymentProcessedUpdate = await db.paymentProcessedDetails.update({
                        //     Status: 'Closed'
                        // }, {
                        //     where: {
                        //         BillDetails_ID: payData.billId,
                        //         Amount: payData.p_amt_transaction,
                        //         Status: "Open"
                        //     }
                        // })
                        // }
                    } else {
                        if (payData.advance_document_id) {
                            addInPay = true
                            TotalPayment_Released += payData.p_amt_transaction
                            krAmount += payData.p_amt_transaction
                        }
                    }
                    if (addInPay) {
                        addPaymentArr.push({
                            AuditLogID: auditLogDetails.dataValues.AuditLogID,
                            Bill_Details_ID: payData.billId,
                            Profit_Ctr: payData.p_profit_center,
                            BA: payData.p_ven_code,
                            Invoice_No: payData.p_inv_reference,
                            Bill_No: payData.billNo,
                            Document_No: payData.p_doc_no,
                            'G/L': payData.p_gl_id,
                            BusArea: payData.p_business_place,
                            'Posting _Date': payData.p_post_date,
                            Doc_Date: payData.p_doc_date,
                            PK: null,
                            Amount: payData.p_amt_transaction,
                            SAP_TEXT: payData.p_item_text ? payData.p_item_text : payData.p_header_text,
                            Doc_Type: payData.p_doc_type,
                            Item: payData.p_doc_item_no,
                            Clearing_Date: moment().format('YYYY-MM-DD'),
                            Year: payData.p_fiscal_year,
                            Clearing_Doc: null,
                            Payment_Request_No: null,
                            Status: "Released",
                        })
                        bill.billActivity.addLog({
                            billDetailsId: payData.billId,
                            activityCode: "Part_Payment_Released",
                            activityDes: `Part Payment Released - ${payData.p_doc_no}`,
                            currStatus: payData.billStatus,
                            preStatus: payData.billStatus,
                            updatedBy: 1
                        });
                    }
                } else {
                    //status for removed 
                    isReverse = true
                    // if (payData.py_doc_type == 'KZ') {
                    if (_.indexOf(paymentDocType, payData.py_doc_type) > -1) {
                        if (_.isNull(payData.advance_document_id) || (payData.advance_document_id && payData.payment_req_no)) {
                            if (TotalPayment_Requested > 0) {
                                TotalPayment_Requested -= payData.py_amount
                            }
                            if (TotalPayment_Released > 0) {
                                TotalPayment_Released -= payData.py_amount
                            }
                            krAmount += payData.py_amount
                        }
                        // if (_.isNull(payData.advance_document_id)) {
                        //     var paymentProcessedUpdate = await db.paymentProcessedDetails.update({
                        //         Status: 'Reversed'
                        //     }, {
                        //         where: {
                        //             BillDetails_ID: payData.billId,
                        //             Amount: payData.py_amount,
                        //             Status: "Closed"
                        //         }
                        //     })
                        // }
                    } else {
                        if (payData.advance_document_id) {
                            if (TotalPayment_Requested > 0) {
                                TotalPayment_Requested -= payData.py_amount
                            }
                            if (TotalPayment_Released > 0) {
                                TotalPayment_Released -= payData.py_amount
                            }
                            krAmount += payData.py_amount
                        }
                    }
                    if (payData.advance_document_id && payData.payment_req_no) {
                        var advanceDocument = await db.advanceDocumentMapping.destroy({
                            where: {
                                advance_document_id: payData.advance_document_id
                            }
                        })
                    }
                    var paymentUpdate = await db.paymentModel.update({
                        Status: 'Reversed'
                    }, {
                        where: {
                            ID: payData.py_id,
                            Status: "Released"
                        }
                    })
                    bill.billActivity.addLog({
                        billDetailsId: payData.billId,
                        activityCode: "Part_Payment_Reversed",
                        activityDes: `Part Payment Reversed - ${payData.py_document_no}`,
                        currStatus: "B",
                        preStatus: payData.billStatus,
                        updatedBy: 1
                    });
                }
            }

            // update bills
            if (isNew || isReverse) {
                if (krAmount > 0) {
                    if (isReverse) {
                        var paymentProcessedData = await db.paymentProcessedDetails.findOne({
                            where: {
                                BillDetails_ID: krData[0].billId,
                                Amount: krAmount,
                                Status: "Closed"
                            },
                            raw: true
                        })
                        var paymentProcessedUpdate = await db.paymentProcessedDetails.update({
                            Status: 'Reversed'
                        }, {
                            where: {
                                BillDetails_ID: krData[0].billId,
                                Amount: krAmount,
                                Status: "Closed"
                            }
                        })
                    }
                    if (isNew) {
                        var paymentProcessedData = await db.paymentProcessedDetails.findOne({
                            where: {
                                BillDetails_ID: krData[0].billId,
                                Amount: krAmount,
                                Status: "Open"
                            },
                            raw: true
                        })
                        var paymentProcessedUpdate = await db.paymentProcessedDetails.update({
                            Status: 'Closed'
                        }, {
                            where: {
                                BillDetails_ID: krData[0].billId,
                                Amount: krAmount,
                                Status: "Open"
                            }
                        })
                    }
                    if (paymentProcessedData) {
                        _.forEach(addPaymentArr, (p) => {
                            p.Payment_Request_No = paymentProcessedData && paymentProcessedData.Payment_Req_No ? paymentProcessedData.Payment_Req_No : ""
                        })
                    }
                }
                var updateQry = {
                    TotalPayment_Requested: TotalPayment_Requested,
                    TotalPayment_Released: TotalPayment_Released,
                    status: isReverse ? 'B' : krData[0].billStatus
                }
                if (isNew) {
                    updateQry.PaymentReleasedOn = moment().format("YYYY-MM-DD")
                }
                var updateBills = await db.billDetails.update(updateQry, {
                    where: {
                        BillDetails_ID: krData[0].billId
                    }
                })
            }

            if (addPaymentArr.length > 0) {
                await db.paymentModel.bulkCreate(addPaymentArr)
            }

        }
    }
}

const openItemsCls = new OpenItemsClass()
const openItemsFromSAP = async (req, res) => {
    try {
        var reqBody = {
            "Record": [{
                "VENDOR_CODE": "",
                "VARIANT": "OPEN_ITEMS"
            }]
        }
        let sapUrl = `${process.env.SAP_URL}OpenClearedItem`
        var username = 'POAPIUSER'
        const password = 'Mahindra@123'
        const auth = Buffer.from(username + ':' + password).toString('base64')
        request.post({
            headers: {
                'content-type': `application/json`,
                'Authorization': 'Basic ' + auth
            },
            url: sapUrl,
            json: true,
            body: reqBody
        }, async (err, response, body) => {
            var allOpenPayments = []
            if (err) {
                res.status(200).send(apiResponse.errorFormat(`fail`, `error while fetching advance document and debit notes `, {}, []))
            } else {
                if (body != '') {
                    allRecords = body.Record
                    if (allRecords.length > 0) {
                        // var auditLogDetails = {
                        //     dataValues: {
                        //         AuditLogID: 367
                        //     }
                        // }
                        var auditLogDetails = await openItemsCls.addAuditLog(allRecords)
                        var allOpenPayments = await openItemsCls.formatOpenPayment(allRecords, auditLogDetails)
                        if (allOpenPayments.length) {
                            await openItemsCls.deleteAllOpenPayments()
                            var createOpenPayments = await openItemsCls.insertOpenPayment(allOpenPayments)
                            await openItemsCls.updateAuditLog(auditLogDetails)
                            var allKR = await openItemsCls.groupByKR()
                            var fullOpenKrUpdate = await openItemsCls.updateFullOpen(allKR.openKr)
                            var partialKrUpdate = await openItemsCls.updatePartialKr(allKR.partialKr, auditLogDetails)
                        }
                        res.status(200).send(apiResponse.successFormat(`success`, `open payments added successfully`, {}, []))
                    } else {
                        res.status(200).send(apiResponse.errorFormat(`fail`, `error while adding open payments `, {}, []))
                    }
                }
            }
        })
    } catch (error) {
        console.log(`error ${JSON.stringify(error)}`)
        const code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
        const response = errorResponse(error)
        res.status(code).send(response)
    }
}
module.exports = {
    openItemsFromSAP
}