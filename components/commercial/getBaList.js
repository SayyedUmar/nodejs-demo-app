const getBaList = async (req, res) => {
    try {
        var reqQuery = req.query
        var baList = await db.ba.findAll({
            where: {
                ba_name: {
                    [Op.like]: `%${reqQuery.baName}%`
                },
                isActive: 1
            },
            raw: true,
            // group: ['ba_group_id'],
            attributes: [
                ['ba_name', 'baName'],
                ['ba_code', 'baCode'],
                ['ba_id', 'baId'],
                ['ba_group_id', 'parentId'],
                [Sequelize.fn('CONCAT', Sequelize.col('ba_name'), ' ', Sequelize.col('ba_code')), 'baDisplayName']
            ]
        })
        if (baList.length > 0) {
            res.status(200).send(apiResponse.successFormat(`success`, `Ba list fectched successfully`, baList, []))
        } else {
            res.status(200).send(apiResponse.errorFormat(`fail`, `No data found`, [], []))
        }
    } catch (error) {
        console.log(`error ${JSON.stringify(error)}`)
        const code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
        const response = errorResponse(error)
        res.status(code).send(response)
    }
}

module.exports.getBaList = getBaList