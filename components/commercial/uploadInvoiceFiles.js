const billActivity = require('../../utils/logs/addBillActivity')
const userActivity = require('../../utils/logs/addUserActivityLog')

class InvoiceFiles {
    storeFile(filePath, bufferFile) {
        return new Promise((resolve, reject) => {
            try {
                fs.writeFile(`${filePath}`, bufferFile, {
                    encoding: 'base64'
                }, (err) => {
                    if (err) {
                        return reject(err)
                    }

                    resolve()
                })
            } catch (error) {
                // console.log(`error ${error}`)
                reject(error)
            }
        })
    }

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

    createDirectory(folderPath) {
        return new Promise((resolve, reject) => {
            try {
                mkdirp(folderPath, (err) => {
                    if (err) {
                        return reject(err)
                    }

                    resolve()
                })
            } catch (error) {
                // console.log(`err ${error}`)
                reject(error)
            }
        })
    }
    async saveFilesData(files, billID, userId) {
        try {
            var filesArr = [];

            _.forEach(files, (fl, key) => {
                if (fl.billFileID == '' || fl.billFileID == null || fl.billFileID == undefined) {
                    filesArr.push({
                        Bill_Details_ID: billID,
                        FilePath: fl.filePath,
                        File_Name: fl.fileName,
                        Created_By: userId,
                        Created_On: moment().format('YYYY-MM-DD HH:mm:ss'),
                        File_Type: fl.fileType
                    })
                }
            })
            await db.billFileDetails.bulkCreate(filesArr, {
                individualHooks: true
            }).catch(err => {
                throw err;
            })
        } catch (error) {
            throw error;
        }
    }
}
const invoiceFiles = new InvoiceFiles()

const uploadInvoiceFiles = async (req, res) => {
    try {
        var reqObj = req.body;

        let userData = await db.users.findAll({
            raw: true,
            where: {
                user_id: reqObj.userId,
                role_id: reqObj.roleId,
                active: 1
            }
        })
        if (userData.length <= 0) {
            res.status(400).send(apiResponse.errorFormat(`fail`, `Invalid user`, {}, []))
        } else {
            let billDetails = await db.billDetails.findAll({
                raw: true,
                where: {
                    BillDetails_ID: reqObj.billId,
                    status: {
                        [Op.not]: 'C'
                    }
                },
                attributes: {
                    exclude: ['CreatedBy', 'CreatedOn']
                }
            })

            if (billDetails.length > 0 && billDetails != null) {

                if (reqObj.removedFiles != null && reqObj.removedFiles.length > 0) {

                    _.forEach(reqObj.removedFiles, async (fl, key) => {
                        let filePath = fl.filePath

                        if (!(fl.billFileID == '' || fl.billFileID == null || fl.billFileID == undefined)) {

                            db.billFileDetails.destroy({
                                where: {
                                    Bill_File_Id: fl.billFileID
                                }
                            })
                            if (fs.existsSync(`${__basedir}/public/uploads/${filePath}`)) {
                                await filesClass.deleteFile(`${__basedir}/public/uploads/${filePath}`)
                            }
                        }
                    })
                }
                if (reqObj.newFiles != null && reqObj.newFiles.length > 0) {
                    await invoiceFiles.saveFilesData(reqObj.newFiles, reqObj.billId, reqObj.userId);
                }

                billActivity.billActivity.addLog({
                    billDetailsId: reqObj.billId,
                    activityCode: "Invoice_Updated",
                    activityDes: "Invoice attachement updated with BillNo : " + billDetails[0].BillNo,
                    currStatus: billDetails[0].status,
                    preStatus: "",
                    updatedBy: reqObj.userId
                });
                userActivity.userActivityLog.addLog({
                    activityName: "Invoice_Updated",
                    details: "Invoice attachement updated with BillNo : " + billDetails[0].BillNo,
                    oldValue: "",
                    newValue: billDetails[0].BillNo,
                    userId: reqObj.userId
                });

                res.status(200).send(apiResponse.successFormat(`success`, `Document uploaded successfully`, {
                    billId: reqObj.billId,
                }, []))

            } else {
                res.status(400).send(apiResponse.errorFormat(`fail`, `No invoice found`, {}, []))
            }
        }
    } catch (error) {
        console.log('Érror', error)
        console.log(`error ${JSON.stringify(error)}`)
        const code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
        const response = errorResponse(error)
        res.status(code).send(response)
    }
}

module.exports = {
    uploadInvoiceFiles
}