class FilesClass {
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
                console.log(`error ${error}`)
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
                console.log(`err ${error}`)
                reject(error)
            }
        })
    }
}
const filesClass = new FilesClass()

const uploadFiles = async (req, res) => {
    try {
        // console.log(req.files)
        var files = req.files;
        const fileType = req.query.fileType
        const timestamp = moment().valueOf()
        var allFiles = []
        for (let i = 0; i < files.length; i++) {
            let file = files[i]
            // const fileName = `${timestamp}_${fileType}_${file.originalname}`
            const fileName = `${timestamp}_${file.originalname}`
            var extension = path.extname(file.originalname).toLowerCase().split('.').pop()
            let folderPath = `${__basedir}/public/uploads/allfiles`
            await filesClass.createDirectory(folderPath)

            const filePath = `${folderPath}/${fileName}`

            const bufferFile = file.buffer

            // create Directory if not exist for BA
            await filesClass.createDirectory(folderPath)
            // store file on server
            await filesClass.storeFile(filePath, bufferFile)
            var baFilePath = filePath.replace(`${__basedir}/public/uploads/`, '')
            allFiles.push({
                filePath: baFilePath,
                fileName: fileName,
                fileType: fileType,
                extension: extension
            })
        }
        res.status(200).send(apiResponse.successFormat(`success`, `Document uploaded successfully`, {
            allFiles: allFiles
        }, []))
    } catch (error) {
        console.log(`error ${JSON.stringify(error)}`)
        const code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
        const response = errorResponse(error)
        res.status(code).send(response)
    }
}

const deleteFiles = async (req, res) => {
    try {
        const filesPath = req.body.files
        for (let i = 0; i < filesPath.length; i++) {
            let filePath = filesPath[i]
            await filesClass.deleteFile(`${__basedir}/public/uploads/${filePath}`)
        }
        res.status(200).send(apiResponse.successFormat(`success`, `Document deleted successfully`, {}, []))
    } catch (error) {
        console.log(`error ${JSON.stringify(error)}`)
        const code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
        const response = errorResponse(error)
        res.status(code).send(response)
    }
}

module.exports = {
    uploadFiles,
    deleteFiles
}