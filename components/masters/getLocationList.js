const getLocationList = async (req, res) => {
    try {

        db.location.belongsTo(db.state, {
            foreignKey: 'state_code',
            targetKey: 'State_ID'
        });
        let locations = await db.location.findAll({

            attributes: ['location_id', 'Location_code', 'Location_Name', 'Plant_code', 'IsUT', 'State_code', 'IsActive', 'state.State_Name'],
            include: [{
                model: db.state,
                required: true,
                attributes: [],
                where: {
                    IsActive: 1
                }
            }],
            raw: true
        })
        const results = []
        if (locations) {
            _.forEach(locations, x => {
                let obj = {
                    LOCATION_ID: x.location_id,
                    LOCATION_CODE: x.Location_code,
                    LOCATION_NAME: x.Location_Name,
                    PLANT_CODE: x.Plant_code,
                    ISUT: x.IsUT == "1" ? true : false,
                    State_Code: x.State_code,
                    State_Name: x.State_Name,
                    IsActive: x.IsActive == "1" ? true : false
                }
                results.push(obj)
            });
            res.status(200).send(apiResponse.successFormat(`success`, `locations List`, results, []))
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
module.exports.getLocationList = getLocationList