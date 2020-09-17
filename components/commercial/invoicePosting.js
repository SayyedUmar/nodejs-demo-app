class InvoicePostingClass {
    async invPosting(id, manual) {
        return new Promise(async (resolve, reject) => {
            try {
                var allBatchWiseInvoice = await db.vendorInvoice.findAll({
                    where: {
                        [Op.or]: [{
                                reference: id
                            },
                            {
                                TRN_BATCHID: id
                            }
                        ]
                    }
                })
                var invoiceGrp = _.groupBy(allBatchWiseInvoice, 'dataValues.trn_batchid')
                var reqBody = {
                    Record: []
                }
                _.forEach(invoiceGrp, invoiceDetails => {
                    if (invoiceDetails.length > 0 && invoiceDetails[0].dataValues) {
                        var headerData = invoiceDetails[0].dataValues
                        var invoiceObj = {
                            "EVENT": headerData.event,
                            "SRC_SYS": headerData.src_sys,
                            "TRN_BATCHID": headerData.trn_batchid,
                            "CO_CODE": headerData.co_code,
                            "DOC_DATE": moment(headerData.doc_date).format('YYYYMMDD'),
                            "REFERENCE": headerData.reference,
                            "POST_DATE": moment(headerData.post_date).format('YYYYMMDD'),
                            "CURRENCY": headerData.currency,
                            "INV_AMOUNT": headerData.invoice_amount,
                            "VEN_CODE": headerData.vendor_code,
                            "ALTERNATE_RECON_GL": headerData.alternate_recon_gl,
                            "BUS_PLACE": headerData.business_place,
                            "BASE_DATE": moment(headerData.base_date).format('YYYYMMDD'),
                            "WITH_TYP": headerData.withholding_tax_base > 0 ? headerData.withholding_type : '',
                            "WITH_COD": headerData.withholding_tax_base > 0 ? headerData.withholding_code : '',
                            "WITH_BASE": headerData.withholding_tax_base > 0 ? headerData.withholding_tax_base : '',
                            "EXC_RATE": 1,
                            "DOC_TYPE": headerData.doc_type,
                            "PYMT_TRM": headerData.payment_term,
                            "ITEM_DETAILS": []
                        }

                        _.forEach(invoiceDetails, (inv) => {
                            var singleInv = inv.dataValues;
                            invoiceObj.ITEM_DETAILS.push({
                                "LINE_ITEM": singleInv.line_item,
                                "GL_ID": singleInv.gl_id,
                                "ITEM_TEXT": singleInv.item_text,
                                "INTRNL_ORDR": singleInv.internal_order,
                                "COST_CENTER": singleInv.cost_center,
                                "BASETRANS_TYPE": singleInv.basetrans_type,
                                "BASE_TRANSACTION": singleInv.base_transaction,
                                "BASE_TRANSACTION_DATE": moment(singleInv.base_transaction_date).format('YYYYMMDD'),
                                "QUANTITY": singleInv.quantity,
                                "UOM": singleInv.unit_of_measurement,
                                "TAX_CODE": singleInv.tax_code,
                                "ASSIGNMENT": singleInv.assignment,
                                "HSN_CODE": singleInv.hsn_code,
                                "PYMT_METHOD": singleInv.payment_method,
                                "TRANSC_CURRENCY": singleInv.transaction_amount,
                                "PUR_ORDR": singleInv.purchase_order,
                                "PO_LINE_ITEM": singleInv.po_line_item,
                                "VEN_CODE2": singleInv.vendor_code2
                            })
                        })
                    }
                    reqBody.Record.push(invoiceObj);
                })
                var grpReq = _.groupBy(reqBody.Record, 'TRN_BATCHID')
                let sapUrl = `${process.env.SAP_URL}VendorInvoice`
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
                }, (err, response, body) => {
                    if (manual == true) {
                        if (err) {
                            reject({
                                error: err
                            })
                        } else {
                            // if (response.statusCode == 200)
                            resolve({
                                reqBody: reqBody,
                                resBody: body
                            })
                        }
                    } else {
                        var resArray = []
                        if (err) {
                            _.forEach(reqBody.Record, record => {
                                resArray.push({
                                    status: 'fail',
                                    code: 200,
                                    error: 'Error occured while invoice posting',
                                    sapRes: err,
                                    sapReq: record
                                })
                            })
                        } else
                        if (body && body.Record) {
                            // _.forEach(body.Record, record => {
                            //     if (record.DOC_NO) {
                            //         if (6000000000 <= record.DOC_NO && record.DOC_NO <= 6999999999) {
                            //             //offset response
                            //         } else if (1900000000 <= record.DOC_NO && record.DOC_NO <= 1999999999) {
                            //             record.MESSAGE_DETAILS = this.removeResponseMsg(record.MESSAGE_DETAILS)
                            //             var finalRes = this.groupErrorMsg(record)
                            //             resArray.push({
                            //                 isError: finalRes.isError,
                            //                 simulationData: _.concat(finalRes.errorList, finalRes.successList),
                            //                 sapRes: record,
                            //                 sapReq: grpReq[record.TRN_BATCHID][0]
                            //             })
                            //         }
                            //     } else {
                            //         record.MESSAGE_DETAILS = this.removeResponseMsg(record.MESSAGE_DETAILS)
                            //         var finalRes = this.groupErrorMsg(record)
                            //         resArray.push({
                            //             isError: finalRes.isError,
                            //             simulationData: _.concat(finalRes.errorList, finalRes.successList),
                            //             sapRes: record,
                            //             sapReq: grpReq[record.TRN_BATCHID][0]
                            //         })
                            //     }
                            // })
                            var grpDoc = _.groupBy(body.Record, r => {
                                if (r.TRN_BATCHID) {
                                    return r.TRN_BATCHID
                                } else {
                                    var req = {}
                                    _.forEach(r.MESSAGE_DETAILS, br => {
                                        if (_.indexOf(br.MESSAGE, 'repeated') > -1 || br.BASE_TRANSACTION) {
                                            req = _.find(reqBody.Record, rq => {
                                                return _.some(rq.ITEM_DETAILS, reBr => {
                                                    return reBr.BASE_TRANSACTION == br.BASE_TRANSACTION;
                                                });
                                            })
                                            if (req) {
                                                return false
                                            }
                                        }
                                    })
                                    if (req) {
                                        r.TRN_BATCHID = req.TRN_BATCHID
                                        r.CO_CODE = req.CO_CODE
                                        r.REFERENCE = req.REFERENCE
                                    }
                                    return r.TRN_BATCHID
                                }
                            })
                            _.forEach(grpDoc, grp => {
                                var errorList = []
                                var successList = []
                                var isError = false
                                var batchId = null
                                var sapRes = _.cloneDeep(grp)
                                _.forEach(grp, record => {
                                    batchId = record.TRN_BATCHID
                                    record.MESSAGE_DETAILS = this.removeResponseMsg(record.MESSAGE_DETAILS)
                                    var finalRes = this.groupErrorMsg(record)
                                    successList = _.concat(successList, finalRes.successList)
                                    errorList = _.concat(errorList, finalRes.errorList)
                                    if (!isError) {
                                        isError = finalRes.isError
                                    }
                                })
                                resArray.push({
                                    isError: isError,
                                    simulationData: _.concat(errorList, successList),
                                    sapRes: sapRes,
                                    sapReq: batchId && grpReq[batchId] && grpReq[batchId][0] ? grpReq[batchId][0] : {}
                                })
                            })
                        } else {
                            _.forEach(reqBody.Record, record => {
                                resArray.push({
                                    status: 'fail',
                                    code: 200,
                                    error: 'Error occured while invoice posting',
                                    sapRes: body ? body : response,
                                    sapReq: record
                                })
                            })
                        }
                        resolve(resArray)
                    }
                })
            } catch (error) {
                reject({
                    error: error
                })
            }
        })
    }

    removeResponseMsg(resMsg) {
        _.remove(resMsg, m => {
            return m.MESSAGE == 'Active availability control (FM):' ||
                m.MSG_TYP == 'W'
        })
        return resMsg
    }
    covertAmount(amt) {
        return amt.indexOf("-") > -1 ? parseFloat(amt) * -1 : parseFloat(amt)
    }

    groupErrorMsg(invoiceRes) {
        var errorList = {}
        var successList = {}
        var isError = false;
        _.forEach(invoiceRes.MESSAGE_DETAILS, r => {
            if (6000000000 <= invoiceRes.DOC_NO && invoiceRes.DOC_NO <= 6999999999) {
                var offsetNo = invoiceRes.DOC_NO
            } else
            if (1900000000 <= invoiceRes.DOC_NO && invoiceRes.DOC_NO <= 1999999999) {
                var documentNo = invoiceRes.DOC_NO
            }
            if (r.MSG_TYP == 'E') {
                if (invoiceRes.DOC_NO == "" || (1900000000 <= invoiceRes.DOC_NO && invoiceRes.DOC_NO <= 1999999999)) {
                    isError = true
                }
                if (errorList[r.BASE_TRANSACTION]) {
                    if (errorList[r.BASE_TRANSACTION].msg.indexOf(r.MESSAGE) == -1) {
                        errorList[r.BASE_TRANSACTION].msg += ',' + r.MESSAGE;
                        errorList[r.BASE_TRANSACTION].msgArray.push(r.MESSAGE)
                        if (offsetNo) {
                            errorList[r.BASE_TRANSACTION].offsetNo = offsetNo
                        }
                        if (documentNo) {
                            errorList[r.BASE_TRANSACTION].documentNo = documentNo
                        }
                    }
                } else {
                    errorList[r.BASE_TRANSACTION] = {
                        baseTransactionNumber: r.BASE_TRANSACTION,
                        msgType: 'error',
                        invoiceNumber: invoiceRes.REFERENCE,
                        msg: r.MESSAGE,
                        msgArray: [r.MESSAGE],
                        documentNo: documentNo ? documentNo : "",
                        offsetNo: offsetNo ? offsetNo : ""
                    }
                }
            } else
            if (r.MSG_TYP == 'S') {

                if (successList[r.BASE_TRANSACTION]) {
                    if (successList[r.BASE_TRANSACTION].msg.indexOf(r.MESSAGE) == -1) {
                        successList[r.BASE_TRANSACTION].msg += ',' + r.MESSAGE
                        successList[r.BASE_TRANSACTION].msgArray.push(r.MESSAGE)
                    }
                    if (offsetNo) {
                        successList[r.BASE_TRANSACTION].offsetNo = offsetNo
                    }
                    if (documentNo) {
                        successList[r.BASE_TRANSACTION].documentNo = documentNo
                    }
                    if (r.TAX_TYPE || r.TAX_BASE || r.TAX_RATE || r.TAX_AMT || r.INV_AMOUNT) {
                        var taxVal = {
                            taxType: r.TAX_TYPE,
                            taxBase: this.covertAmount(r.TAX_BASE),
                            taxRate: this.covertAmount(r.TAX_RATE),
                            taxAmt: this.covertAmount(r.TAX_AMT),
                            invAmt: parseFloat(r.INV_AMOUNT),
                            tdsAmt: this.covertAmount(invoiceRes.VEN_INV_AMT) - parseFloat(r.INV_AMOUNT)
                        }
                        successList[r.BASE_TRANSACTION].taxDetails.push(taxVal)
                    }
                } else {

                    successList[r.BASE_TRANSACTION] = {
                        baseTransactionNumber: r.BASE_TRANSACTION,
                        documentNo: documentNo ? documentNo : "",
                        offsetNo: offsetNo ? offsetNo : "",
                        msgType: 'sucess',
                        invoiceNumber: invoiceRes.REFERENCE,
                        msg: r.MESSAGE,
                        msgArray: [r.MESSAGE],
                        taxDetails: []
                    }
                    if (r.TAX_TYPE || r.TAX_BASE || r.TAX_RATE || r.TAX_AMT || r.INV_AMOUNT) {
                        var taxVal = {
                            taxType: r.TAX_TYPE,
                            taxBase: this.covertAmount(r.TAX_BASE),
                            taxRate: this.covertAmount(r.TAX_RATE),
                            taxAmt: this.covertAmount(r.TAX_AMT),
                            invAmt: parseFloat(r.INV_AMOUNT),
                            tdsAmt: this.covertAmount(invoiceRes.VEN_INV_AMT) - parseFloat(r.INV_AMOUNT)
                        }
                        successList[r.BASE_TRANSACTION].taxDetails.push(taxVal)
                    }
                }
            }
        })
        return {
            errorList: _.toArray(errorList),
            successList: _.toArray(successList),
            isError: isError
        }
    }
}
const invoicePostingClass = new InvoicePostingClass()

const invoicePosting = async (req, res) => {
    try {
        var sapRes = await invoicePostingClass.invPosting(req.query.transactionBatchId, true)
        if (sapRes.error) {
            res.status(400).send(apiResponse.errorFormat(`fail`, `Error occured while invoice posting`, {}, []))
        } else {
            res.status(200).send(apiResponse.successFormat(`success`, `invoice posting response`, {
                reqBody: sapRes.reqBody,
                resBody: sapRes.resBody
            }, []))
        }
    } catch (error) {
        console.log(`error ${JSON.stringify(error)}`)
        const code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
        const response = errorResponse(error)
        res.status(code).send(response)
    }
}
module.exports = {
    invoicePosting,
    invoicePostingClass
}