const searchBatchId = async (req, res) => {
    try {
        var reqQuery = req.query
        let locations = await db.userMapping.findAll({
            attributes: ['Location_ID'],
            raw: true,
            where: {
                User_ID: reqQuery.userId
            }
        })
        var allLocations = _.uniq(_.map(locations, function (l) {
            return l.Location_ID
        }))
        let users = await db.userMapping.findAll({
            where: {
                Location_ID: allLocations
            },
            attributes: [
                [Sequelize.fn('DISTINCT', Sequelize.col('User_ID')), 'User_ID']
            ],
            raw: true
        })
        var allUser = _.map(users, function (l) {
            return l.User_ID
        })
        var batchList = await db.auditLogExpense.findAll({
            where: {
                File_Name: {
                    [Op.like]: `%${reqQuery.batchId}%`
                },
                User: allUser
            },
            raw: true,
            order: [
                ['Upload_Date', 'DESC']
            ]
        })
        if (batchList) {
            var allbatchList = _.map(batchList, batch => {
                return {
                    batchName: batch.File_Name,
                    records: batch.Total_No_of_Records,
                    batchId: batch.AuditLogID,
                    batchDate: batch.Upload_Date,
                    userId: batch.User
                }
            })
            res.status(200).send(apiResponse.successFormat(`success`, `Batch list`, allbatchList, []))
        } else {
            res.status(200).send(apiResponse.errorFormat(`fail`, `No data found`, [], []))
        }
    } catch (error) {
        console.log(`something went wrong ${JSON.stringify(error)}`)
        let code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
        const response = errorResponse(error)
        res.status(code).send(response)
    }
}

module.exports.searchBatchId = searchBatchId