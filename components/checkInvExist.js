const CommonFuncs = require('./commonFunctions');

const checkInvoiceExist = async (req, res) => {
    try {
        console.log(req.query)
        const invNum = req.query.invoiceNum;
        const baGroupId = req.query.baGroupID;

        if (/^[a-zA-Z0-9-/]*$/.test(invNum) == false) {
            res.status(200).send(response.successFormat(`success`, `Invalid Invoice number`, invNum, []))
            return;
        }

        var commonFuncs = new CommonFuncs();
        var fiscalYears = await commonFuncs.getFiscalYear();

        let IsInvExist = await db.sequelize.query(`CALL SP_ChckIsInvoiceNumExists(:Inv_number,:Ba_group_Id,:StartDate,:EndDate)`, {
            replacements: {
                Inv_number: invNum,
                Ba_group_Id: baGroupId,
                StartDate: fiscalYears.startDate,
                EndDate: fiscalYears.endDate
            }
        });

        var arr = IsInvExist;
        var results = [{
            invNumber: invNum,
            isExist: arr[0].IsInvExists == '1' ? true : false,
            startDate: fiscalYears.startDate,
            endDate: fiscalYears.endDate
        }]
        res.status(200).send(apiResponse.successFormat(`success`, `Data cheked`, results, []))

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
module.exports.checkInvoiceExist = checkInvoiceExist