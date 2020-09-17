const saveTaxCode = async (req, res) => {
    try {
        let taxCodeList = req.body;
        let newTaxCode = [];
        _.forEach(taxCodeList, (tax, key) => {
            newTaxCode.push({
                tax_code: tax.tax_code,
                Description: tax.description,
                tax_percentage: tax.tax_percentage
            })
        })
        await db.taxCode.bulkCreate(newTaxCode, {
                // fields: ["Internal_order_Number"],
                // made internal order unique in db
                updateOnDuplicate: ["description", "tax_percentage"]
            }).then(result => {
                // console.log(result)
                res.status(200).send(apiResponse.successFormat(`success`, `Tax code saved successfully`, {}, []))
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

module.exports.saveTaxCode = saveTaxCode