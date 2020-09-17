const getInvoiceAttachments = async (req, res) => {
    try {

        // const userId = req.query.userId
        const billId = req.query.billId
        const billfileId = req.query.billFileId
        /*
                let baData = await db.ba.findOne({
                    include: [{
                        model: db.users,
                        required: true,
                        where: {
                            user_id: userId,
                            role_id: 1 //--BA role
                        },
                        attributes: []
                    }],
                    where: {
                        ba_id: baCode
                    },
                    attributes: ['ba_id']
                })
                if (baData == null || baData.length <= 0) {
                    res.status(200).send(apiResponse.successFormat(`success`, `Invalid user`, baData, []))
                }
                */

        let billFileData;
        if (!(billId == null || billId == 0 || billId == '')) {
            let billFileData = await db.billFileDetails.findAll({

                attributes: ['File_Name', 'FilePath', 'Bill_Details_ID', 'Bill_File_Id', 'File_Type'],
                where: {
                    Bill_File_Id: billfileId,
                    Bill_Details_ID: billId
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
                            billFileId: e.dataValues.Bill_File_Id,
                            billDetailsId: e.dataValues.Bill_Details_ID,
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
    getInvoiceAttachments
}