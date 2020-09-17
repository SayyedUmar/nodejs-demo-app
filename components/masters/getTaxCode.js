const getAllTaxCode = async (req, res) => {
    try {
        // let url = `http://${process.env.BA_PORTAL_URL}/api/v1/masterdata/master/tax-code`
        // request.get({
        //     headers: {
        //         'content-type': `application/json`
        //     },
        //     url: url
        // }, (err, response, body) => {
        //     if (err) {
        //         // console.log(`err ${err}`)
        //         const errorObj = {
        //             code: `err_001`,
        //             message: errorCode.err_001
        //         }
        //         let resp = errorResponse(apiResponse.errorFormat(`fail`, `Something went wrong`, {}, [errorObj], 400))
        //         res.status(400).send(resp)
        //     } else {
        //         let result = JSON.parse(response.body)
        //         if (result) {
        //             res.status(200).send(apiResponse.successFormat(`success`, `List of Tax Code`, result.data, []))
        //         } else {
        //             const errorObj = {
        //                 code: `err_001`,
        //                 message: errorCode.err_001
        //             }
        //             let resp = errorResponse(apiResponse.errorFormat(`fail`, `Something went wrong`, {}, [errorObj], 400))
        //             res.status(400).send(resp)
        //         }
        //     }
        // })
        let taxCodeList = await db.taxCode.findAll({
            where: {}
        })
        const results = []
        if (taxCodeList) {
            _.forEach(taxCodeList, tax => {
                let obj = {
                    "taxId": tax.tax_id,
                    "contry": "IN",
                    "taxCode": tax.tax_code,
                    "description": tax.description,
                    "taxPercentage": tax.tax_percentage,
                    "status": 1
                }
                results.push(obj)
            })
        }
        res.status(200).send(apiResponse.successFormat(`success`, `List of Tax Code`, results, []))
    } catch (error) {
        console.log('error', error)
        console.log(`something went wrong ${JSON.stringify(error)}`)
        let code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
        let response = errorResponse(error)
        res.status(code).send(response)
    }
}
module.exports.getAllTaxCode = getAllTaxCode