const moment = require('moment')
const db = require('../../config/db/billHubdbConn')
const billLog = require('../../utils/logs/addBillActivity')

const vendorInvoice = require('./invoicePosting').invoicePostingClass
class VerifyClass {
    storeFile(filePath, bufferFile) {
        return new Promise((resolve, reject) => {
            try {
                fs.writeFile(`${filePath}`, bufferFile, {
                    encoding: 'base64'
                }, (err) => {
                    if (err) {
                        return reject(err)
                    }

                    resolve()
                })
            } catch (error) {
                // console.log(`error ${error}`)
                reject(error)
            }
        })
    }

    deleteFile(filePath) {
        return new Promise((resolve, reject) => {
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(`${filePath}`)
                }
                resolve()
            } catch (error) {
                reject(error)
            }
        })
    }

    createDirectory(folderPath) {
        return new Promise((resolve, reject) => {
            try {
                mkdirp(folderPath, (err) => {
                    if (err) {
                        return reject(err)
                    }

                    resolve()
                })
            } catch (error) {
                // console.log(`err ${error}`)
                reject(error)
            }
        })
    }
    async updateVendorInvoice(transactionBatchId, status, userId) {
        try {
            var updateRes = await db.vendorInvoice.update({
                status: status,
                updated_by: userId,
                updated_on: moment().format('YYYY-MM-DD HH:mm:ss')
            }, {
                where: {
                    trn_batchid: transactionBatchId
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
                    transaction_batch_id: transactionBatchId
                }
            })
            return updateRes
        } catch (e) {
            return Promise.reject(e)
        }
    }
}
const verifyClass = new VerifyClass()

const verifyInvoice = async (req, res) => {
    try {
        var reqBody = req.body;
        let locations = await db.userMapping.findAll({
            attributes: ['Location_ID'],
            where: {
                User_ID: reqBody.userId
            }
        })
        var allLocations = _.map(locations, function (l) {
            return l.dataValues.Location_ID
        })
        let memoDetails = await db.memoDetails.findOne({
            where: {
                Memo_ID: reqBody.memoId
            }
        })
        if (memoDetails && memoDetails.dataValues) {
            if (_.indexOf(allLocations, memoDetails.dataValues.Submittion_Location_Code) > -1) {
                var billDetails = await db.billDetails.findOne({
                    where: {
                        BillDetails_ID: reqBody.billId
                    }
                })
                if (billDetails && billDetails.dataValues) {
                    if (_.indexOf([
                            // 'V', //no need
                            'B', 'R', 'C', 'P'
                        ], billDetails.dataValues.status) > -1) {
                        res.status(200).send(apiResponse.errorFormat(`fail`, `can not verify invoice at this stage`, {}, []))
                    } else if (billDetails.dataValues.status == 'S') {
                        res.status(200).send(apiResponse.errorFormat(`fail`, `Invoice should be acknowledged`, {}, []))
                    } else {
                        if (billDetails.dataValues.ReversedOn &&
                            moment().diff(moment(billDetails.dataValues.ReversedOn), 'hours') < 2
                        ) {
                            throw apiResponse.errorFormat(`fail`, `You can only re-verify after 2 hours of KR reversion as KR document for this invoice has been reversed.`, {}, [])
                        }
                        //calculate gst percentage
                        var baseGSTAmt = billDetails.dataValues.TaxableAmount + billDetails.dataValues.Additional_Amount
                        if (billDetails.dataValues.Trade_Discount > 0) {
                            baseGSTAmt -= billDetails.dataValues.Trade_Discount
                        }
                        if (billDetails.dataValues.IGST && billDetails.dataValues.IGST > 0) {
                            var gstPercent = _.round(billDetails.dataValues.IGST * 100 / (baseGSTAmt))
                        } else if (billDetails.dataValues.CGST && billDetails.dataValues.CGST > 0 && billDetails.dataValues.SGST && billDetails.dataValues.SGST > 0) {
                            var gstPercent = _.round(billDetails.dataValues.CGST * 100 / (baseGSTAmt)) +
                                _.round(billDetails.dataValues.SGST * 100 / (baseGSTAmt))
                        } else {
                            var gstPercent = 0
                        }
                        if (reqBody.withHoldingTax) {
                            var withHoldingTaxDetails = await db.withholding_tax.findOne({
                                where: {
                                    'w/h_id': reqBody.withHoldingTax
                                }
                            })
                        } else {
                            var noTDS = true
                        }
                        if (noTDS || (withHoldingTaxDetails && withHoldingTaxDetails.dataValues)) {
                            var stateDetails = await db.state.findOne({
                                where: {
                                    // State_ID: billDetails.dataValues.Billing_From_code
                                    State_ID: billDetails.dataValues.Billing_To_code
                                }
                            })
                            var baDetails = await db.ba.findOne({
                                where: {
                                    BA_ID: billDetails.dataValues.BA_Code
                                }
                            })

                            var glDetails = await db.glCode.findOne({
                                where: {
                                    Gl_Name: "TD"
                                },
                                order: [
                                    ['Gl_ID', 'DESC']
                                ]
                            })

                            var advDocList = []
                            var advAmount = 0
                            var totdalAdvTds = 0
                            if (reqBody.removedAdvance && reqBody.removedAdvance.length > 0) {
                                var advIds = _.map(_.filter(reqBody.removedAdvance, adv => {
                                    return adv.advanceDocumentId;
                                }), 'advanceDocumentId')
                                if (advIds.length > 0) {
                                    var deleteAdv = await db.advanceDocumentMapping.destroy({
                                        where: {
                                            advance_document_id: advIds
                                        }
                                    })
                                }
                            }
                            for (var d = 0; d < reqBody.advanceDocuments.length; d++) {
                                var doc = reqBody.advanceDocuments[d];
                                if (!doc.advanceDocumentId) {
                                    if (!doc.amount || doc.amount == 0) {
                                        throw apiResponse.errorFormat(`fail`, `Please add advance amount for ${doc.documentNumber}`, {}, [])
                                    } else {
                                        var allAdvDoc = await db.advanceDocumentMapping.findAll({
                                            where: {
                                                advance_document_number: doc.documentNumber,
                                                fiscal_year: doc.fiscalYear
                                            },
                                            raw: true,
                                            attributes: ['advance_payment']
                                        })
                                        var allDocPayment = allAdvDoc.length > 0 ? _.sumBy(allAdvDoc, 'advance_payment') : 0
                                        if (doc.advanceAmount >= allDocPayment + doc.amount) {
                                            var advTdsAmount = (noTDS ? 0 : withHoldingTaxDetails.dataValues.tax_rate * doc.amount) / 100
                                            advDocList.push({
                                                bill_detail_id: reqBody.billId,
                                                advance_document_number: doc.documentNumber,
                                                advance_payment: doc.amount,
                                                fiscal_year: doc.fiscalYear ? doc.fiscalYear : moment().format('YYYY'),
                                                advance_tds: advTdsAmount,
                                                created_on: moment().format('YYYY-MM-DD HH:mm:ss'),
                                                created_by: reqBody.userId,
                                                doc_type: doc.docType,
                                                doc_date: doc.docDate ? moment(doc.docDate).format('YYYY-MM-DD') : null,
                                                post_date: doc.postDate ? moment(doc.postDate).format('YYYY-MM-DD') : null,
                                                profit_center: doc.profitCenter,
                                                bussiness_place: doc.businessPlace,
                                                document_amount: doc.advanceAmount
                                            })
                                            advAmount += doc.amount;
                                            totdalAdvTds += advTdsAmount
                                        } else {
                                            throw apiResponse.errorFormat(`fail`, `Advance amount utilize in all bills for ${doc.documentNumber} should be less or equal to advance document amount limit`, {}, [])
                                        }
                                    }
                                } else {
                                    var advTdsAmount = (noTDS ? 0 : withHoldingTaxDetails.dataValues.tax_rate * doc.amount) / 100
                                    advAmount += doc.amount;
                                    totdalAdvTds += advTdsAmount
                                }
                            }
                            var internalOrderList = []
                            var invoicePostingList1 = {}
                            var totalTD = 0
                            var totalWithHoldingBase = 0
                            var gstAmount = 0
                            var rcmStatus = false
                            for (let gl = 0; gl < reqBody.glList.length; gl++) {
                                var glItem = reqBody.glList[gl]
                                var taxDetails = await db.taxCode.findOne({
                                    where: {
                                        tax_id: glItem.taxCode
                                    }
                                })
                                var ioDetails = await db.internalOrderData.findOne({
                                    where: {
                                        Internal_order_Number: glItem.internalOrder
                                    }
                                })
                                if (taxDetails && taxDetails.dataValues
                                    // && (taxDetails.dataValues.Description.indexOf('RCM') > -1 || taxDetails.dataValues.tax_percentage == gstPercent)
                                ) {
                                    if ((gstPercent != 0 && taxDetails.dataValues.Description.indexOf('RCM') > -1)) {
                                        throw apiResponse.errorFormat(`fail`, `Can not use RCM tax code as bill gst amount is greater than 0`, {}, [])
                                    }
                                    if ((gstPercent == 0 && taxDetails.dataValues.Description.indexOf('RCM') == -1) && taxDetails.dataValues.tax_percentage != 0) {
                                        throw apiResponse.errorFormat(`fail`, `you can use 0 percentage tax code or RCM tax code as bill gst amount is 0`, {}, [])
                                    }
                                    if (taxDetails.dataValues.Description.indexOf('RCM') > -1) {
                                        rcmStatus = true
                                    }
                                    var tdAmount = (glItem.tdPercent * glItem.amount) / 100
                                    totalTD += tdAmount
                                    var orderAmount = glItem.amount - tdAmount
                                    totalWithHoldingBase += glItem.tds ? orderAmount : 0
                                    gstAmount += ((parseInt(taxDetails.dataValues.tax_percentage) / 100) * glItem.amount);
                                    internalOrderList.push({
                                        BillDetails_Id: reqBody.billId,
                                        GL_Number: glItem.glNumber,
                                        HSN_Code: glItem.hsnCode,
                                        Taxcode_id: glItem.taxCode,
                                        Internal_order_id: ioDetails.dataValues.Internal_order_id,
                                        'W/H_ID': glItem.tds ? reqBody.withHoldingTax : null,
                                        TD: tdAmount,
                                        Tax: (taxDetails.dataValues.tax_percentage * glItem.amount) / 100,
                                        // TDS: tdsAmount,
                                        Header_Text: reqBody.headerText ? reqBody.headerText : '',
                                        Amount: glItem.amount,
                                        Assignment: glItem.assignment,
                                        Item_Text: glItem.itemText,
                                        allLR: glItem.lrList && glItem.lrList.length > 0 ? _.map(glItem.lrList, 'billBaseTransactionId') : []
                                    })
                                    var singleInvoiceData = {
                                        event: "SIM",
                                        src_sys: "BLHB",
                                        co_code: 1022,
                                        doc_date: moment(billDetails.dataValues.BillDate).format('YYYY-MM-DD'),
                                        reference: billDetails.dataValues.BillNo,
                                        post_date: reqBody.postingIn == 'current' ? moment().format('YYYY-MM-DD') : moment().subtract(1, 'months').endOf('month').format('YYYY-MM-DD'),
                                        currency: 'INR',
                                        vendor_code: baDetails.dataValues.ba_code,
                                        business_place: stateDetails.dataValues.Plant_code,
                                        // base_date: baDetails.dataValues.Is_MSMED == 'NO' ?
                                        //     moment(billDetails.dataValues.BillDate).format('YYYY-MM-DD') : moment(billDetails.dataValues.AcknowledgedOn).format('YYYY-MM-DD'),
                                        base_date: moment().add(2, 'Days').format('YYYY-MM-DD'),
                                        withholding_type: noTDS ? null : withHoldingTaxDetails.dataValues['w/h_tax_type'],
                                        withholding_code: noTDS ? null : withHoldingTaxDetails.dataValues['w/h_tax_code'],
                                        exchange_rate: 1,
                                        doc_type: 'KR',
                                        gl_id: glItem.glNumber,
                                        item_text: glItem.itemText,
                                        internal_order: glItem.internalOrder,
                                        tax_code: taxDetails.dataValues.tax_code,
                                        assignment: glItem.assignment,
                                        hsn_code: glItem.hsnCode,
                                        payment_method: 'N',
                                        vendor_code2: baDetails.dataValues.ba_code,
                                        payment_term: reqBody.paymentTerm ? reqBody.paymentTerm : null
                                    }
                                    var lineItem = 0
                                    for (let l = 0; l < glItem.lrList.length; l++) {
                                        var lrItem = glItem.lrList[l]
                                        var lrInvoiceData = _.cloneDeep(singleInvoiceData)
                                        lrInvoiceData.line_item = ++lineItem
                                        lrInvoiceData.basetrans_type = lrItem.baseTransactionType
                                        lrInvoiceData.base_transaction = lrItem.lrNumber
                                        lrInvoiceData.base_transaction_date = moment(lrItem.baseTransactionDate).format('YYYY-MM-DD')
                                        lrInvoiceData.transaction_amount = lrItem.amount
                                        lrInvoiceData.created_by = reqBody.userId
                                        lrInvoiceData.created_on = moment().format('YYYY-MM-DD HH:mm:ss')
                                        lrInvoiceData.bill_details_id = reqBody.billId
                                        // invoicePostingList.push(lrInvoiceData)
                                        invoicePostingList1[`${lrItem.lrNumber}_${glItem.glNumber}`] = lrInvoiceData

                                        //for td line item
                                        if (glItem.tdPercent > 0) {
                                            if (invoicePostingList1[`${lrItem.lrNumber}_${glDetails.dataValues.Gl_code}`]) {
                                                invoicePostingList1[`${lrItem.lrNumber}_${glDetails.dataValues.Gl_code}`].transaction_amount += -(glItem.tdPercent * lrItem.amount) / 100
                                            } else {
                                                var tdInvoiceData = _.cloneDeep(lrInvoiceData)
                                                tdInvoiceData.line_item = ++lineItem
                                                tdInvoiceData.tax_code = billDetails.dataValues.Trade_Discount > 0 ? taxDetails.dataValues.tax_code : 'K0'
                                                tdInvoiceData.gl_id = glDetails.dataValues.Gl_code
                                                //negative amount for td line item
                                                tdInvoiceData.transaction_amount = -(glItem.tdPercent * lrItem.amount) / 100
                                                tdInvoiceData.created_by = reqBody.userId
                                                tdInvoiceData.created_on = moment().format('YYYY-MM-DD HH:mm:ss')
                                                invoicePostingList1[`${lrItem.lrNumber}_${glDetails.dataValues.Gl_code}`] = tdInvoiceData
                                                // invoicePostingList.push(tdInvoiceData)
                                            }
                                        }
                                    }
                                } else if (!taxDetails || !taxDetails.dataValues) {
                                    throw apiResponse.errorFormat(`fail`, `Tax code not found`, {}, [])
                                } else {
                                    throw apiResponse.errorFormat(`fail`, `Invalid tax Code`, {}, [])
                                }
                            };

                            var invoicePostingList = _.toArray(invoicePostingList1)
                            if ((gstAmount != (billDetails.dataValues.IGST + billDetails.dataValues.CGST + billDetails.dataValues.SGST)) && !rcmStatus) {
                                throw apiResponse.errorFormat(`fail`, `GST amount should match with BA bill GST amount`, {}, [])
                            }
                            if (billDetails.dataValues.Trade_Discount && billDetails.dataValues.Trade_Discount > 0) {
                                var tdDiff = totalTD - billDetails.dataValues.Trade_Discount
                                if (-1 >= tdDiff || tdDiff >= 1)
                                    throw apiResponse.errorFormat(`fail`, `TD amount should match with BA bill TD amount`, {}, [])
                            }
                            if (advAmount > billDetails.dataValues.TaxableAmount + billDetails.dataValues.Additional_Amount - totalTD) {
                                throw apiResponse.errorFormat(`fail`, `Advance amount should be less than taxable amount`, {}, [])
                            }

                            if (internalOrderList && internalOrderList.length == 0) {
                                throw apiResponse.errorFormat(`fail`, `GL wise breakup details not found`, {}, [])
                            }
                            if (invoicePostingList && invoicePostingList.length > 0) {
                                var transactionBatchDetails = await db.transactionBatchLog.create({
                                    bill_id: reqBody.billId,
                                    created_by: reqBody.userId,
                                    created_on: moment().format('YYYY-MM-DD HH:mm:ss')
                                })
                            }
                            _.forEach(invoicePostingList, post => {
                                post.trn_batchid = transactionBatchDetails.dataValues.transaction_batch_id.toString()
                                post.withholding_tax_base = totalWithHoldingBase - advAmount;
                                if (post.withholding_tax_base == 0) {
                                    post.withholding_type = null
                                    post.withholding_code = null
                                }
                                var totalAmount = billDetails.dataValues.TaxableAmount + billDetails.dataValues.Additional_Amount + (rcmStatus ? 0 : gstAmount)
                                post.invoice_amount = totalAmount - totalTD;
                                // post.invoice_amount = billDetails.dataValues.Trade_Discount > 0 ? totalAmount - billDetails.dataValues.Trade_Discount : totalAmount - totalTD;
                            })

                            if (invoicePostingList && invoicePostingList.length > 0) {
                                await db.vendorInvoice.bulkCreate(invoicePostingList)
                            } else {
                                throw apiResponse.errorFormat(`fail`, `SAP details not found`, {}, [])
                            }

                            var postingAllRes = await vendorInvoice.invPosting(transactionBatchDetails.dataValues.transaction_batch_id, false)
                            if (postingAllRes[0]) {
                                var postingRes = postingAllRes[0]
                                if (postingRes.error) {
                                    var transactionID = transactionBatchDetails.dataValues.transaction_batch_id.toString()
                                    await verifyClass.updateVendorInvoice(transactionID, 'fail', reqBody.userId)
                                    await verifyClass.updateTransactionBatchLogs(transactionID, 'fail', reqBody.userId, postingRes.sapRes)
                                    res.status(200).send(apiResponse.errorFormat(`fail`, postingRes.error, {}, []))
                                } else {
                                    if (postingRes.isError == true) {
                                        var transactionID = transactionBatchDetails.dataValues.transaction_batch_id.toString()
                                        await verifyClass.updateVendorInvoice(transactionID, 'fail', reqBody.userId)
                                        await verifyClass.updateTransactionBatchLogs(transactionID, 'fail', reqBody.userId, postingRes.sapRes)
                                        res.status(200).send(apiResponse.errorFormat(`fail`, `Error while simulating invoice`, {
                                            simulationData: postingRes.simulationData
                                        }, []))
                                    } else {
                                        var transactionID = transactionBatchDetails.dataValues.transaction_batch_id.toString()
                                        await verifyClass.updateVendorInvoice(transactionID, 'success', reqBody.userId)
                                        await verifyClass.updateTransactionBatchLogs(transactionID, 'success', reqBody.userId, postingRes.sapRes)
                                        await db.billInternalOrderMapping.destroy({
                                            where: {
                                                BillDetails_Id: reqBody.billId
                                            }
                                        })
                                        _.forEach(internalOrderList, io => {
                                            if (io['W/H_ID']) {
                                                io.TDS = parseFloat(postingRes.sapRes[0].VEN_INV_AMT) - parseFloat(postingRes.sapRes[0].MESSAGE_DETAILS[0].INV_AMOUNT)
                                            }
                                        })
                                        await db.advanceDocumentMapping.bulkCreate(advDocList)
                                        for (io = 0; io < internalOrderList.length; io++) {
                                            var allLR = internalOrderList[io].allLR
                                            delete internalOrderList[io].allLR
                                            var addIOMapping = await db.billInternalOrderMapping.create(internalOrderList[io])
                                            var updateLr = await db.billBaseTransMapping.update({
                                                bill_internal_order_id: addIOMapping.dataValues.ID
                                            }, {
                                                where: {
                                                    ID: allLR
                                                }
                                            })
                                        }
                                        // await db.billInternalOrderMapping.bulkCreate(internalOrderList)
                                        if (!_.isEmpty(reqBody.removedFiles)) {
                                            var removedFiles = _.remove(_.map(reqBody.removedFiles, 'billFileId'),
                                                undefined)
                                            var removeBillFiles = await db.billFileDetails.destroy({
                                                where: {
                                                    Bill_File_Id: removedFiles
                                                }
                                            })
                                            for (let f = 0; f < reqBody.removedFiles.length; f++) {
                                                await verifyClass.deleteFile(`${__basedir}/public/uploads/${reqBody.removedFiles[f].filePath}`)
                                            }
                                        }

                                        if (!_.isEmpty(reqBody.files)) {
                                            var billFiles = []
                                            for (let f = 0; f < reqBody.files.length; f++) {
                                                var file = reqBody.files[f]
                                                if (_.isNull(file.billFileId) || _.isUndefined(file.billFileId)) {
                                                    let folderPath = `${__basedir}/public/uploads/bafiles/${moment().format('YYYY')}`
                                                    await verifyClass.createDirectory(folderPath)
                                                    folderPath += `/${moment().format('MM')}`
                                                    await verifyClass.createDirectory(folderPath)
                                                    folderPath += `/${billDetails.dataValues.BA_Code}`
                                                    await verifyClass.createDirectory(folderPath)
                                                    folderPath += `/${billDetails.dataValues.MemoID}`
                                                    await verifyClass.createDirectory(folderPath)
                                                    folderPath += `/${reqBody.billId}`
                                                    await verifyClass.createDirectory(folderPath)
                                                    var newFilePath = `${folderPath}/${file.fileName}`
                                                    fs.renameSync(`${__basedir}/public/uploads/${file.filePath}`, newFilePath)
                                                    billFiles.push({
                                                        Bill_Details_ID: reqBody.billId,
                                                        FilePath: newFilePath.replace(`${__basedir}/public/uploads/`, ''),
                                                        File_Name: file.fileName,
                                                        Created_By: reqBody.userId,
                                                        Created_On: moment().format('YYYY-MM-DD HH:mm:ss'),
                                                        File_Type: file.fileType
                                                    })
                                                }
                                            }
                                            var billFileDetails = await db.billFileDetails.bulkCreate(billFiles, {
                                                individualHooks: true
                                            })
                                        }
                                        var updatebill = await db.billDetails.update({
                                            ApprovedBy: reqBody.userId,
                                            ApprovedOn: moment().format('YYYY-MM-DD'),
                                            status: 'V',
                                            Advance_Payment: advAmount,
                                            UpdatedBy: req.body.userId,
                                            UpdatedOn: moment().format('YYYY-MM-DD'),
                                            Edited_On: billFiles.length > 0 ? moment().format('YYYY-MM-DD') : null,
                                            Advance_TDS: totdalAdvTds,
                                            Reason: reqBody.reason,
                                            DueDate: totalTD > 0 ? moment().add(baDetails.dataValues.td_Credit_Period ? baDetails.dataValues.td_Credit_Period : 10, 'd').format("YYYY-MM-DD") : billDetails.dataValues.DueDate
                                        }, {
                                            where: {
                                                BillDetails_ID: reqBody.billId
                                            }
                                        })
                                        billLog.billActivity.addLog({
                                            billDetailsId: reqBody.billId,
                                            activityCode: "Invoice_Verified",
                                            activityDes: "Invoice Verified",
                                            currStatus: "V",
                                            preStatus: billDetails.dataValues.status,
                                            updatedBy: reqBody.userId
                                        });
                                        res.status(200).send(apiResponse.successFormat(`success`, `Invoice verified and simulate successfully`, {
                                            simulationData: postingRes.simulationData
                                        }, []))
                                    }
                                }
                            } else {
                                res.status(200).send(apiResponse.errorFormat(`fail`, `Error occured while invoice posting`, {}, []))
                            }
                        } else {
                            res.status(200).send(apiResponse.errorFormat(`fail`, `Incorrect withholding tax details`, {}, []))
                        }
                    }
                } else {
                    res.status(200).send(apiResponse.errorFormat(`fail`, `Invoice not found`, {}, []))
                }
            } else {
                res.status(200).send(apiResponse.errorFormat(`fail`, `You do not have access to this memo`, {}, []))
            }
        } else {
            res.status(200).send(apiResponse.errorFormat(`fail`, `Memo not found`, {}, []))
        }
    } catch (error) {
        console.log(`error ${JSON.stringify(error)}`)
        const code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
        const response = errorResponse(error)
        res.status(code).send(response)
    }
}
module.exports = {
    verifyInvoice
}