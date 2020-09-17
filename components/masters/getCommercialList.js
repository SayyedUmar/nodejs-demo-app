const getCommercialList = async (req, res) => {
    try {
        let commercialUsers = await db.users.findAll({
            raw: true,
            where: {
                role_id: 2,
                active: 1
            },
            attributes: ['user_id', 'user_name', 'first_name', 'last_name', 'token_id', 'email_id']
        })
        console.log(commercialUsers)

        db.userMapping.belongsTo(db.location, {
            foreignKey: 'Location_ID',
            targetKey: 'location_id'
        });
        let mappedLocations = await db.userMapping.findAll({
            raw: true,
            attributes: ['Location_ID', 'User_ID', 'location.Location_Name'],
            include: [{
                model: db.location,
                required: true,
                attributes: []
            }]
            /*where: {
                user_id: 74
            }*/
        })
        //  console.log(mappedLocations)

        const results = []
        if (commercialUsers) {
            _.forEach(commercialUsers, e => {
                //.log('-------------', e)
                var mappLocArr = mappedLocations.filter(function (l) {
                    return l.User_ID === e.user_id;
                })

                let obj = {
                    ID: e.user_id,
                    // userName: e.dataValues.user_name,
                    NAME: e.first_name.toUpperCase() + ' ' + e.last_name.toUpperCase()
                        //tokenId: e.dataValues.token_id,
                        //emailId: e.dataValues.email_id                        
                        // ,
                        ,
                    Location_IDs: _.map(mappLocArr, function (l) {
                        return l.Location_ID
                    })
                }
                results.push(obj)
            });
            res.status(200).send(apiResponse.successFormat(`success`, `Commercial List`, results, []))
        } else {
            res.status(200).send(apiResponse.successFormat(`success`, `No data found`, [], []))
        }
    } catch (error) {
        console.log('error', error)
        console.log(`something went wrong ${JSON.stringify(error)}`)
        let code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
        let response = errorResponse(error)
        res.status(code).send(response)
    }
}
module.exports.getCommercialList = getCommercialList