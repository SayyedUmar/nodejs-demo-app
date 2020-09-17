class DraftMemoDetails {

    async getDraftMemoLst(ba_group_cd, memo_id, billing_from_state, billing_to_state) {
        try {
            const draftMemoList = await db.sequelize.query(`CALL SP_GetDraftMemoData(:bagroupid,:memoid,:fromstate,:tostate)`, {
                replacements: {
                    bagroupid: ba_group_cd,
                    memoid: memo_id,
                    fromstate: billing_from_state,
                    tostate: billing_to_state
                }
            });
            return draftMemoList;
        } catch (error) {
            return null;
            // throw error;
        }
    }
    async getDraftInvList(ba_group_cd, memo_id, billing_from_state, billing_to_state) {
        try {

            let draftInvs = await db.sequelize.query(`CALL SP_GetDraftInvList(:bagroupid,:memoid,:fromstate,:tostate)`, {
                replacements: {
                    bagroupid: ba_group_cd,
                    memoid: memo_id,
                    fromstate: billing_from_state,
                    tostate: billing_to_state
                }
            });
            const results = []
            if (draftInvs) {

                for (var i = 0; i < draftInvs.length; i++) {
                    let obj = {
                        memoNumber: draftInvs[i].MemoID,
                        invoiceNumber: draftInvs[i].BillNo,
                        billingFromCode: draftInvs[i].Billing_From_code,
                        billingToCode: draftInvs[i].Billing_To_code,
                        comments: draftInvs[i].Comments,
                        hsnCode: draftInvs[i].HSN_Code,
                        serviceCode: draftInvs[i].Service_code,
                        parentServiceCatName: draftInvs[i].Parent_Service_Name,
                        serviceName: draftInvs[i].Service_Name,
                        invoiceAmount: draftInvs[i].Amount,
                        baseAmount: draftInvs[i].TaxableAmount,
                        additionalAmount: draftInvs[i].Additional_Amount,
                        tradeDiscount: draftInvs[i].Trade_Discount,
                        cgst: draftInvs[i].CGST,
                        sgst: draftInvs[i].SGST,
                        igst: draftInvs[i].IGST,
                        invoiceDate: draftInvs[i].BillDate,
                        baCode: draftInvs[i].BA_Code,
                        filePath: draftInvs[i].File_Path,
                        invoiceID: draftInvs[i].Draft_Bill_ID,
                        customerName: draftInvs[i].Customer_Name,
                        billingFromName: draftInvs[i].Billing_From_state,
                        billingToName: draftInvs[i].Billing_To_state,
                        invSource: draftInvs[i].inv_source,
                        files: await this.getDraftFileData(draftInvs[i].Draft_Bill_ID)
                    }
                    results.push(obj)
                }
            }
            return results;
        } catch (error) {
            console.log(error);
            return null;
            // throw error;
        }
    }
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
                        fileType: e.dataValues.File_Type,
                        extension: e.dataValues.FilePath.substr((e.dataValues.FilePath.lastIndexOf('.') + 1), e.dataValues.FilePath.toString().length)
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
    async getStateName(stateCode) {
        try {
            let state = await db.state.findOne({
                where: {
                    State_ID: stateCode
                },
                attributes: ['State_Name']
            })
            return state;
        } catch (error) {
            console.log(error)
            return null;
            //throw error;
        }
    }
}

const checkDraftExists = async (req, res) => {
    const ba_group_cd = req.query.ba_group_id;
    const billing_from_state = req.query.billing_from_state;
    const billing_to_state = req.query.billing_to_state;

    try {
        let objDraftMemo = new DraftMemoDetails();

        let results = {};
        const draftMemoLst = await objDraftMemo.getDraftMemoLst(ba_group_cd, '', billing_from_state, billing_to_state)

        if (draftMemoLst) {

            if (draftMemoLst.length > 0) {
                results = {
                    baGroupCd: ba_group_cd,
                    billingFromState: billing_from_state,
                    billingToState: billing_to_state,
                    isExists: true
                }
            } else {
                results = {
                    baGroupCd: ba_group_cd,
                    billingFromState: billing_from_state,
                    billingToState: billing_to_state,
                    isExists: false
                }
            }
        }
        res.status(200).send(apiResponse.successFormat(`success`, `Data checked in Draft`, results, []))
    } catch (error) {
        console.log('Error in checkIsDraftExists ', error);
        const errorObj = {
            code: `err_001`,
            message: errorCode.err_001
        }
        res.status(400).send(apiResponse.errorFormat(`fail`, `Failed to check Draft`, errorObj, []));
    }
}

const getDraftMemoDetails = async (req, res) => {
    const ba_group_cd = req.query.ba_group_id;
    const memo_id = req.query.memo_id;
    const billing_from_state = req.query.billing_from_state;
    const billing_to_state = req.query.billing_to_state;

    let objDraftMemo = new DraftMemoDetails();
    try {
        let BAIds = await db.ba.findAll({
            where: {
                ba_group_id: ba_group_cd
            },
            attributes: ['ba_id']
        })

        const results = []
        if (BAIds) {
            const draftMemoLst = await objDraftMemo.getDraftMemoLst(ba_group_cd, memo_id, billing_from_state, billing_to_state)

            if (draftMemoLst != null) {

                if (draftMemoLst.length > 0) {
                    for (var i = 0; i < draftMemoLst.length; i++) {
                        let obj = {
                            baID: draftMemoLst[i].Ba_code,
                            MemoID: draftMemoLst[i].MemoID,
                            totalInvs: draftMemoLst[i].no_of_invs,
                            invoiceDetails: await objDraftMemo.getDraftInvList(ba_group_cd, draftMemoLst[i].MemoID, billing_from_state, billing_to_state)
                        }
                        results.push(obj)
                    }
                    res.status(200).send(apiResponse.successFormat(`success`, `Draft memo fetched successfully`, results, []))
                } else
                    res.status(200).send(apiResponse.successFormat(`success`, `No Data Found`, results, []))
            } else {
                res.status(200).send(apiResponse.successFormat(`success`, `No Data Found`, results, []))
            }
        }

    } catch (error) {
        const errorObj = {
            code: `err_001`,
            message: errorCode.err_001
        }
        res.status(400).send(apiResponse.errorFormat(`fail`, `Failed to fetch Draft Memo Details`, errorObj, []))
        //throw error;
    }
}

const getDraftMemoList = async (req, res) => {

    const ba_group_cd = req.query.ba_group_id;
    const memo_id = req.query.memo_id;
    const billing_from_state = req.query.billing_from_state;
    const billing_to_state = req.query.billing_to_state;

    let objDraftMemo = new DraftMemoDetails();
    try {
        let BAIds = await db.ba.findAll({
            where: {
                ba_group_id: ba_group_cd
            },
            attributes: ['ba_id']
        })
        let finalResult = {}
        const results = []
        if (BAIds) {

            const draftMemoLst = await objDraftMemo.getDraftMemoLst(ba_group_cd, memo_id, billing_from_state, billing_to_state)
            if (draftMemoLst) {
                if (draftMemoLst.length > 0) {

                    for (var i = 0; i < draftMemoLst.length; i++) {
                        let obj = {
                            baID: draftMemoLst[i].Ba_code,
                            // draftBillID: draftMemoLst[i].draft_bill_id,
                            //MemoID: draftMemoLst[i].MemoID,
                            billingFromCode: draftMemoLst[i].Billing_From_code,
                            billingToCode: draftMemoLst[i].Billing_To_code,
                            billingFrom: draftMemoLst[i].Billing_From_state,
                            billingTo: draftMemoLst[i].Billing_To_state,
                            totalInvs: draftMemoLst[i].no_of_invs,
                            createdDate: draftMemoLst[i].created_on
                        }
                        results.push(obj)
                    }
                    finalResult = {
                        draftCount: draftMemoLst.length,
                        draftList: results
                    }
                    res.status(200).send(apiResponse.successFormat(`success`, `Draft memo fetched successfully`, finalResult, []))
                } else
                    res.status(200).send(apiResponse.successFormat(`success`, `No Data Found`, finalResult, []))
            } else {
                res.status(200).send(apiResponse.successFormat(`success`, `No Data Found`, [], []))
            }
        }
    } catch (error) {
        console.log('Error in catch ', error);
        const errorObj = {
            code: `err_001`,
            message: errorCode.err_001
        }
        res.status(400).send(apiResponse.errorFormat(`fail`, `Failed to fetch Draft Memo list`, errorObj, []));
    }
}

module.exports.getDraftMemoData = {
    getDraftMemoList,
    getDraftMemoDetails,
    checkDraftExists
}