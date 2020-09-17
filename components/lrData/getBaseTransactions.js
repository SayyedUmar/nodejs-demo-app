class BaseTransData {
    async getAllBaseTransactions(lrNumbers, baCode) {
        try {
            console.log('lrNumbers', lrNumbers, '--baCode', baCode)

            let baDetails = await db.ba.findOne({
                where: {
                    ba_id: baCode
                },
                attributes: ['ba_code']
            })
            let baGSTCode = baDetails.ba_code
            console.log('baGSTCode', baDetails.ba_code)

            let url = `http://${process.env.BA_PORTAL_URL}/api/v1/sap/getBaseTransactionByLRs?lrNumbers=${lrNumbers}&baCode=${baGSTCode}`
            //let url = `http://localhost:8081/api/v1/sap/getBaseTransactionByLRs?lrNumbers=${lrNumbers}&baCode=${baGSTCode}`

            return new Promise((resolve, reject) => {
                return request.get({
                    headers: {
                        'content-type': `application/json`,
                    },
                    url: url,
                    json: true
                }, (err, response, body) => {
                    if (err) {
                        reject(err);
                    } else {
                        if (response.statusCode == 200) {
                            var resBody = response.body;
                            resolve(resBody);
                        }
                    }
                });
            });
        } catch (error) {
            throw error;
        }
    }
}

const getBaseTransactions = async (req, res) => {
    try {

        //search by lr number 
        let reqQuery = req.query

        var itemsPerPg = (reqQuery.nPerPage == undefined || reqQuery.nPerPage == '' || reqQuery.nPerPage == null) ? 10 : reqQuery.nPerPage;
        var pgNo = (reqQuery.pageNo == undefined || reqQuery.pageNo == '' || reqQuery.pageNo == null) ? 1 : reqQuery.pageNo;

        let baDetails = await db.ba.findOne({
            raw: true,
            where: {
                ba_id: reqQuery.baCode
            },
            attributes: ['ba_code']
        })
        if (baDetails) {
            if (baDetails.length <= 0) {
                let resp = errorResponse(apiResponse.errorFormat(`fail`, `BA not found`, {}, [], 200))
                res.status(200).send(resp)
                return;
            } else {

                if (reqQuery.lrNumbers != '' || reqQuery.lrNumbers != null) {
                    var totalLrs = (reqQuery.lrNumbers.split(",").length)
                    let lRCountPerSearch = Config.LRCountPerSearch;

                    console.log('No. of Lrs to Search= ', totalLrs)
                    if (totalLrs > lRCountPerSearch) {
                        let resp = errorResponse(apiResponse.errorFormat(`fail`, `too many Lrs to search`, {}, [], 200))
                        res.status(200).send(resp)
                        return;
                    }
                }
                let baGSTCode = baDetails.ba_code
                console.log('baGSTCode', baDetails.ba_code)
                let url = `http://${process.env.BA_PORTAL_URL}/api/v1/sap/getBaseTransaction?lrNumbers=${reqQuery.lrNumbers}&serviceType=${reqQuery.serviceType}&baCode=${baGSTCode}&fromDate=${reqQuery.fromDate}&toDate=${reqQuery.toDate}&lrIds=${reqQuery.lrIds}&nPerPage=${itemsPerPg}&pageNo=${pgNo}&flag=${reqQuery.flag}`
                //let url = `http://localhost:8081/api/v1/sap/getBaseTransaction?lrNumbers=${reqQuery.lrNumbers}&serviceType=${reqQuery.serviceType}&baCode=${baGSTCode}&fromDate=${reqQuery.fromDate}&toDate=${reqQuery.toDate}&lrIds=${reqQuery.lrIds}&nPerPage=${itemsPerPg}&pageNo=${pgNo}&flag=${reqQuery.flag}`

                request.get({
                    headers: {
                        'content-type': `application/json`,
                    },
                    url: url,
                    json: true
                }, (err, response, body) => {
                    if (err) {
                        console.log(`err--------->`, err)
                        const errorObj = {
                            code: `err_001`,
                            message: errorCode.err_001
                        }
                        let resp = errorResponse(apiResponse.errorFormat(`fail`, `Something went wrong`, {}, [errorObj], 400))
                        res.status(400).send(resp)
                    } else {
                        if (response.statusCode == 200) {

                            if (response.body && response.body.totalRows <= 0) {
                                res.status(200).send(apiResponse.successFormat(`success`, `No Data Found`, [], []))
                                return;
                            }
                            let resData = {
                                baCode: reqQuery.baCode,
                                totalCnt: response.body.totalRows,
                                lrList: response.body.lrs
                            }
                            res.status(200).send(apiResponse.successFormat(`success`, `Base Transactions data fetched successfully`, resData, []))
                        } else {
                            const errorObj = {
                                code: `err_001`,
                                message: errorCode.err_001
                            }
                            let resp = errorResponse(apiResponse.errorFormat(`fail`, `Something went wrong`, {}, [errorObj], 400))
                            res.status(400).send(resp)
                        }
                    }
                })
            }
        } else {
            let resp = errorResponse(apiResponse.errorFormat(`fail`, `Invalid user`, {}, [], 200))
            res.status(200).send(resp)
            return;
        }
    } catch (error) {
        console.log('error', error)
        console.log(`something went wrong ${JSON.stringify(error)}`)
        let code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
        let response = errorResponse(error)
        res.status(code).send(response)
    }
}
module.exports = {
    BaseTransData,
    getBaseTransactions
}