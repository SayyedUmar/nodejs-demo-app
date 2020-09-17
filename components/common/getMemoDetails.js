const getMemoDetails = async (req, res) => {
    try {
        var reqQuery = req.query
        let resData = await db.sequelize.query(`CALL sp_getBillsFromMemo(:userId,:memoId,:parentId)`, {
            replacements: {
                userId: reqQuery.userId ? reqQuery.userId : 0,
                memoId: reqQuery.memoId ? reqQuery.memoId : "",
                parentId: reqQuery.parentId ? reqQuery.parentId : "",
            },
            type: db.sequelize.QueryTypes.SELECT
        });
        if (!_.isEmpty(resData[0]) && !_.isEmpty(resData[0]['0']) && !_.isEmpty(resData[1]) && !_.isEmpty(resData[1]['0'])) {
            var billsData = _.toArray(resData[1])
            var memoData = resData[0][0];
            memoData.billingFromCode = billsData[0].billingFromCode
            memoData.billingFromState = billsData[0].billingFromState
            memoData.billingToCode = billsData[0].billingToCode
            memoData.billingToState = billsData[0].billingToState

            res.status(200).send(apiResponse.successFormat(`success`, `Memo details fectched successfully`, {
                memoData: memoData,
                billsData: billsData
            }, []))
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

module.exports.getMemoDetails = getMemoDetails