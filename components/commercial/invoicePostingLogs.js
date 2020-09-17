const vendorInvoice = require('./invoicePosting').invoicePostingClass

const invoicePostingLogs = async (req, res) => {
    try {
        var reqQuery = req.query
        let locations = await db.userMapping.findAll({
            attributes: ['Location_ID'],
            where: {
                User_ID: reqQuery.userId
            }
        })
        var allLocations = _.map(locations, function (l) {
            return l.dataValues.Location_ID
        })
        var invoiceList = await db.transactionBatchLog.findAll({
            where: {
                AuditLogID: reqQuery.batchId
            },
            attributes: ['transaction_batch_id', 'success_log', 'error_log', 'status'],
            order: [
                ['updated_on', 'DESC']
            ],
            raw: true,
            include: [{
                model: db.billDetails,
                required: true,
                attributes: ['BillDetails_ID', 'MemoID', 'BillNo', 'Amount',
                    'status', 'BillDate'
                ],
                include: [{
                    model: db.memoDetails,
                    required: true,
                    where: {
                        Submittion_Location_Code: allLocations
                    },
                    attributes: ['Memo_ID', 'Memo_Date', 'Memo_Number', 'Submit_To_ID']
                }]
            }]
        })
        if (invoiceList) {
            var allInvoice = []
            _.forEach(invoiceList, inv => {
                inv.success_log = JSON.parse(inv.success_log)
                inv.error_log = JSON.parse(inv.error_log)
                var errorList = []
                var successList = []
                if (_.isArrayLike(inv.success_log)) {
                    _.forEach(inv.success_log, log => {
                        log.MESSAGE_DETAILS = vendorInvoice.removeResponseMsg(log.MESSAGE_DETAILS)
                        var postingRes = vendorInvoice.groupErrorMsg(log ? log : {})
                        successList = _.concat(successList, postingRes.successList)
                        errorList = _.concat(errorList, postingRes.errorList)
                    })
                } else if (_.isArrayLike(inv.error_log)) {
                    _.forEach(inv.error_log, log => {
                        log.MESSAGE_DETAILS = vendorInvoice.removeResponseMsg(log.MESSAGE_DETAILS)
                        var postingRes = vendorInvoice.groupErrorMsg(log ? log : {})
                        successList = _.concat(successList, postingRes.successList)
                        errorList = _.concat(errorList, postingRes.errorList)
                    })
                } else {
                    var postingRes = vendorInvoice.groupErrorMsg(inv.success_log ?
                        inv.success_log : inv.error_log ? inv.error_log : {})
                    errorList = postingRes.errorList
                    successList = postingRes.successList
                }

                var offsetVal = _.find(successList, s => {
                    return s.offsetNo != ""
                })
                var documentValue = _.find(successList, s => {
                    return s.documentNo != ""
                })
                allInvoice.push({
                    transactionBatchId: inv.transaction_batch_id,
                    status: inv.status,
                    billId: inv['billDetail.BillDetails_ID'],
                    memoId: inv['billDetail.MemoID'],
                    billNo: inv['billDetail.BillNo'],
                    amount: inv['billDetail.Amount'],
                    invoiceStatus: inv['billDetail.status'],
                    billDate: inv['billDetail.BillDate'],
                    documentNo: documentValue && documentValue.documentNo ? documentValue.documentNo : "",
                    offsetNo: offsetVal && offsetVal.offsetNo ? offsetVal.offsetNo : '',
                    postingData: _.concat(errorList, successList),
                })
            })
            res.status(200).send(apiResponse.successFormat(`success`, `Invoice posting logs`, allInvoice, []))
        } else {
            res.status(200).send(apiResponse.errorFormat(`fail`, `No data found`, {}, []))
        }
    } catch (error) {
        console.log(`something went wrong ${JSON.stringify(error)}`)
        let code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
        const response = errorResponse(error)
        res.status(code).send(response)
    }
}

module.exports.invoicePostingLogs = invoicePostingLogs