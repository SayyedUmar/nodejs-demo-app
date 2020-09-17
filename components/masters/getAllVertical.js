const getAllVertical = async (req, res) => {
    try {
        let allVertical = await db.verticalModel.findAll({
            where: {
                Active: 1
            },
            attributes: [
                ['Active', 'IsActive'],
                ['Vertical_Code', 'VERTICAL_CODE'],
                ['Vertical_Id', 'VERTICAL_ID'],
                ['Vertical_Name', 'VERTICAL_NAME'],
                ['Vertical_ShortName', 'VERTICAL_SHORT_NAME'],
                ['Vertical_Head_Email', 'VERTICAL_HEAD_EMAIL']
            ],
            raw: true
        })
        if (allVertical && allVertical.length > 0) {
            res.status(200).send(apiResponse.successFormat(`success`, `Vertical List`, allVertical, []))
        } else {
            res.status(200).send(apiResponse.successFormat(`success`, `No data found`, [], []))
        }
    } catch (error) {
        console.log(`something went wrong ${JSON.stringify(error)}`)
        let code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
        let response = errorResponse(error)
        res.status(code).send(response)
    }
}
module.exports.getAllVertical = getAllVertical