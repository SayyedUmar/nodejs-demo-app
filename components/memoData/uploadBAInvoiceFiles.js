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

    checkfileExist(filePath) {
        return new Promise((resolve, reject) => {
            try {
                //(fs.existsSync(filePath))
                resolve(fs.existsSync(filePath))
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
}
const invoiceFiles = new InvoiceFiles()

const uploadBAInvoiceFiles = async (req, res) => {
    try {
        // console.log(req.files)
        const fileType = req.query.fileType
        const userId = req.query.userId
        //  const billId = req.query.billId
        const baCode = req.query.baCode

        console.log(req.query.userId)

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

        /* let draftBillsData;
         if (!(billId == null || billId == 0 || billId == '')) {
             let draftBillsData = await db.draftBills.findOne({
                 include: [{
                     model: db.ba,
                     required: true,
                     attributes: []
                 }],
                 attributes: ['BA_Code', 'Billing_From_code', 'Billing_To_code'],
                 where: {
                     Draft_Bill_ID: billId,
                     BA_Code: baData.dataValues.ba_id
                 }
             })

             console.log('draftBillsData', draftBillsData)
             if (draftBillsData == null) {
                 res.status(200).send(apiResponse.successFormat(`success`, `No invoice details found for specific id`, draftBillsData, []))
             }
         }*/

        const files = req.file
        let allFiles = [];
        let billFiles = [];

        // for (let i = 0; i < files.length; i++) {
        file = files //[0]
        //  var baCode = baCode;
        const timestamp = moment().valueOf() //format('YYYYMMDDHHmmss') //.valueOf()

        const fileName = `${timestamp}_${fileType}_${file.originalname}`
        let folderPath = `${__basedir}/public/uploads/baInvfiles/${baCode}`
        await invoiceFiles.createDirectory(folderPath)

        const filePath = `${folderPath}/${fileName}`
        const bufferFile = file.buffer

        // create Directory if not exist for BA
        await invoiceFiles.createDirectory(folderPath)
        // store file on server
        await invoiceFiles.storeFile(filePath, bufferFile)
        var baFilePath = filePath.replace(`${__basedir}/public/uploads/`, '')
        allFiles.push({
            filePath: baFilePath,
            fileName: fileName,
            fileType: fileType
        })
        /* if (!(billId == null || billId == 0 || billId == '')) {
             billFiles.push({
                 Draft_Bill_Details_ID: billId,
                 FilePath: baFilePath,
                 File_Name: fileName,
                 Created_By: userId,
                 Created_On: moment().format('YYYY-MM-DD HH:mm:ss'),
                 File_Type: fileType
             })
         }
         //}

         await db.draftfildetails.bulkCreate(billFiles)
         */
        res.status(200).send(apiResponse.successFormat(`success`, `Document uploaded successfully`, {
                baCode: baCode,
                // draftBillId: (billId == null || billId == '') ? 0 : billId,
                files: allFiles
            },
            []))

    } catch (error) {
        console.log(`Error in uploading file `, error)
        console.log(`error ${JSON.stringify(error)}`)
        const code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
        const response = errorResponse(error)
        res.status(code).send(response)
    }
}

const deleteSingleDraftFile = async (req, res) => {

    let reqQuery = req.query;

    try {

        /* if (!(reqQuery.draftBillDetailsId == '' || reqQuery.draftBillDetailsId == 0)) {

             let draftBillsData = await db.draftBills.findOne({
                 include: [{
                     model: db.ba,
                     required: true,
                     attributes: []
                 }],
                 attributes: ['BA_Code', 'Billing_From_code', 'Billing_To_code'],
                 where: {
                     Draft_Bill_ID: reqQuery.draftBillDetailsId,
                     BA_Code: reqQuery.baCode
                 }
             })

             if (draftBillsData == null) {
                 res.status(200).send(apiResponse.successFormat(`fail`, `Invoice details not found`, '', []));
                 return;
             }
             

        let draftfildetails = await db.draftfildetails.findAll({
            where: {
                Draft_Bill_File_Id: reqQuery.draftBillFileId,
                Draft_Bill_Details_ID: reqQuery.draftBillDetailsId
            }
        })
        
        if (draftfildetails.length <= 0) {
            res.status(200).send(apiResponse.successFormat(`fail`, `File details not found`, '', []));
            return;
        }
        

        var results = []
        const deleted = await db.draftfildetails.destroy({
            where: {
                Draft_Bill_File_Id: reqQuery.draftBillFileId,
                Draft_Bill_Details_ID: reqQuery.draftBillDetailsId
            }
        });
    }*/

        let folderPath = `${__basedir}/public/uploads/${reqQuery.filePath}`

        console.log('folderPath', folderPath)
        if (!fs.existsSync(folderPath)) {
            res.status(200).send(apiResponse.successFormat(`success`, `File not exists.`, [], []));
            return;
        }

        await invoiceFiles.deleteFile(folderPath)

        res.status(200).send(apiResponse.successFormat(`success`, `Document deleted successfully`, {
                baCode: reqQuery.baCode,
                filePath: reqQuery.filePath
                //draftBillFileId: (reqQuery.draftBillFileId == null || reqQuery.draftBillFileId == '') ? 0 : reqQuery.draftBillFileId,
                //   draftBillDetailsId: (reqQuery.draftBillDetailsId == null || reqQuery.draftBillDetailsId == '') ? 0 : reqQuery.draftBillDetailsId
            },
            []))
    } catch (error) {
        console.log('Error in deleteDraftFile ', error);
        const errorObj = {
            code: `err_001`,
            message: errorCode.err_001
        }
        res.status(400).send(apiResponse.errorFormat(`fail`, `Failed to delete Draft file`, errorObj, []));
    }
}

module.exports = {
    uploadBAInvoiceFiles,
    deleteSingleDraftFile
}