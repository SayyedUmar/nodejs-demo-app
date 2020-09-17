const getOnHoldReason = async (req, res) => {
    try {
        let reasons = await db.onHoldReasons.findAll({
            where: {
                IsActive: 1
            },
            attributes: {
                exclude: ['UpdatedBy', 'UpdatedOn']
            }
        })
        const results = []
        if (reasons) {
            _.forEach(reasons, e => {
                let obj = {
                    onHoldReasonID: e.dataValues.OnHold_Reason_ID,
                    onHoldReasonCode: e.dataValues.OnHold_Reason_code,
                    onHoldReasonName: e.dataValues.OnHold_Reason_Name,
                    onHoldReasonType: e.dataValues.OnHold_Reason_Type,
                    isActive: e.dataValues.IsActive
                }
                results.push(obj)
            })
            res.status(200).send(apiResponse.successFormat(`success`, `Onhold Reasons fectched successfully`, results, []))
        }
    } catch (error) {
        console.log('error', error)
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

module.exports.getOnHoldReason = getOnHoldReason