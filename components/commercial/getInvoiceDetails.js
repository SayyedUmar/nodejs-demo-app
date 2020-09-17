const getInvoiceDetails = async (req, res) => {
    try {
        let billId = req.query.billId
        let userId = req.query.userId
        let resData = await db.sequelize.query(`CALL SP_getInvoiceDetails(:userId,:billId)`, {
            replacements: {
                userId: userId,
                billId: billId
            },
            type: db.sequelize.QueryTypes.SELECT
        });
        if (!_.isEmpty(resData[0])) {
            var invoiceData = resData[0][0];
            var files = _.toArray(resData[1])
            var lrList = _.toArray(resData[2])
            var taxCodeList = _.map(resData[3])
            var internalOrderMapping = _.map(resData[4])
            var advanceDocuments = _.map(resData[5])
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
                        bill_details_id: billId,
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
            } else {
                var allGL = _.groupBy(lrList, 'glNumber')
                _.forEach(allGL, (gl, key) => {
                    var singleGL = {
                        internalOrder: gl[0].internalOrder,
                        glNumber: gl[0].glNumber,
                        amount: _.sumBy(gl, 'amount'),
                        lrList: gl,
                        glDetails: {},
                        ioDetails: {},
                        tdPercent: 0,
                        taxCode: {},
                        itemText: "",
                        hsnCode: "",
                        assignment: "",
                        tds: false
                    }
                    glList.push(singleGL)
                })
            }
            res.status(200).send(apiResponse.successFormat(`success`, `Invoice details fectched successfully`, {
                invoiceData,
                withHoldingTax: withHoldingTax ? withHoldingTax : {},
                postDate: postDate ? postDate : "",
                headerText: headerText ? headerText : "",
                files,
                lrList,
                glList,
                taxCodeList,
                advanceDocuments
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

module.exports.getInvoiceDetails = getInvoiceDetails