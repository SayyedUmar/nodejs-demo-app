const getParentServiceCat = async (req, res) => {
    try {
        let serviceCategory = await db.serviceCategory.findAll({
            where: {
                IsActive: 1
            },
            attributes: {
                exclude: ['UpdatedBy', 'UpdatedOn', 'Service_ID', 'Service_code', 'Service_Name', 'HSN_Code', 'IsActive']
            },
            group: ['Parent_Service_Name']
                //distinct: true
                ,
            order: ['Parent_Service_Name']
        })

        const results = []
        if (serviceCategory) {
            _.forEach(serviceCategory, e => {
                let obj = {
                    parentServiceCatName: e.dataValues.Parent_Service_Name
                }
                results.push(obj)
            })
            res.status(200).send(apiResponse.successFormat(`success`, `Parent Service categoty fectched successfully`, results, []))
        } else {
            res.status(400).send(apiResponse.errorFormat(`fail`, `No data found`, {}, []))
        }
    } catch (error) {
        console.log(`something went wrong ${JSON.stringify(error)}`)
        let code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
        let response = errorResponse(error)
        res.status(code).send(response)
    }
}

const getChildServiceCat = async (req, res) => {
    const parentServCatName = req.params.serviceCat;
    try {
        var whereCls = ''
        if (parentServCatName == 'All') {
            whereCls = {
                IsActive: 1
            };
        } else {
            whereCls = {
                IsActive: 1,
                Parent_Service_Name: parentServCatName
            };
        }
        let serviceCategory = await db.serviceCategory.findAll({
            where: whereCls,
            attributes: {
                exclude: ['UpdatedBy', 'UpdatedOn', 'parentServCatName', 'IsActive']
            },
            order: ['Service_Name']
        })
        // console.log('Length serviceCategory ', serviceCategory.length)
        // console.log(serviceCategory)
        const results = []
        if (serviceCategory) {
            _.forEach(serviceCategory, e => {
                let obj = {
                    serviceID: e.dataValues.Service_ID,
                    serviceCode: e.dataValues.Service_code,
                    serviceName: e.dataValues.Service_Name,
                    hsnCode: e.dataValues.HSN_Code
                }
                results.push(obj)
            })
            res.status(200).send(apiResponse.successFormat(`success`, `Service categoty fectched successfully`, results, []))
        } else {
            res.status(400).send(apiResponse.errorFormat(`fail`, `No data found`, {}, []))
        }
    } catch (error) {
        console.log(`something went wrong ${JSON.stringify(error)}`)
        let code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
        let response = errorResponse(error)
        res.status(code).send(response)
    }
}


module.exports.getServiceCat = {
    getParentServiceCat,
    getChildServiceCat
}