const getPaymentTerms = async (req, res) => {
    try {
        let url = `http://${process.env.BA_PORTAL_URL}/api/v1/masterdata/master/payment-terms`
        request.get({
            headers: {
                'content-type': `application/json`
            },
            url: url
        }, (err, response, body) => {
            if (err) {
                // console.log(`err ${err}`)
                const errorObj = {
                    code: `err_001`,
                    message: errorCode.err_001
                }
                let resp = errorResponse(apiResponse.errorFormat(`fail`, `Something went wrong`, {}, [errorObj], 400))
                res.status(400).send(resp)
            } else {
                // console.log(response.body)
                let result = JSON.parse(response.body)
                if (result) {
                    res.status(200).send(apiResponse.successFormat(`success`, `List of Payment Terms`, result.data, []))
                } else {
                    const errorObj = {
                        code: `err_001`,
                        message: errorCode.err_001
                    }
                    let resp = errorResponse(apiResponse.errorFormat(`fail`, `Something went wrong`, {}, [errorObj], 400))
                    res.status(400).send(resp)
                }
            }
        })

    } catch (error) {
        console.log('error', error)
        console.log(`something went wrong ${JSON.stringify(error)}`)
        let code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
        let response = errorResponse(error)
        res.status(code).send(response)
    }
}
module.exports.getPaymentTerms = getPaymentTerms