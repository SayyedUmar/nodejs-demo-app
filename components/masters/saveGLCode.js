const saveGLCode = async (req, res) => {
    try {
        let glCodeList = req.body;
        let newGLCode = [];
        _.forEach(glCodeList, (gl, key) => {
            newGLCode.push({
                Gl_code: gl.gl_account,
                Gl_Name: gl.remark,
                Gl_Description: gl.description
            })
        })
        await db.glCode.bulkCreate(newGLCode, {
                // fields: ["Internal_order_Number"],
                // made internal order unique in db
                updateOnDuplicate: ["Gl_code", "Gl_Name", "Gl_Description"]
            }).then(result => {
                // console.log(result)
                res.status(200).send(apiResponse.successFormat(`success`, `GL code saved successfully`, {}, []))
            })
            .catch((error) => {
                console.log(error);
                res.status(400).send(apiResponse.errorFormat(`fail`, `No data found`, {}, []))
            })
    } catch (error) {
        console.log(`something went wrong ${JSON.stringify(error)}`)
        let errorResponse = {}
        let code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500

        if (Object.prototype.hasOwnProperty.call(error, 'status')) {
            errorResponse = error
            errorResponse = _.omit(errorResponse, ['code'])
        } else {
            errorResponse = {
                status: 'fail',
                message: 'Something went wrong',
                data: {},
                error: [{
                    code: 'err_001',
                    message: errorCode.err_001
                }]
            }
        }
        res.status(code).send(errorResponse)
    }
}

module.exports.saveGLCode = saveGLCode