const getAllGLCode = async (req, res) => {
    try {
        // let url = `http://${process.env.BA_PORTAL_URL}/api/v1/masterdata/master/gl-account`
        // request.get({
        //     headers: {
        //         'content-type': `application/json`
        //     },
        //     url: url
        // }, (err, response, body) => {
        //     if (err) {
        //         // console.log(`err ${err}`)
        //         const errorObj = {
        //             code: `err_001`,
        //             message: errorCode.err_001
        //         }
        //         let resp = errorResponse(apiResponse.errorFormat(`fail`, `Something went wrong`, {}, [errorObj], 400))
        //         res.status(400).send(resp)
        //     } else {
        //         let result = JSON.parse(response.body)
        //         if (result) {
        //             res.status(200).send(apiResponse.successFormat(`success`, `List of GL`, result.data, []))
        //         } else {
        //             const errorObj = {
        //                 code: `err_001`,
        //                 message: errorCode.err_001
        //             }
        //             let resp = errorResponse(apiResponse.errorFormat(`fail`, `Something went wrong`, {}, [errorObj], 400))
        //             res.status(400).send(resp)
        //         }
        //     }
        // })
        let glList = await db.glCode.findAll({
            where: {
                IsActive: 1
            },
            attributes: {
                exclude: ['UpdatedBy', 'UpdatedOn']
            }
        })
        const results = []
        if (glList) {
            _.forEach(glList, gl => {
                let obj = {
                    "glAccountId": gl.Gl_ID,
                    "glAccount": gl.Gl_code,
                    "description": gl.Gl_Description,
                    "status": gl.IsActive
                }
                results.push(obj)
            })
        }
        res.status(200).send(apiResponse.successFormat(`success`, `List of GL`, results, []))
    } catch (error) {
        console.log('error', error)
        console.log(`something went wrong ${JSON.stringify(error)}`)
        let code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
        let response = errorResponse(error)
        res.status(code).send(response)
    }
}
module.exports.getAllGLCode = getAllGLCode