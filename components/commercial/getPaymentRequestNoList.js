const getPaymentRequestNoList = async (req, res) => {
    try {
        var reqQuery = req.query
        let locations = await db.userMapping.findAll({
            attributes: ['Location_ID'],
            where: {
                User_ID: reqQuery.userId
            },
            raw: true
        })
        var paymentRequestNoList = await db.paymentProcessedDetails.findAll({
            where: {
                Payment_Req_No: {
                    [Op.like]: `${reqQuery.paymentRequestNo}%`
                },
                status: "Open"
            },
            raw: true,
            attributes: [
                [Sequelize.fn('DISTINCT', Sequelize.col('Payment_Req_No')), 'paymentRequestNo'],
            ],
            include: [{
                model: db.billDetails,
                required: true,
                where: {
                    TotalPayment_Released: 0
                },
                raw: true,
                attributes: [],
                include: [{
                    model: db.memoDetails,
                    required: true,
                    raw: true,
                    // where: {
                    //     Submittion_Location_Code: _.map(locations, 'Location_ID')
                    // },
                    attributes: []
                }]
            }]
        })
        if (paymentRequestNoList.length > 0) {
            res.status(200).send(apiResponse.successFormat(`success`, `Payment request number list fectched successfully`, {
                paymentRequestNoList: _.map(paymentRequestNoList, 'paymentRequestNo')
            }, []))
        } else {
            res.status(200).send(apiResponse.errorFormat(`fail`, `No data found`, {
                paymentRequestNoList: []
            }, []))
        }
    } catch (error) {
        console.log(`error ${JSON.stringify(error)}`)
        const code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
        const response = errorResponse(error)
        res.status(code).send(response)
    }
}

module.exports.getPaymentRequestNoList = getPaymentRequestNoList