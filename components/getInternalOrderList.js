const getInternalOrderList = async (req, res) => {
    try {
        let url = `http://${process.env.BA_PORTAL_URL}/api/v1/sap/sap-io-details?io=${req.query.io}`
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
                let result = JSON.parse(body)
                if (result && result.data) {
                    const resultArr = []
                    _.forEach(result.data, io => {
                        let obj = {
                            ioId: io.sap_io_details_id,
                            internalOrder: io.INTRNL_ORDR,
                            description: io.INTRNL_ORDR_DESCR
                        }
                        resultArr.push(obj)
                    })
                    res.status(200).send(apiResponse.successFormat(`success`, `List of Internal-Order`, resultArr, []))
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

const getInternalOrderlst_self = async (req, res) => {
    try {
        const internalOrder = req.params.internlOrdrNum;
        let InternalOrderData = await db.internalOrderData.findAll({
                where: {
                    Active: 1,
                    Internal_order_Number: {
                        [Sequelize.Op.like]: internalOrder + '%'
                    }
                },
                attributes: ['Internal_order_id', 'Internal_order_Number'],
                group: ['Internal_order_Number']
            })
            .catch((error) => {
                console.log(error);
            })

        console.log(InternalOrderData)
        const results = []
        if (InternalOrderData) {
            _.forEach(InternalOrderData, e => {
                let obj = {
                    internalOrderId: e.dataValues.Internal_order_id,
                    internalOrderNumber: e.dataValues.Internal_order_Number
                }
                results.push(obj)
            })
            res.status(200).send(apiResponse.successFormat(`success`, `Internal Order details fectched successfully`, results, []))
        } else {
            res.status(400).send(apiResponse.errorFormat(`fail`, `No data found`, {}, []))
        }
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

module.exports.getInternalOrderList = getInternalOrderList