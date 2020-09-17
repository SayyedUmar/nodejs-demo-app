const saveWithHoldingTax = async (req, res) => {
    try {
        let withHoldingTaxList = req.body;
        let newWithHoldingTax = [];
        _.forEach(withHoldingTaxList, (withHoldingTax, key) => {
            newWithHoldingTax.push({
                'w/h_tax_type': withHoldingTax.tax_type,
                'w/h_tax_code': withHoldingTax.tax_code,
                'tax_rate': withHoldingTax.tax_rate
            })
        })
        await db.withholding_tax.bulkCreate(newWithHoldingTax, {
                // fields: ["Internal_order_Number"],
                // made internal order unique in db
                // updateOnDuplicate: ["w/h_tax_type", "w/h_tax_code", "tax_rate"]
            }).then(result => {
                // console.log(result)
                res.status(200).send(apiResponse.successFormat(`success`, `Withholding tax saved successfully`, {}, []))
            })
            .catch((error) => {
                console.log(error);
                res.status(400).send(apiResponse.errorFormat(`fail`, `No data found`, {}, []))
            })
    } catch (error) {
        console.log(`something went wrong ${JSON.stringify(error)}`)
        let errorResponse = {}
        let code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500

        if (Object.prototype.hasOwnProperty.call(error, 'status')) {
            errorResponse = error
            errorResponse = _.omit(errorResponse, ['code'])
        } else {
            errorResponse = {
                status: 'fail',
                message: 'Something went wrong',
                data: {},
                error: [{
                    code: 'err_001',
                    message: errorCode.err_001
                }]
            }
        }
        res.status(code).send(errorResponse)
    }
}

module.exports.saveWithHoldingTax = saveWithHoldingTax