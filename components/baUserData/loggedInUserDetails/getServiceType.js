const getAllServiceType = async () => {
    return new Promise(async (resolve, reject) => {
        try {
            let url = `http://${process.env.BA_PORTAL_URL}/api/v1/masterdata/master/base-trans-type`
            request.get({
                headers: {
                    'content-type': `application/json`
                },
                url: url
            }, (err, res, body) => {
                if (err) {
                    // console.log(err)
                    return err
                }
                let result = JSON.parse(res.body)
                if (result && result.data) {
                    _.remove(result.data, (d) => {
                        return d.status == 0;
                    })
                }
                console.log('test response', result.data)
                resolve(result.data)
            })
        } catch (error) {
            console.log('error', error)
            console.log(`something went wrong ${JSON.stringify(error)}`)
            let code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
            let response = errorResponse(error)
            res.status(code).send(response)
        }
    })
}
module.exports.getAllServiceType = getAllServiceType