const bill = require('../../utils/logs/addBillActivity')
class SchedulerUtils {
    covertAmount(amt) {
        console.log('amt', amt)
        return amt.indexOf("-") > -1 ? parseFloat(amt) * -1 : parseFloat(amt)
    }
}
const schedulerUtilsCls = new SchedulerUtils()
const apiFn = async (req, res) => {
    try {
        var reqQuery = req.query
        var auditLogDetails = await db.auditLogPayment.create({
            File_Name: 'T-' + 'scheduler' + '-' + moment().utcOffset('+0530').format("DDMMMYYYY@hh:mm:ss"),
            Upload_Date: moment().format('YYYY-MM-DD HH:mm:ss'),
            User: 74
        })
        // var lastMonthLastDate = moment().subtract('month', 1).endOf('month').format('YYYY-MM-DD')
        var reqBody = {
            "Record": [{
                    "VENDOR_CODE": "",
                    "VARIANT": "FULL_CLEAR",
                    "DATE": reqQuery.date ? moment(reqQuery.date).format('YYYY-MM-DD') : moment().subtract('day', 1).format('YYYY-MM-DD')
                }
                // , {
                //     "VENDOR_CODE": "",
                //     "VARIANT": "FULL_CLEAR",
                //     "DATE": lastMonthLastDate
                // }
            ]
        }
        var allRecords = []
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
            if (err) {
                //perform error task
                //update audit logs for count
                console.log(err)
            } else {
                console.log('****', body)
                allRecords = body.Record
                var allAdvances = []
                _.forEach(allRecords, record => {
                    if (record.DOC_NO) {
                        allAdvances.push({
                            CO_CODE: record.CO_CODE,
                            FISC_YEAR: record.FISC_YEAR,
                            GL_ID: record.GL_ID,
                            POST_DATE: moment(record.POST_DATE).format('YYYY-MM-DD'),
                            DOC_DATE: moment(record.DOC_DATE).format('YYYY-MM-DD'),
                            REFERENCE: record.REFERENCE,
                            HEADER_TEXT: record.HEADER_TEXT,
                            DOC_TYPE: record.DOC_TYPE,
                            DOC_NO: record.DOC_NO,
                            DOC_ITEM_NO: record.DOC_ITEM_NO,
                            VEN_CODE: record.VEN_CODE,
                            RECON_GL: record.RECON_GL,
                            BASE_DATE: moment(record.BASE_DATE).format('YYYY-MM-DD'),
                            PROFIT_CENTER: record.PROFIT_CENTER,
                            AMT_TRANS: schedulerUtilsCls.covertAmount(record.AMT_TRANS) * -1,
                            CURRENCY: record.CURRENCY,
                            SPECIAL_GL: record.SPECIAL_GL,
                            BUPLA: record.BUPLA,
                            TEXT: record.TEXT,
                            ASSIGNMENT: record.ASSIGNMENT,
                            ENTRY_DATE: moment(record.ENTRY_DATE).format('YYYY-MM-DD'),
                            INV_REFERENCE: record.INV_REFERENCE,
                            INV_REF_FY: record.INV_REF_FY,
                            CLEAR_DOC_NO: record.CLEAR_DOC_NO,
                            CLEAR_FY: record.CLEAR_FY,
                            CLEAR_DATE: moment(record.CLEAR_DATE).format('YYYY-MM-DD'),
                            audit_log_id: auditLogDetails.dataValues.AuditLogID,
                            created_by: reqBody.userId,
                            created_on: moment().format('YYYY-MM-DD HH:mm:ss')
                        })
                    }
                })
                console.log(allAdvances.length)
                if (allAdvances.length > 0) {
                    var addAdvanceDoc = await db.sapPaymentDetais.bulkCreate(allAdvances, {
                        // updateOnDuplicate: []
                    })
                }
                await db.auditLogPayment.update({
                    No_of_Records_added: allRecords.length,
                    Total_No_of_Records: allRecords.length
                }, {
                    where: {
                        AuditLogID: auditLogDetails.dataValues.AuditLogID
                    }
                })
                for (const single of allAdvances) {
                    var lastDatePayment = {}
                    // if (single.CLEAR_DATE == lastMonthLastDate) {
                    //     lastDatePayment = await db.paymentModel.findOne({
                    //         where: {
                    //             Invoice_No: single.INV_REFERENCE,
                    //             BA: single.VEN_CODE,
                    //             Clearing_Date: single.CLEAR_DATE,
                    //             Year: single.CLEAR_FY,
                    //             Clearing_Doc: single.CLEAR_DOC_NO,
                    //             // Status: 'Released',
                    //             Document_No: single.DOC_NO,
                    //             Amount: single.AMT_TRANS
                    //         },
                    //         raw: true
                    //     })
                    // }
                    if (single.DOC_TYPE === 'KR'
                        // && _.isEmpty(lastDatePayment)
                    ) {
                        let expenseDetails = await db.expenseModel.findOne({
                            where: {
                                Document_No: single.DOC_NO,
                                Year_Month: single.FISC_YEAR,
                                IsReversal: 0
                            }
                        })
                        if (expenseDetails) {
                            // console.log('exped', expenseDetails)
                            await db.billDetails.update({
                                status: 'P',
                                TotalPayment_Released: single.AMT_TRANS,
                                // updatedBy: 74,
                                // updatedOn: moment().utcOffset(330).format('YYYY-MM-DD HH:mm:ss'),
                                PaymentReleasedOn: moment().utcOffset(330).format('YYYY-MM-DD HH:mm:ss')
                            }, {
                                where: {
                                    BillDetails_ID: expenseDetails.dataValues.Bill_Details_ID
                                }
                            })
                            bill.billActivity.addLog({
                                billDetailsId: expenseDetails.dataValues.Bill_Details_ID,
                                activityCode: "Payment_Released",
                                activityDes: "Payment Released",
                                currStatus: "P",
                                preStatus: 'R',
                                updatedBy: 74
                            })
                            var paymentProcessedData = await db.paymentProcessedDetails.findOne({
                                where: {
                                    BillDetails_ID: expenseDetails.dataValues.Bill_Details_ID,
                                    Amount: single.AMT_TRANS,
                                    Status: "Open"
                                },
                                raw: true
                            })
                            var paymentProcessedUpdate = await db.paymentProcessedDetails.update({
                                Status: 'Closed'
                            }, {
                                where: {
                                    BillDetails_ID: expenseDetails.dataValues.Bill_Details_ID,
                                    Amount: single.AMT_TRANS,
                                    Status: "Open"
                                }
                            })
                            await db.paymentModel.create({
                                AuditLogID: auditLogDetails.dataValues.AuditLogID,
                                Bill_Details_ID: expenseDetails.dataValues.Bill_Details_ID,
                                Profit_Ctr: expenseDetails.dataValues.Profit_Ctr,
                                BA: single.VEN_CODE,
                                Invoice_No: single.INV_REFERENCE,
                                Bill_No: expenseDetails.dataValues.Bill_No,
                                Document_No: single.DOC_NO,
                                'G/L': single.GL_ID,
                                BusArea: single.BUPLA,
                                'Posting _Date': single.POST_DATE,
                                Doc_Date: single.DOC_DATE,
                                PK: 1,
                                Amount: single.AMT_TRANS,
                                SAP_TEXT: single.TEXT,
                                Doc_Type: single.DOC_TYPE,
                                Item: single.DOC_ITEM_NO,
                                Clearing_Date: single.CLEAR_DATE,
                                Year: single.CLEAR_FY,
                                Clearing_Doc: single.CLEAR_DOC_NO,
                                Payment_Request_No: paymentProcessedData && paymentProcessedData.Payment_Req_No ? paymentProcessedData.Payment_Req_No : '',
                                Status: 'Released'
                            })

                        }
                    }
                }
                res.status(200).send(apiResponse.successFormat(`success`, `Payment details added successfully`, {}, []))
            }
        })
    } catch (error) {
        console.log(`error ${JSON.stringify(error)}`)
        const code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
        const response = errorResponse(error)
        res.status(code).send(response)
    }
}
module.exports.paymentDetails = apiFn