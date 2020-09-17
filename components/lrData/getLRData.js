class LRData {

    async getDraftLRDetails(baCode, draftBillId) {
        try {
            db.draftbaseTransMapping.belongsTo(db.draftBills, {
                foreignKey: 'Draft_Bill_Details_ID',
                targetKey: 'Draft_Bill_ID'
            });
            db.draftbaseTransMapping.belongsTo(db.glCode, {
                foreignKey: 'gl_number',
                targetKey: 'Gl_code'
            });
            let lrDetails = await db.draftbaseTransMapping.findAll({
                include: [{
                    model: db.draftBills,
                    required: true,
                    where: {
                        BA_Code: baCode
                    },
                    attributes: []
                }, {
                    model: db.glCode,
                    required: true,
                    attributes: ['Gl_Description']
                }],
                where: {
                    Draft_Bill_Details_ID: draftBillId,
                    is_tagged_to_invoice: 1
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
                            draftBillDetailsId: e.dataValues.Draft_Bill_Details_ID,
                            postingDate: e.dataValues.Posting_Date,
                            docDate: e.dataValues.Doc_Date,
                            provisionDocumentNumber: e.dataValues.Provision_Document_Number,
                            fiscalYear: e.dataValues.Fiscal_year,
                            provisionDocumentItem: e.dataValues.Provision_Document_Item,
                            internalOrder: e.dataValues.Internal_order,
                            baseTransactionType: e.dataValues.Base_Transaction_Type,
                            baseTransactionDate: e.dataValues.Base_Transaction_Date,
                            lrNumber: e.dataValues.Base_Transaction_Number,
                            customerCode: e.dataValues.Customer_Code,
                            amountProvisional: e.dataValues.Amount_Provisional,
                            amount: e.dataValues.Amount,
                            glNumber: e.dataValues.gl_number,
                            glDescription: e.dataValues.glcode.Gl_Description
                        }
                        results.push(obj)
                    })
                    return results;
                }
                return results;
            }
        } catch (error) {
            throw error;
        }
    }

    async getLRDetails(baCode, billDetailsId) {
        try {
            db.billBaseTransMapping.belongsTo(db.billDetails, {
                foreignKey: 'Bill_details_id',
                targetKey: 'BillDetails_ID'
            });
            db.billBaseTransMapping.belongsTo(db.glCode, {
                foreignKey: 'gl_number',
                targetKey: 'Gl_code'
            });
            let lrDetails = await db.billBaseTransMapping.findAll({
                include: [{
                        model: db.billDetails,
                        required: true,
                        where: {
                            BA_Code: baCode
                        },
                        attributes: []
                    },
                    {
                        model: db.glCode,
                        required: true,
                        attributes: ['Gl_Description']
                    }
                ],
                where: {
                    Bill_details_id: billDetailsId,
                    is_tagged_to_invoice: 1
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
                            lrNumber: e.dataValues.Base_Transaction_Number,
                            customerCode: e.dataValues.Customer_Code,
                            amountProvisional: e.dataValues.Amount_Provisional,
                            amount: e.dataValues.Amount,
                            glNumber: e.dataValues.gl_number,
                            glDescription: e.dataValues.glcode.Gl_Description
                        }
                        results.push(obj)
                    })
                    return results;
                }
                return results;
            }
        } catch (error) {
            throw error;
        }
    }
}

const getDraftLRData = async (req, res) => {
    try {

        let baCode = req.query.baCode
        let draftBillId = req.query.draftBillId

        var objLrData = new LRData();

        var invLRData = await objLrData.getDraftLRDetails(baCode, draftBillId)

        if (invLRData) {
            if (invLRData.length > 0) {
                res.status(200).send(apiResponse.successFormat(`success`, `Draft Base transaction details fectched successfully`, invLRData, []))
            } else {
                res.status(200).send(apiResponse.successFormat(`success`, `No data found.`, invLRData, []))
            }
        }
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

const getBillLRData = async (req, res) => {
    try {

        let baCode = req.query.baCode
        let billDetailsId = req.query.billDetailsId

        var objLrData = new LRData();

        var invLRData = await objLrData.getLRDetails(baCode, billDetailsId)

        if (invLRData) {
            if (invLRData.length > 0) {
                res.status(200).send(apiResponse.successFormat(`success`, `Bill Base transaction details fectched successfully`, invLRData, []))
            } else {
                res.status(200).send(apiResponse.successFormat(`success`, `No data found.`, invLRData, []))
            }
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

module.exports.getLRData = {
    getDraftLRData,
    getBillLRData
}