const getInvoiceInfo = async (req, res) => {
    try {
        var reqQuery = req.query
        let resData = await db.sequelize.query(`CALL SP_GetInvoiceInfo(:billId)`, {
            replacements: {
                billId: reqQuery.billId
            },
            type: db.sequelize.QueryTypes.SELECT
        });
        if (!_.isEmpty(resData[0])) {
            var invoiceData = resData[0][0];
            var files = _.toArray(resData[1])
            var lrList = _.toArray(resData[2])
            var advanceDocuments = _.toArray(resData[3])
            var internalOrderMapping = _.toArray(resData[4])
            var expenseData = resData[5] && resData[5][0] ? resData[5][0] : {}
            var paymentProcessData = _.toArray(resData[6])
            var onholdData = _.toArray(resData[7])
            var paymentData = _.toArray(resData[8])
            var glList = []
            if (internalOrderMapping.length > 0) {
                var allGL = _.groupBy(lrList, 'billInternalOrderMappingId')
                var withHoldingTax = null
                var headerText = null
                var postDate = null
                var transIds = await db.vendorInvoice.findOne({
                    attributes: [
                        [db.sequelize.fn('max', db.sequelize.col('trn_batchid')), 'trn_batchid']
                    ],
                    raw: true,
                    where: {
                        bill_details_id: reqQuery.billId,
                        status: 'success',
                        event: 'SIM'
                    }
                })
                if (transIds) {
                    var postingDetails = await db.vendorInvoice.findOne({
                        where: {
                            trn_batchid: transIds.trn_batchid
                        },
                        raw: true
                    })
                    postDate = postingDetails ? postingDetails.post_date : ""
                }
                _.forEach(internalOrderMapping, (io, key) => {
                    var singleGL = {
                        billIOMappingId: io.billIOMappingId,
                        internalOrder: io.internalOrder,
                        glNumber: io.glNumber,
                        glDetails: {
                            glAccountId: io.glId,
                            glAccount: io.glNumber,
                            description: io.glDescription
                        },
                        ioDetails: {
                            ioId: io.internalOrderId,
                            internalOrder: io.internalOrder
                        },
                        amount: io.amount,
                        lrList: allGL[io.billIOMappingId],
                        tds: io.whId ? true : false,
                        hsnCode: io.hsnCode,
                        assignment: io.assignment,
                        itemText: io.itemText,
                        taxCode: {
                            taxId: io.taxId,
                            taxCode: io.taxCode,
                            description: io.taxDescription,
                            taxPercentage: io.taxPercentage
                        },
                        tdPercent: io.td ? ((io.td * 100) / io.amount) : 0,
                    }
                    if (io.headerText) {
                        headerText = io.headerText
                    }
                    if (io.whId) {
                        withHoldingTax = {
                            whId: io.whId,
                            whTaxCode: io.whTaxCode,
                            whTaxType: io.whTaxType,
                            whTaxRate: io.whTaxRate,
                            whTaxString: io.whTaxType + '-' + io.whTaxCode + '-' + io.whTaxRate + '%'
                        }
                    }
                    glList.push(singleGL)
                })
            }
            res.status(200).send(apiResponse.successFormat(`success`, `Invoice details fectched successfully`, {
                invoiceData,
                files,
                lrList,
                advanceDocuments,
                internalOrderMapping,
                withHoldingTax: withHoldingTax ? withHoldingTax : {},
                postDate: postDate ? postDate : "",
                headerText: headerText ? headerText : "",
                expenseData,
                paymentProcessData,
                onholdData,
                glList,
                paymentData
            }, []))
        } else {
            res.status(400).send(apiResponse.errorFormat(`fail`, `No data found`, {}, []))
        }
    } catch (error) {
        console.log(`error ${JSON.stringify(error)}`)
        const code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
        const response = errorResponse(error)
        res.status(code).send(response)
    }
}

module.exports.getInvoiceInfo = getInvoiceInfo