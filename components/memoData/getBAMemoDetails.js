const CommonFuncs = require('../commonFunctions');

class MemoDetails {
    async checkIsValidMemo(memoNumber, userId) {

        var isValidMemoNum = false;
        let users = await db.users.findOne({
            where: {
                user_id: reqQuery.userId
            },
            attributes: ['user_id', 'token_id', 'role_id']
        })

        if (users != null) {
            if (users.dataValues.role_id == 1) { //1 is to check if user is BA or not
                console.log('users.role_id', users.dataValues.role_id)

                let memodetails = await db.memoDetails.findAll({
                    include: [{
                        model: db.ba,
                        required: true,
                        where: {
                            ba_group_id: users.dataValues.token_id
                        },
                        attributes: []
                    }],
                    where: {
                        Memo_Number: reqQuery.memoNumber
                    }
                })
                if (memodetails != null && memodetails.length > 0)
                    isValidMemoNum = true;

            } else {

                let memodetails = await db.memoDetails.findAll({
                    where: {
                        Memo_Number: reqQuery.memoNumber
                    }
                })
                if (memodetails != null && memodetails.length > 0)
                    isValidMemoNum = true;
            }
        }
        return isValidMemoNum;
    }
    async getTotalFileCnt(billDetailsId) {

        let fileCnt = await db.billFileDetails.count({
            where: {
                Bill_Details_ID: billDetailsId
            }
        })
        return fileCnt;
    }
    async getTotalLRCnt(billDetailsId) {

        let lrCnt = await db.billBaseTransMapping.count({
            where: {
                Bill_Details_ID: billDetailsId
            }
        })
        return lrCnt;
    }


    async getInvFileData(billDetailsId) {
        try {
            let fileDetails = await db.billFileDetails.findAll({
                where: {
                    Bill_Details_ID: billDetailsId
                },
                attributes: {
                    exclude: ['Created_On', 'Created_By']
                }
            })

            const results = []
            if (fileDetails) {
                _.forEach(fileDetails, e => {
                    let obj = {
                        billFileId: e.dataValues.Bill_File_Id,
                        billDetailsId: e.dataValues.Bill_Details_ID,
                        filePath: e.dataValues.FilePath,
                        fileName: e.dataValues.File_Name,
                        fileType: e.dataValues.File_Type
                    }
                    results.push(obj)
                })
            }
            return results;
        } catch (error) {
            console.log(error)
            //  return null;
            throw error;
        }
    }

    async getInvLRDetails(baCode, billDetailsId) {
        try {
            db.billBaseTransMapping.belongsTo(db.billDetails, {
                foreignKey: 'Bill_details_id',
                targetKey: 'BillDetails_ID'
            });
            let lrDetails = await db.billBaseTransMapping.findAll({
                include: [{
                    model: db.billDetails,
                    required: true,
                    where: {
                        BA_Code: baCode
                    },
                    attributes: []
                }],
                where: {
                    Bill_details_id: billDetailsId
                },
                attributes: {
                    exclude: ['Created_By', 'Created_On']
                }
            })

            const results = []
            if (lrDetails) {
                if (lrDetails.length > 0) {


                    _.forEach(lrDetails, e => {
                        let obj = {
                            id: e.dataValues.ID,
                            billDetailsId: e.dataValues.Bill_details_id,
                            postingDate: e.dataValues.Posting_Date,
                            docDate: e.dataValues.Doc_Date,
                            provisionDocumentNumber: e.dataValues.Provision_Document_Number,
                            fiscalYear: e.dataValues.Fiscal_year,
                            provisionDocumentItem: e.dataValues.Provision_Document_Item,
                            internalOrder: e.dataValues.Internal_order,
                            baseTransactionType: e.dataValues.Base_Transaction_Type,
                            baseTransactionDate: e.dataValues.Base_Transaction_Date,
                            baseTransactionNumber: e.dataValues.Base_Transaction_Number,
                            customerCode: e.dataValues.Customer_Code,
                            amountProvisional: e.dataValues.Amount_Provisional,
                            amount: e.dataValues.Amount
                        }
                        results.push(obj)
                    })
                }
                return results;
            }
            return results;
        } catch (error) {
            throw error;
        }
    }

    async getBillInternalOrderMapping(billDetailsId) {
        try {

            db.billInternalOrderMapping.belongsTo(db.internalOrderData, {
                foreignKey: 'Internal_order_id',
                targetKey: 'Internal_order_id'
            });
            let internalOrderMapping = await db.billInternalOrderMapping.findAll({
                include: [{
                    model: db.internalOrderData,
                    required: true,
                    attributes: ['Internal_order_Number']
                }],
                where: {
                    BillDetails_Id: billDetailsId
                },
                attributes: [
                    'BillDetails_Id', ['W/H_ID', 'wHID'], 'Internal_order_id', 'Amount', 'Header_Text', 'RefKey1', 'RefKey2', 'RefKey3', 'TD', 'VD'
                ]
            })

            const results = []

            if (internalOrderMapping) {

                for (var i = 0; i < internalOrderMapping.length; i++) {

                    let obj = {

                        billDetailsId: internalOrderMapping[i].dataValues.BillDetails_Id,
                        internalOrderId: internalOrderMapping[i].dataValues.Internal_order_id,
                        amount: internalOrderMapping[i].dataValues.Amount,
                        headerText: internalOrderMapping[i].dataValues.Header_Text,
                        refKey1: internalOrderMapping[i].dataValues.RefKey1,
                        refKey2: internalOrderMapping[i].dataValues.RefKey2,
                        refKey3: internalOrderMapping[i].dataValues.RefKey3,
                        td: internalOrderMapping[i].dataValues.TD,
                        vd: internalOrderMapping[i].dataValues.VD,
                        Internal_order_Number: internalOrderMapping[i].dataValues.internal_order.dataValues.Internal_order_Number,
                        whTax: await this.getWHTax((internalOrderMapping[i].dataValues.wHID == null) ? 0 : internalOrderMapping[i].dataValues.wHID),
                        taxCode: 'pending to develope as sAP taxCode need to be used'
                    }
                    results.push(obj)
                }
            }
            return results;
        } catch (error) {
            console.log(error)
            //  return null;
            throw error;
        }
    }

    async getWHTax(whTaxId) {
        try {
            let whTax = await db.withholding_tax.findAll({
                where: {
                    'w/h_id': whTaxId
                },
                attributes: [
                    'tax_rate', ['w/h_id', 'wHID'],
                    ['w/h_tax_type', 'wHTaxType'],
                    ['w/h_tax_code', 'wHTaxCode']
                ]
            });
            const results = []
            if (whTax) {
                _.forEach(whTax, e => {
                    let obj = {
                        wHID: e.dataValues.wHID,
                        wHTaxType: e.dataValues.wHTaxType,
                        wHTaxCode: e.dataValues.wHTaxCode,
                        taxRate: e.dataValues.tax_rate,
                        wHTaxName: e.dataValues.wHTaxType + "-" + e.dataValues.wHTaxCode + "-" + e.dataValues.tax_rate + "%"
                    }
                    results.push(obj)
                })
            }
            return results;
        } catch (error) {
            console.log(error)
            //  return null;
            throw error;
        }
    }

    async getInvList(memoId) {
        try {
            var commonFuncs = new CommonFuncs();

            db.billDetails.belongsTo(db.serviceCategory, {
                foreignKey: 'Service_Code',
                targetKey: 'Service_ID'
            });

            let invoices = await db.billDetails.findAll({
                include: [{
                    model: db.ba,
                    required: true,
                    attributes: ['ba_code', 'ba_group_id']
                }, {
                    model: db.memoDetails,
                    required: true,
                    attributes: ['Submittion_Location_Code', 'Memo_Number'],
                    include: [{
                        model: db.location,
                        required: true,
                        attributes: ['Location_Name']
                    }]
                }, {
                    model: db.serviceCategory,
                    required: true,
                    attributes: ['Service_Name', 'Service_code']
                }],
                where: {
                    MemoID: memoId
                }
            });

            const results = []
            if (invoices) {
                for (var i = 0; i < invoices.length; i++) {

                    let obj = {
                        billDetailsID: invoices[i].BillDetails_ID,
                        baCode: invoices[i].BA_Code,
                        billNo: invoices[i].BillNo,
                        billDate: invoices[i].BillDate,
                        customerName: invoices[i].Customer_Name,
                        billingFromCode: invoices[i].Billing_From_code,
                        billingToCode: invoices[i].Billing_To_code,
                        baseAmount: invoices[i].TaxableAmount,
                        hsnCode: invoices[i].HSN_Code,
                        cgst: invoices[i].CGST,
                        sgst: invoices[i].SGST,
                        igst: invoices[i].IGST,
                        comments: invoices[i].Comments,
                        invoiceAmount: invoices[i].Amount,
                        otherCharges: invoices[i].OtherCharges,
                        status: invoices[i].status,
                        memoId: invoices[i].MemoID,
                        reason: invoices[i].Reason,
                        acknowledgedBy: invoices[i].AcknowledgedBy,
                        acknowledgedOn: invoices[i].AcknowledgedOn,
                        advancePayment: invoices[i].Advance_Payment,
                        advanceDocument: invoices[i].Advance_Document,
                        advanceTDS: invoices[i].Advance_TDS,
                        additionalAmount: invoices[i].Additional_Amount,
                        tradeDiscount: invoices[i].Trade_Discount,
                        baGroupId: invoices[i].ba_detail.dataValues.ba_group_id,
                        serviceCode: invoices[i].Service_Code,
                        invSource: invoices[i].Inv_Source,
                        locationCode: invoices[i].memoDetail.dataValues.Submittion_Location_Code,
                        locationName: invoices[i].memoDetail.dataValues.location.dataValues.Location_Name,
                        serviceName: invoices[i].service_category.dataValues.Service_Name,
                        memoNumber: invoices[i].memoDetail.dataValues.Memo_Number,
                        refKey2ServiceCode: invoices[i].service_category.dataValues.Service_code.substr(1),
                        fileName: (invoices[i].File_Path == '' || invoices[i].File_Path == null) ? '' : (invoices[i].File_Path.substr(invoices[i].dataValues.File_Path.lastIndexOf("\\") + 1)),
                        filePath: (invoices[i].dataValues.File_Path == null) ? "" : invoices[i].dataValues.File_Path,
                        billingFromName: (await commonFuncs.getStateName(invoices[i].dataValues.Billing_From_code)).State_Name,
                        billingToName: (await commonFuncs.getStateName(invoices[i].dataValues.Billing_To_code)).State_Name,
                        totalFileCount: await this.getTotalFileCnt(invoices[i].dataValues.BillDetails_ID),
                        totalLRCount: await this.getTotalLRCnt(invoices[i].dataValues.BillDetails_ID)
                        //files: await this.getInvFileData(invoices[i].dataValues.BillDetails_ID),
                        //baseTransMapping: await this.getInvLRDetails(invoices[i].dataValues.BA_Code, invoices[i].dataValues.BillDetails_ID),
                        //internalOrderMapping: await this.getBillInternalOrderMapping(invoices[i].dataValues.BillDetails_ID)
                    }
                    results.push(obj)
                }
            }
            return results;
        } catch (error) {
            console.log(error);
            throw error;
            //return null;
        }
    }

}
//-----------To print preview data---------------//
const getBAMemoDetails = async (req, res) => {
    try {
        reqQuery = req.query;

        var objMemoDetails = new MemoDetails()

        var isValidMemo = await objMemoDetails.checkIsValidMemo(reqQuery.memoNumber, reqQuery.userId)

        if (isValidMemo == true) {

            let memoData = await db.memoDetails.findOne({
                include: [{
                        model: db.ba,
                        required: true,
                        attributes: ['BA_NAME', 'BA_CODE', 'TradeDiscount']
                    },
                    {
                        model: db.users,
                        required: true,
                        attributes: ['First_Name', 'Last_Name']
                    },
                    {
                        model: db.location,
                        required: true,
                        attributes: ['Location_Name']
                    }
                ],
                where: {
                    Memo_Number: reqQuery.memoNumber
                }
            })

            let results;
            if (memoData) {

                results = {
                    memoId: memoData.Memo_ID,
                    memoNumber: memoData.Memo_Number,
                    memoDate: memoData.Memo_Date,
                    baCode: memoData.BA_Code,
                    createdOn: memoData.CreatedOn,
                    fiscalYear: memoData.FiscalYear,
                    submitTo: memoData.Submit_To_ID,
                    baName: memoData.ba_detail.dataValues.BA_NAME,
                    baGSTCode: memoData.ba_detail.dataValues.BA_CODE,
                    baFullCode: memoData.ba_detail.dataValues.BA_CODE,
                    tradeDiscount: memoData.ba_detail.dataValues.TradeDiscount,
                    subLocationName: memoData.location.dataValues.Location_Name,
                    submitToName: memoData.user.dataValues.First_Name + " " + memoData.user.dataValues.Last_Name,
                    invoiceDetails: await objMemoDetails.getInvList(memoData.Memo_ID)
                }

            }
            res.status(200).send(apiResponse.successFormat(`success`, `Memo details fectched successfully`, results, []))
        } else {
            res.status(400).send(apiResponse.errorFormat(`fail`, `No data found`, {}, []))
        }
    } catch (error) {
        console.log(error)

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

module.exports.getBAMemoDetails = getBAMemoDetails