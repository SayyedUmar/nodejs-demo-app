const getRejectionReason = async (req, res) => {
    try {
        let reasons = await db.rejectionReasons.findAll({
            where: {
                IsActive: 1,
                Type: req.query.type ? req.query.type : 'invoice'
            },
            attributes: {
                exclude: ['UpdatedBy', 'UpdatedOn']
            }
        })
        const results = []
        if (reasons) {
            _.forEach(reasons, e => {
                let obj = {
                    reasonID: e.dataValues.Reason_ID,
                    reasonCode: e.dataValues.Reason_code,
                    reasonName: e.dataValues.Reason_Name
                }
                results.push(obj)
            })
            res.status(200).send(apiResponse.successFormat(`success`, `Rejection Reasons fectched successfully`, results, []))
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

module.exports.getRejectionReason = getRejectionReason