const CommonFuncs = require('../commonFunctions');
class BaInvoice {
    async getInvFileData(billDetailsId) {
        try {
            let fileDetails = await db.billFileDetails.findAll({
                row: true,
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
}

const getInvoiceDetails = async (req, res) => {
    try {

        var reqQuery = req.query;

        db.billDetails.belongsTo(db.serviceCategory, {
            foreignKey: 'Service_Code',
            targetKey: 'Service_ID'
        });

        let invoices = await db.billDetails.findAll({
            row: true,
            include: [{
                model: db.ba,
                required: true,
                attributes: ['ba_code', 'ba_group_id']
            }, {
                model: db.memoDetails,
                required: true,
                attributes: ['Submittion_Location_Code', 'Memo_Number']
            }, {
                model: db.serviceCategory,
                required: true,
                attributes: ['Service_Name', 'Service_code']
            }],
            where: {
                BA_Code: reqQuery.baCode,
                BillDetails_ID: reqQuery.billDetailsID
            }
        });
        var commonFuncs = new CommonFuncs();
        var objBaInvoice = new BaInvoice();
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
                    locationCode: invoices[i].memoDetail.dataValues.Submittion_Location_Code,
                    serviceName: invoices[i].service_category.dataValues.Service_Name,
                    memoNumber: invoices[i].memoDetail.dataValues.Memo_Number,
                    invSource: invoices[i].Inv_Source,
                    billingFromName: (await commonFuncs.getStateName(invoices[i].dataValues.Billing_From_code)).State_Name,
                    billingToName: (await commonFuncs.getStateName(invoices[i].dataValues.Billing_To_code)).State_Name,
                    files: await objBaInvoice.getInvFileData(invoices[i].BillDetails_ID)
                }
                results.push(obj)
            }
        }
        res.status(200).send(apiResponse.successFormat(`success`, `Invoice details fectched successfully`, results, []))

    } catch (error) {
        console.log(`Error in getInvoiceDetails `, error)
        console.log(`error $ {JSON.stringify(error)}`)
        const code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
        const response = errorResponse(error)
        res.status(code).send(response)
    }
}

module.exports = {
    getInvoiceDetails
}