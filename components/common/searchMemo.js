const searchMemo = async (req, res) => {
    try {
        let memoStr = req.query.memo
        var memoWhere = {
            Memo_Number: {
                [Op.like]: `%${memoStr}%`
            },
        }
        if (req.query.userId) {
            let userId = req.query.userId
            let locations = await db.userMapping.findAll({
                attributes: ['Location_ID'],
                where: {
                    User_ID: userId
                },
                raw: true
            })
            memoWhere.Submittion_Location_Code = _.map(locations, 'Location_ID')
        } else {
            let baCodes = await db.ba.findAll({
                attributes: ['BA_ID'],
                raw: true,
                where: {
                    ba_group_id: req.query.parentId
                }
            })
            memoWhere.BA_Code = _.map(baCodes, 'BA_ID')
        }
        let memoNumbers = await db.memoDetails.findAll({
            where: memoWhere,
            attributes: {
                exclude: ['CreatedBy', 'CreatedOn']
            }
        })
        const resultArr = []
        _.forEach(memoNumbers, memo => {
            let obj = {
                memoId: memo.Memo_ID,
                memoDate: memo.Memo_Date,
                memoNumber: memo.Memo_Number,
                submitToId: memo.Submit_To_ID,
                baCode: memo.BA_Code,
                submittionLocationCode: memo.Submittion_Location_Code,
                fiscalYear: memo.FiscalYear
            }
            resultArr.push(obj)
        })
        res.status(200).send(apiResponse.successFormat(`success`, `List of memo number`, resultArr, []))
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

module.exports.searchMemo = searchMemo