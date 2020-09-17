const getDraftFiles = async (req, res) => {
    try {

        const billId = req.query.billId

        let billFileData;
        if (!(billId == null || billId == 0 || billId == '')) {
            let billFileData = await db.draftfildetails.findAll({

                attributes: ['File_Name', 'FilePath', 'Draft_Bill_Details_ID', 'Draft_Bill_File_Id', 'File_Type'],
                where: {
                    Draft_Bill_Details_ID: billId
                }
            })

            var results = []
            if (billFileData == null) {
                res.status(200).send(apiResponse.successFormat(`success`, `No file found`, [], []))
                return;
            } else {
                if (billFileData.length <= 0) {
                    res.status(200).send(apiResponse.successFormat(`success`, `No file found`, [], []))
                    return;
                } else {
                    _.forEach(billFileData, e => {
                        let obj = {
                            billFileId: e.dataValues.Draft_Bill_File_Id,
                            billDetailsId: e.dataValues.Draft_Bill_Details_ID,
                            filePath: e.dataValues.FilePath,
                            fileName: e.dataValues.File_Name,
                            fileType: e.dataValues.File_Type
                        }
                        results.push(obj)
                    })
                    res.status(200).send(apiResponse.successFormat(`success`, `File details fetched successfully`, billFileData, []))
                }
            }
            console.log('billFileData', billFileData)
        }
    } catch (error) {
        console.log(`Error in uploading file `, error)
        console.log(`error $ {JSON.stringify(error)}`)
        const code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
        const response = errorResponse(error)
        res.status(code).send(response)
    }
}

module.exports = {
    getDraftFiles
}