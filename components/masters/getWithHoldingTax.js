const getWithHoldingTax = async (req, res) => {
    try {
        let baCode = req.query.baCode
        let resData = await db.sequelize.query(`CALL SP_getWithHoldingTaxByBa(:baCode)`, {
            replacements: {
                baCode: baCode
            },
            type: db.sequelize.QueryTypes.SELECT
        });
        if (!_.isEmpty(resData[0])) {
            res.status(200).send(apiResponse.successFormat(`success`, `With holding tax list fectched successfully`, _.toArray(resData[0]), []))
        } else {
            res.status(200).send(apiResponse.errorFormat(`fail`, `No data found`, {}, []))
        }
    } catch (error) {
        console.log(`error ${JSON.stringify(error)}`)
        const code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
        const response = errorResponse(error)
        res.status(code).send(response)
    }
}

module.exports.getWithHoldingTax = getWithHoldingTax