class DraftDetails {
    async unTagLRToInvoice(lrNumbers) {
        try {

            let url = `http://${process.env.BA_PORTAL_URL}/api/v1/sap/untagBaseTransaction`
            //let url = `http://localhost:8081/api/v1/sap/untagBaseTransaction`
            request.post({
                headers: {
                    'content-type': `application/json`,
                },
                url: url,
                json: true,
                body: lrNumbers
            }, (err, response, body) => {
                if (err) {
                    throw err;
                }
            })
        } catch (err) {
            throw err;
        }
    }

    async deleteDraftDetails(baCode, fromStateCode, toStateCode) {
        try {
            /*const draftDeleted = await db.sequelize.query(`CALL SP_DeleteDraft(:baCode,:fromStateCode,:toStateCode)`, {
                replacements: {
                    baCode: baCode,
                    fromStateCode: fromStateCode,
                    toStateCode: toStateCode
                }
            });*/
            let draftFound = await db.draftBills.findAll({
                where: {
                    BA_Code: baCode,
                    Billing_From_code: fromStateCode,
                    Billing_To_code: toStateCode
                },
                attribute: ['Draft_Bill_ID']
            })

            if (draftFound) {
                var draftBillIds = []
                _.forEach(draftFound, e => {
                    let obj = {
                        draftBillID: e.dataValues.Draft_Bill_ID
                    }
                    draftBillIds.push(obj)
                })
            }
            var allInvs = _.map(draftFound, function (l) {
                return l.dataValues.Draft_Bill_ID
            })

            await db.draftfildetails.destroy({
                where: {
                    Draft_Bill_Details_ID: allInvs
                }
            })
            //-------files from server

            var unTagLRs = await db.draftbaseTransMapping.findAll({
                where: {
                    Draft_Bill_Details_ID: allInvs
                },
                attributes: [
                    ['Base_Transaction_Number', 'baseTransactionNumber'],
                    ['gl_number', 'glNumber']
                ]
            })

            console.log('unTagLRs', unTagLRs)
            await db.draftbaseTransMapping.destroy({
                where: {
                    Draft_Bill_Details_ID: allInvs
                }
            })
            await this.unTagLRToInvoice(unTagLRs);

            await db.draftBills.destroy({
                where: {
                    Draft_Bill_ID: allInvs
                }
            })

        } catch (error) {
            throw error;
        }
    }

    async deleteDraftDetailsById(baCode, draftBillID) {
        try {
            /* const draftDeleted = await db.sequelize.query(`CALL SP_DeleteDraftBillById(:baCode,:draftBillID)`, {
                 replacements: {
                     baCode: baCode,
                     draftBillID: draftBillID
                 }
             });*/
            let draftFound = await db.draftBills.findAll({
                where: {
                    BA_Code: baCode,
                    Draft_Bill_ID: draftBillID
                },
                attribute: ['Draft_Bill_ID']
            })
            await db.draftfildetails.destroy({
                where: {
                    Draft_Bill_Details_ID: draftBillID
                }
            })
            //-------files from server

            var unTagLRs = await db.draftbaseTransMapping.findAll({
                where: {
                    Draft_Bill_Details_ID: draftBillID
                },
                attributes: [
                    ['Base_Transaction_Number', 'baseTransactionNumber'],
                    ['gl_number', 'glNumber']
                ]
            })
            console.log('unTagLRs', unTagLRs)
            await db.draftbaseTransMapping.destroy({
                where: {
                    Draft_Bill_Details_ID: draftBillID
                }
            })
            await this.unTagLRToInvoice(unTagLRs);

            await db.draftBills.destroy({
                where: {
                    Draft_Bill_ID: draftBillID
                }
            })
        } catch (error) {
            throw error;
        }
    }
}

//------To Delete Memos of invoices/bills with single state combination
const deleteDraft = async (req, res) => {

    let reqQuery = req.query;

    try {

        let badetails = await db.ba.findAll({
            where: {
                isActive: 1,
                ba_id: reqQuery.ba_code
            }
        })
        if (badetails.length <= 0) {
            res.status(200).send(apiResponse.successFormat(`fail`, `Ba not found`, '', []));
            return;
        }

        let draftMemo = await db.draftBills.findAll({
            where: {
                BA_Code: reqQuery.ba_code,
                Billing_From_code: reqQuery.from_state_code,
                Billing_To_code: reqQuery.to_state_code
            }
        })
        if (draftMemo.length <= 0) {
            res.status(200).send(apiResponse.successFormat(`fail`, `Draft not found`, '', []));
            return;
        }

        let objDraftMemo = new DraftDetails();
        let results = {};
        await objDraftMemo.deleteDraftDetails(reqQuery.ba_code, reqQuery.from_state_code, reqQuery.to_state_code)

        //   if (objDraft) {

        //  if (objDraft[0].RowsAffected > 0) {
        results = {
            baCode: reqQuery.ba_code,
            fromStateCode: reqQuery.from_state_code,
            toStateCode: reqQuery.to_state_code,
            isDeleted: true
        }
        /*  } else {
              results = {
                  baCode: reqQuery.ba_code,
                  fromStateCode: reqQuery.from_state_code,
                  toStateCode: reqQuery.to_state_code,
                  isDeleted: false
              }*/
        //  }

        res.status(200).send(apiResponse.successFormat(`success`, `Data Processed`, results, []))
    } catch (error) {
        console.log('Error in deleteDraft ', error);
        const errorObj = {
            code: `err_001`,
            message: errorCode.err_001
        }
        res.status(400).send(apiResponse.errorFormat(`fail`, `Failed to delete Draft`, errorObj, []));
    }
}

//------To Delete Single Invoice/Bill
const deleteDraftByID = async (req, res) => {

    let reqQuery = req.query;

    try {

        let badetails = await db.ba.findAll({
            where: {
                isActive: 1,
                ba_id: reqQuery.ba_code
            }
        })
        if (badetails.length <= 0) {
            res.status(200).send(apiResponse.successFormat(`fail`, `Ba not found`, '', []));
            return;
        }

        let draftBills = await db.draftBills.findAll({
            where: {
                BA_Code: reqQuery.ba_code,
                Draft_Bill_ID: reqQuery.draft_bill_id
            }
        })
        if (draftBills.length <= 0) {
            res.status(200).send(apiResponse.successFormat(`fail`, `Draft details not found`, '', []));
            return;
        }

        let objDraftMemo = new DraftDetails();

        let results = {};
        await objDraftMemo.deleteDraftDetailsById(reqQuery.ba_code, reqQuery.draft_bill_id)

        //if (objDraft) {

        // if (objDraft[0].RowsAffected > 0) {
        results = {
            baCode: reqQuery.ba_code,
            draftBillID: reqQuery.draft_bill_id,
            isDeleted: true
        }
        /*} else {
            results = {
                baCode: reqQuery.ba_code,
                draftBillID: reqQuery.draft_bill_id,
                isDeleted: false
            }
        }*/
        //  }
        res.status(200).send(apiResponse.successFormat(`success`, `Data Processed`, results, []))
    } catch (error) {
        console.log('Error in deleteDraftByID ', error);
        const errorObj = {
            code: `err_001`,
            message: errorCode.err_001
        }
        res.status(400).send(apiResponse.errorFormat(`fail`, `Failed to delete Draft by ID`, errorObj, []));
    }
}

module.exports.deleteDraftData = {
    deleteDraft,
    deleteDraftByID
}