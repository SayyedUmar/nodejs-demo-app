const getFileTypeList = async (req, res) => {
    try {
        let fileTypes = await db.fileTypeMst.findAll({
            where: {
                is_active: 1
            },
            attributes: ['file_type_id', 'file_type', 'is_required', 'files_limit']
        })
        console.log(fileTypes)
        const results = []
        if (fileTypes) {
            _.forEach(fileTypes, e => {
                let obj = {
                    fileTypeId: e.dataValues.file_type_id,
                    fileType: e.dataValues.file_type,
                    isRequired: e.dataValues.is_required,
                    filesLimit: e.dataValues.files_limit
                }
                results.push(obj)
            });
            res.status(200).send(apiResponse.successFormat(`success`, `File Type List`, results, []))
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
module.exports.getFileTypeList = getFileTypeList