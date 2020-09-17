class DeleteFiles {

    deleteFile(filePath) {
        return new Promise((resolve, reject) => {
            try {
                fs.unlinkSync(`${filePath}`)
                resolve()
            } catch (error) {
                reject(error)
            }
        })
    }

}
const deleteFiles = new DeleteFiles()

const deleteInvoiceFiles = async (req, res) => {
    try {
        const userId = req.body.userId
        const billId = req.body.billId
        const billFiles = req.body.billFiles

        let locations = await db.userMapping.findAll({
            attributes: ['Location_ID'],
            where: {
                User_ID: userId
            }
        })
        var allLocations = _.map(locations, function (l) {
            return l.dataValues.Location_ID
        })
        let billDetails = await db.billDetails.findAll({
            where: {
                BillDetails_ID: billId
            },
            attributes: {
                exclude: ['CreatedBy', 'CreatedOn']
            },
            include: [{
                model: db.memoDetails,
                required: true,
                attributes: {
                    exclude: ['CreatedBy', 'CreatedOn']
                },
            }, {
                model: db.billFileDetails,
                required: true,
                where: {
                    Bill_File_Id: billFiles
                },
                attributes: {
                    exclude: ['CreatedBy', 'CreatedOn']
                },
            }],
        })
        if (billDetails.length > 0) {
            if (_.indexOf(allLocations, billDetails[0].memoDetail.dataValues.Submittion_Location_Code) > -1) {
                if (billDetails[0].dataValues.status != 'C') {
                    for (let i = 0; i < billDetails.length; i++) {
                        await deleteFiles.deleteFile(`${__basedir}/public/uploads/${billDetails[i].billFileDetail.dataValues.FilePath}`)
                    }
                    db.billFileDetails.destroy({
                        where: {
                            Bill_File_Id: billFiles
                        }
                    })
                    res.status(200).send(apiResponse.successFormat(`success`, `Document deleted successfully`, {}, []))
                } else {
                    res.status(400).send(apiResponse.errorFormat(`fail`, `Invoice is rejected`, {}, []))
                }
            } else {
                res.status(400).send(apiResponse.errorFormat(`fail`, `You do not have access to delete files in this invoice`, {}, []))
            }
        } else {
            res.status(400).send(apiResponse.errorFormat(`fail`, `No invoice found`, {}, []))
        }
    } catch (error) {
        console.log(`error ${JSON.stringify(error)}`)
        const code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
        const response = errorResponse(error)
        res.status(code).send(response)
    }
}

module.exports = {
    deleteInvoiceFiles
}