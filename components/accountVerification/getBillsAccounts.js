const getAllAccBills = async (roleId, userId, postingFDate, postingEDate, vertical, location, krDocNum, isNonTaxable, billIds, commercialId, orderByField, order, itemsPerPage, pageNo, isAllowPagination, allowAllInvoice) => {
    //const getAllAccBills = async (roleId, userId, postingFDate, postingEDate, vertical, location, krDocNum, isNonTaxable, billIds, commercialId, itemsPerPage, pageNo, isAllowPagination, allowAllInvoice) => {
    return new Promise(async (resolve, reject) => {
        try {
            var itemsPerPg = (itemsPerPage == undefined || itemsPerPage == '' || itemsPerPage == null) ? 10 : itemsPerPage;
            var pgNo = (pageNo == undefined || pageNo == '' || pageNo == null || pageNo == 0) ? 1 : pageNo;

            let _offset = itemsPerPg * (pgNo - 1)

            let dbRes = await db.sequelize.query(`CALL SP_GetAccountsBills(:roleId,:userId,:postingFDate,:postingEDate,:vertical,:location,:krDocNum,:isNonTaxable,:billIds,:commercialId,:orderByField,:order,:itemsPerPage,:pageNo,:isAllowPagination,:isAllowAllInvoice)`, {
                //let dbRes = await db.sequelize.query(`CALL SP_GetAccountsBills(:roleId,:userId,:postingFDate,:postingEDate,:vertical,:location,:krDocNum,:isNonTaxable,:billIds,:commercialId,:itemsPerPage,:pageNo,:isAllowPagination,:isAllowAllInvoice)`, {
                replacements: {
                    roleId: roleId,
                    userId: userId,
                    postingFDate: postingFDate,
                    postingEDate: postingEDate,
                    vertical: vertical,
                    location: location,
                    krDocNum: krDocNum,
                    isNonTaxable: isNonTaxable,
                    billIds: billIds,
                    commercialId: commercialId,
                    orderByField,
                    order,
                    itemsPerPage: itemsPerPg,
                    pageNo: _offset,
                    isAllowPagination: isAllowPagination,
                    isAllowAllInvoice: allowAllInvoice
                },
                type: db.Sequelize.QueryTypes.SELECT
            });
            const accDataResult = []

            _.forOwn(dbRes[1], (e, key) => {
                accDataResult.push({
                    ...e
                })
            })
            console.log('dbRes[0]-', dbRes[0], '---accDataResult ', accDataResult)
            const result = {}
            result.totalRows = dbRes[0]['0'].totalRows;
            result.billDetails = accDataResult;

            resolve(result)

        } catch (error) {
            reject(error)
        }
    })
}

class AccountBills {

    async getAccountBillDetails(billID) {
        let result = [];
        try {
            let resData = await db.sequelize.query(`CALL SP_GetAccBillDetails(:billDetailsId)`, {
                replacements: {
                    billDetailsId: billID
                },
                type: db.Sequelize.QueryTypes.SELECT
            });

            result.billDetailsId = billID;
            if (!_.isEmpty(resData[0])) {
                result.files = _.toArray(resData[0]);
                result.internalOrderMapping = _.toArray(resData[1])
            }
        } catch (error) {
            console.log('error in middle', error)
            throw error
        }
        return result;
    }
}
let objAccountBills = new AccountBills();
const getBillsAccounts = async (req, res) => {
    let reqQuery = req.query;
    try {
        console.log('reqQuery', reqQuery)
        let result = {}

        result = await getAllAccBills(reqQuery.roleId, reqQuery.userId, reqQuery.postingFromDate, reqQuery.postingEndDate, reqQuery.vertical, reqQuery.location, reqQuery.krDocNum, reqQuery.isNonTaxable, reqQuery.billIDs, reqQuery.commercialId, reqQuery.orderByField, reqQuery.order, reqQuery.itemsPerPage, reqQuery.pageNo, reqQuery.isAllowPagination, reqQuery.allowAllInvoice)
        //result = await getAllAccBills(reqQuery.roleId, reqQuery.userId, reqQuery.postingFromDate, reqQuery.postingEndDate, reqQuery.vertical, reqQuery.location, reqQuery.krDocNum, reqQuery.isNonTaxable, reqQuery.billIDs, reqQuery.commercialId, reqQuery.itemsPerPage, reqQuery.pageNo, reqQuery.isAllowPagination, reqQuery.allowAllInvoice)
        if (result == null || result == undefined)
            res.status(200).send(apiResponse.successFormat(`fail`, `No data found`, [], []));
        else {
            if (result.totalRows <= 0)
                res.status(200).send(apiResponse.successFormat(`fail`, `No data found.`, [], []));
            else {

                for (let i = 0; i < result.billDetails.length; i++) {
                    let data = await objAccountBills.getAccountBillDetails(result.billDetails[i].invoiceID);
                    result.billDetails[i].files = data.files;
                    //  accDataResult[i].billInternalOrderMapping = data.internalOrderMapping;
                }
                console.log('result.accDataResult--->', result.billDetails)
                res.status(200).send(apiResponse.successFormat(`success`, `Bill details fetched successfully`, result, []))
            }
        }
    } catch (error) {
        console.log('Error getBillsAccounts ', error);
        const errorObj = {
            code: `err_001`,
            message: errorCode.err_001
        }
        res.status(400).send(apiResponse.errorFormat(`fail`, `Failed to fetching account data`, errorObj, []));
    }
}
module.exports = {
    getBillsAccounts,
    getAllAccBills
};