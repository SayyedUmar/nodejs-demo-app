const CommonFuncs = require('../commonFunctions');
class DraftFileDetails {
    async getDraftFileData(draftBillDetailsId) {
        try {

            let fileDetails = await db.draftfildetails.findAll({
                where: {
                    Draft_Bill_Details_ID: draftBillDetailsId
                },
                attributes: {
                    exclude: ['Created_On', 'Created_By']
                }
            })

            const results = []
            if (fileDetails) {
                _.forEach(fileDetails, e => {
                    let obj = {
                        draftBillFileId: e.dataValues.Draft_Bill_File_Id,
                        draftBillDetailsId: e.dataValues.Draft_Bill_Details_ID,
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
            return null;
            // throw error;
        }
    }
}
let objgetDraftFileData = new DraftFileDetails()
const getDraftMemoReview = async (req, res) => { //---Draft final review screen
    try {

        const ba_group_cd = req.query.ba_group_id;
        const billing_from_state = req.query.billing_from_state;
        const billing_to_state = req.query.billing_to_state;

        db.draftBills.belongsTo(db.serviceCategory, {
            foreignKey: 'Service_Code',
            targetKey: 'Service_ID'
        })

        let draftBillsDetails = await db.draftBills.findAll({
            include: [{
                    model: db.ba,
                    required: true,
                    attributes: ['ba_code', 'ba_group_id', 'ba_name'],
                    where: {
                        ba_group_id: ba_group_cd
                    }
                },
                {
                    model: db.serviceCategory,
                    required: true,
                    attributes: ['Service_Name', 'Service_ID', 'Parent_Service_Name']
                }
            ],
            where: {
                Billing_To_code: billing_to_state,
                Billing_From_code: billing_from_state
            }
        });
        var commonFuncs = new CommonFuncs();

        const results = []
        if (draftBillsDetails) {
            if (draftBillsDetails.length <= 0) {
                res.status(200).send(apiResponse.successFormat(`success`, `No Data Found`, results, []))
                return;
            } else {
                for (var i = 0; i < draftBillsDetails.length; i++) {

                    let obj = {
                        draftBillDetailsID: draftBillsDetails[i].Draft_Bill_ID,
                        baCode: draftBillsDetails[i].BA_Code,
                        baName: draftBillsDetails[i].ba_detail.dataValues.ba_name,
                        billNo: draftBillsDetails[i].BillNo,
                        billDate: draftBillsDetails[i].BillDate,
                        customerName: draftBillsDetails[i].Customer_Name,
                        billingFromCode: draftBillsDetails[i].Billing_From_code,
                        billingToCode: draftBillsDetails[i].Billing_To_code,
                        memoNumber: draftBillsDetails[i].MemoID,
                        baseAmount: draftBillsDetails[i].TaxableAmount,
                        hsnCode: draftBillsDetails[i].HSN_Code,
                        cgst: draftBillsDetails[i].CGST,
                        sgst: draftBillsDetails[i].SGST,
                        igst: draftBillsDetails[i].IGST,
                        invoiceAmount: draftBillsDetails[i].Amount,
                        otherCharges: draftBillsDetails[i].OtherCharges,
                        advanceTDS: draftBillsDetails[i].Advance_TDS,
                        additionalAmount: draftBillsDetails[i].Additional_Amount,
                        tradeDiscount: draftBillsDetails[i].Trade_Discount,
                        invSource: draftBillsDetails[i].Inv_Source,
                        baGroupId: draftBillsDetails[i].ba_detail.dataValues.ba_group_id,
                        serviceCode: draftBillsDetails[i].service_category.Service_ID,
                        serviceName: draftBillsDetails[i].service_category.Service_Name,
                        parentServiceName: draftBillsDetails[i].service_category.Parent_Service_Name,
                        status: await commonFuncs.getInvoiceStatus(draftBillsDetails[i].status),
                        billingFromName: (await commonFuncs.getStateName(draftBillsDetails[i].dataValues.Billing_From_code)).State_Name,
                        billingToName: (await commonFuncs.getStateName(draftBillsDetails[i].dataValues.Billing_To_code)).State_Name,
                        files: await objgetDraftFileData.getDraftFileData(draftBillsDetails[i].Draft_Bill_ID)

                    }
                    results.push(obj)
                }
                res.status(200).send(apiResponse.successFormat(`success`, `Draft final review data fectched successfully`, results, []))
            }
        } else {
            res.status(200).send(apiResponse.successFormat(`success`, `No Data Found`, results, []))
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

module.exports.getDraftMemoReview = getDraftMemoReview