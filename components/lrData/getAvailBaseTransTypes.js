const getAvailBaseTransType = async (req, res) => {
    try {

        let baDetails = await db.ba.findOne({
            where: {
                ba_id: req.query.baCode
            },
            attributes: ['ba_code']
        })
        if (baDetails) {
            if (baDetails.length <= 0) {
                let resp = errorResponse(apiResponse.errorFormat(`fail`, `BA not found`, {}, [errorObj], 400))
                res.status(400).send(resp)
            } else {
                let baGSTCode = baDetails.ba_code
                console.log('baGSTCode', baDetails.ba_code)

                let url = `http://${process.env.BA_PORTAL_URL}/api/v1/sap/getAvailableTransType?vendorCode=${baGSTCode}`
                //let url = `http://localhost:8081/api/v1/sap/getAvailableTransType?vendorCode=${baGSTCode}`

                request.get({
                    headers: {
                        'content-type': `application/json`,
                    },
                    url: url,
                    json: true
                }, (err, response, body) => {
                    if (err) {
                        console.log(`err--------->`, err)
                        const errorObj = {
                            code: `err_001`,
                            message: errorCode.err_001
                        }
                        let resp = errorResponse(apiResponse.errorFormat(`fail`, `Something went wrong`, {}, [errorObj], 400))
                        res.status(400).send(resp)
                    } else {
                        if (response.statusCode == 200) {

                            console.log('response.body', response.body)
                            if (response.body.length <= 0) {
                                res.status(200).send(apiResponse.successFormat(`success`, `No Data Found`, [], []))
                                return;
                            }
                            let result = response.body
                            res.status(200).send(apiResponse.successFormat(`success`, `Base Trans Type data fetched successfully`, result, []))
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
            }
        }
    } catch (error) {
        console.log(error)
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
module.exports.getAvailBaseTransType = getAvailBaseTransType;