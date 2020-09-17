const CommonFuncs = require('../commonFunctions');
const Validation = require('../validations/invoiceValidations')
const emailService = require(`../../services/email/email`).emailServiceCls
const billActivity = require('../../utils/logs/addBillActivity')
const userActivity = require('../../utils/logs/addUserActivityLog')

Number.prototype.padLeft = function (n, str) {
    return Array(n - String(this).length + 1).join(str || '0') + this;
}
class SaveMemoData {
    async getTotalFileCnt(draftBillDetailsId) {

        let fileCnt = await db.draftfildetails.count({
            where: {
                Draft_Bill_Details_ID: draftBillDetailsId
            }
        })
        return fileCnt;
    }
    async getFileDetails(draftBillDetailsId) {

        let fileDetails = await db.draftfildetails.findAll({
            where: {
                Draft_Bill_Details_ID: draftBillDetailsId
            }
        })
        let draftFileDetails = []
        _.forEach(fileDetails, e => {
            let obj = {
                draftBillFileId: e.dataValues.Draft_Bill_File_Id,
                draftBillDetailsId: e.dataValues.Draft_Bill_Details_ID,
                filePath: e.dataValues.FilePath,
                fileName: e.dataValues.File_Name,
                fileType: e.dataValues.File_Type
            }
            draftFileDetails.push(obj)
        });
        return draftFileDetails;
    }
    async getTotalLRCnt(draftBillDetailsId) {

        let lrCnt = await db.draftbaseTransMapping.count({
            where: {
                Draft_Bill_Details_ID: draftBillDetailsId
            }
        })
        return lrCnt;
    }
    async getDraftInvoicedata(draftBillId) {
        try {
            console.log('IN ----------->', draftBillId)
            let resData = await db.sequelize.query(`CALL SP_getAllDraftInvoiceDetails(:draftBillId)`, {
                replacements: {
                    draftBillId: draftBillId
                },
                type: db.sequelize.QueryTypes.SELECT
            });

            var invoiceData = ''

            if (!_.isEmpty(resData[0])) {
                console.log('resData[0]', resData[0])

                invoiceData = resData[0][0];
                var files = _.toArray(resData[1])
                var baseTransactions = _.toArray(resData[2])

                invoiceData.files = files;
                invoiceData.baseTransactions = baseTransactions;

            }
            return invoiceData;
        } catch (error) {
            console.log('error', error)
            return null;

            // throw error;
        }
    }
    async getDraftMemoLst(ba_group_cd, billing_from_state, billing_to_state) {
        try {
            console.log('ba_group_cd, ', ba_group_cd, 'billing_from_state, ', billing_from_state, 'billing_to_state', billing_to_state)

            let billDetails = await db.draftBills.findAll({
                raw: true,
                include: [{
                    model: db.ba,
                    required: true,
                    where: {
                        ba_group_id: ba_group_cd
                    },
                    attributes: []
                }],
                where: {
                    Billing_To_code: billing_to_state,
                    Billing_From_code: billing_from_state
                },
                attributes: ['Draft_Bill_ID', 'MemoID', 'BillNo', 'IsPO']
            })

            var billIDs = [];

            for (var i = 0; i < billDetails.length; i++) {
                console.log('billDetails', billDetails[i])
                let obj = {
                    draftBillId: billDetails[i].Draft_Bill_ID,
                    memoID: billDetails[i].MemoID,
                    billNo: billDetails[i].BillNo,
                    isPO: billDetails[i].IsPO,
                    fileCnt: await this.getTotalFileCnt(billDetails[i].Draft_Bill_ID),
                    lrCnt: await this.getTotalLRCnt(billDetails[i].Draft_Bill_ID)
                }
                billIDs.push(obj)
            }
            console.log('billIDs', billIDs)
            return billIDs;
        } catch (error) {
            console.log(error)
            return null;
            // throw error;
        }
    }
    async getDraftLRDetails(baCode, draftBillId) {
        try {
            db.draftbaseTransMapping.belongsTo(db.draftBills, {
                foreignKey: 'Draft_Bill_Details_ID',
                targetKey: 'Draft_Bill_ID'
            });
            let lrDetails = await db.draftbaseTransMapping.findAll({
                include: [{
                    model: db.draftBills,
                    required: true,
                    where: {
                        BA_Code: baCode
                    },
                    attributes: []
                }],
                where: {
                    Draft_Bill_Details_ID: draftBillId
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
                            baseTransactionNumber: e.dataValues.Base_Transaction_Number,
                            customerCode: e.dataValues.Customer_Code,
                            amountProvisional: e.dataValues.Amount_Provisional,
                            amount: e.dataValues.Amount
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
    async saveMemoData(dataObj) {

        try {
            var commonFuncs = new CommonFuncs()
            var fiscalYears = await commonFuncs.getFiscalYear();

            var yr1 = new Date(fiscalYears.startDate).getFullYear().toString()
            var yr2 = moment(fiscalYears.endDate, 'YYYY-MM-DD').format('YY').toString()

            var memoId = await db.memoDetails
                .create({
                    Memo_Date: moment().format('YYYY-MM-DD HH:mm:ss'),
                    Memo_Number: dataObj.MemoNumber,
                    Submit_To_ID: dataObj.SubmitToId,
                    BA_Code: dataObj.BaCode,
                    Submittion_Location_Code: dataObj.SubmittionLocationCode,
                    CreatedBy: dataObj.CreatedBy,
                    CreatedOn: moment().format('YYYY-MM-DD HH:mm:ss'),
                    FiscalYear: yr1 + '-' + yr2
                })
                .then(result => {
                    return result.Memo_ID
                })
                .catch((error) => {
                    //console.log('error', error)
                    throw error;
                });
            return memoId;
        } catch (error) {
            throw error;
        }
    }
    async saveInvoiceData(dataObj) {
        try {
            var billDetailsID = await db.billDetails
                .create({

                    MemoID: dataObj.MemoID,
                    BillNo: dataObj.BillNo,
                    Amount: dataObj.Amount,
                    BillDate: dataObj.BillDate,
                    status: 'S',
                    IGST: dataObj.IGST,
                    CGST: dataObj.CGST,
                    SGST: dataObj.SGST,
                    OtherCharges: dataObj.OtherCharges,
                    TaxableAmount: dataObj.TaxableAmount,
                    Service_code: dataObj.Service_code,
                    Reason: dataObj.Reason,
                    Billing_To_code: dataObj.Billing_To_code,
                    Billing_From_code: dataObj.Billing_From_code,
                    Comments: dataObj.Comments,
                    BA_Code: dataObj.BA_Code,
                    UpdatedBy: dataObj.UpdatedBy,
                    UpdatedOn: moment().format('YYYY-MM-DD HH:mm:ss'),
                    File_Path: dataObj.File_Path,
                    HSN_Code: dataObj.HSN_Code,
                    Customer_Name: dataObj.Customer_Name,
                    Additional_Amount: dataObj.Additional_Amount,
                    Trade_Discount: dataObj.Trade_Discount,
                    Inv_Source: dataObj.Inv_Source,
                    IsPO: dataObj.IsPO,
                    TotalPayment_Released: dataObj.TotalPayment_Released,
                    TotalPayment_Requested: dataObj.TotalPayment_Requested,
                    Advance_Payment: dataObj.Advance_Payment,
                    Advance_TDS: dataObj.Advance_TDS
                })
                .then(result => {
                    return result.BillDetails_ID
                })
                .catch((error) => {
                    //console.log('error', error)
                    throw error;
                });
            return billDetailsID;
        } catch (error) {
            throw error;
        }
    }
    async saveFiles(fileLst) {

        console.log('saveFiles', fileLst)
        await db.billFileDetails.bulkCreate(fileLst, {
            individualHooks: true
        }).catch(err => {
            throw err;
        })
    }
    async saveLRs(lrLst) {
        console.log('saveLRs', lrLst)
        await db.billBaseTransMapping.bulkCreate(lrLst, {
            individualHooks: true
        }).catch(err => {
            throw err;
        })
    }
    async getNextMemoNumber(baCode, fiscalYear) {

        var maxMemoId = await db.memoDetails.findAll({
            where: {
                FiscalYear: fiscalYear,
                BA_Code: baCode
            },
            attributes: [
                [Sequelize.fn('max', Sequelize.col('Memo_ID')), 'memoId']
            ],
        })
        var maxID = _.map(maxMemoId, function (l) {
            return l.dataValues.memoId
        })
        var nextNum = 0;
        if (maxID[0] == null) {
            nextNum = 1;
        } else {
            var memoDetails = await db.memoDetails.findAll({
                where: {
                    Memo_ID: maxID
                },
                attributes: ['Memo_Number'],
            })
            var lst = _.map(memoDetails, function (l) {
                return l.dataValues.Memo_Number
            })
            var memoIncNum = lst[0].split('-')[3]
            var num = Number(memoIncNum)
            console.log('num', num)
            num++
            nextNum = num
        }
        var nxtMemoNum = nextNum.padLeft(5);

        console.log('NextString', nxtMemoNum)
        return nxtMemoNum;
    }
    async deleteDraftDetails(baCode, fromStateCode, toStateCode) {
        try {
            let draftFound = await db.draftBills.findAll({
                where: {
                    BA_Code: baCode,
                    Billing_From_code: fromStateCode,
                    Billing_To_code: toStateCode
                },
                attribute: ['Draft_Bill_ID']
            })

            if (draftFound) {
                var allInvs = _.map(draftFound, function (l) {
                    return l.dataValues.Draft_Bill_ID
                })
                await db.draftfildetails.destroy({
                    where: {
                        Draft_Bill_Details_ID: allInvs
                    }
                })
                await db.draftbaseTransMapping.destroy({
                    where: {
                        Draft_Bill_Details_ID: allInvs
                    }
                })
                await db.draftBills.destroy({
                    where: {
                        Draft_Bill_ID: allInvs
                    }
                })
            }

        } catch (error) {
            throw error;
        }
    }
    async sendMail(memoId, invCnt) {
        try {
            var emailData = await db.mailformatModel.findOne({
                where: {
                    Mail_Titile: 'MEMO submitted'
                },
                raw: true
            });
            var memoData = await db.memoDetails.findOne({
                attributes: ['Submit_To_ID', 'CreatedBy', 'Memo_Number', 'user.email_id', 'user.first_name', 'user.last_name'],
                include: [{
                    model: db.users,
                    attributes: ['email_id', 'first_name', 'last_name']
                }],
                where: {
                    Memo_ID: memoId
                },
                raw: true
            });

            console.log('emailData', emailData)
            console.log('memoData', memoData)
            if (memoData != null) {
                console.log('IN-----')
                var userData = await db.users.findOne({
                    attributes: ['email_id'],
                    where: {
                        user_id: memoData.CreatedBy
                    },
                    raw: true
                });
                console.log(userData)
                console.log(memoData['user.first_name'])
                if (emailData) {
                    var emailBody = emailData.Mail_Body.replace(/#Submitted_To_Name#/g, (memoData['user.first_name'] + ' ' + memoData['user.last_name']))
                        .replace(/#MEMO_No#/g, memoData.Memo_Number)
                        .replace(/#n#/g, invCnt);

                    var emailSubject = emailData.Mail_Subject.replace(/#MEMO_No#/g, memoData.Memo_Number)
                    var toEmailArr = [];
                    var ccEmailArr = []

                    toEmailArr.push(memoData['user.email_id']) //submitted to commercial
                    ccEmailArr.push(userData.email_id) //ba in cc
                    ccEmailArr.push('rewale.megha@mahindra.com')
                    ccEmailArr.push('kothari.roshni@mahindra.com')

                    console.log(toEmailArr)

                    var resEmail = await emailService.sendEmailViaBH({
                        Mail_Subject: emailSubject,
                        Mail_Body: emailBody,
                        // Mail_Title: emailData.Mail_Titile,
                        Mail_Title: 'BAPortal',
                        ToMail_Ids: toEmailArr,
                        CcMail_Ids: ccEmailArr
                    })
                    userActivity.userActivityLog.addLog({
                        activityName: "MailSent",
                        details: "Memo Submitted " + memoData.Memo_Number,
                        oldValue: "",
                        newValue: "",
                        userId: memoData.CreatedBy
                    });
                    return resEmail
                }
            }
        } catch (ex) {
            console.log(ex)
        }
    }
}
let commonFuncs = new CommonFuncs();
const saveMemoDetails = async (req, res) => {

    let reqBody = req.body;
    console.log('IN')
    try {
        let objDraftMemo = new SaveMemoData();
        var memoId = ''

        var fiscalYears = await commonFuncs.getFiscalYear()
        var draftData = await objDraftMemo.getDraftMemoLst(reqBody.baGroupId, reqBody.billingFromState, reqBody.billingToState)

        console.log('draftData.length', draftData)
        var valMsg = '';

        var duplicateInvoices = []
        if (draftData.length <= 0) {
            valMsg += '-No invoice found in draft.';
        } else {
            var totalInvoices = 0;

            var invLimit = Config.InvoiceCntPerDraft
            for (var i = 0; i < draftData.length; i++) {

                totalInvoices += 1;
                var invalidNum = ''
                invalidNum = draftData[i].billNo;
                console.log('draftData[i].billNo;', draftData[i].billNo)

                if (draftData[i].fileCnt <= 0)
                    valMsg += `-Files not found for Invoice:` + invalidNum
                else {
                    let invCnt = 0;
                    let draftFiles = await objDraftMemo.getFileDetails(draftData[i].draftBillId);
                    console.log('draftFiles', draftFiles)
                    if (draftFiles.length > 0) {
                        invCnt = draftFiles.filter(x => (x.fileType) == 'Invoice').length
                    }
                    if (invCnt <= 0)
                        valMsg += `-Invoice copy not uploaded Invoice:` + invalidNum
                }
                if (draftData[i].lrCnt <= 0 && draftData[i].isPO == 0)
                    valMsg += `-LR details not found for Invoice:` + invalidNum

                var billdetails = await db.billDetails.findAll({
                    raw: true,
                    where: {
                        BillNo: draftData[i].billNo,
                        BA_Code: reqBody.baCode,
                        status: {
                            [Sequelize.Op.notIn]: ["C"]
                        },
                        UpdatedOn: {
                            [Sequelize.Op.lte]: new Date(moment(fiscalYears.endDate, 'YYYY-MM-DD')),
                            [Sequelize.Op.gte]: new Date(moment(fiscalYears.startDate, 'YYYY-MM-DD'))
                        }
                    },
                    attributes: ['IsPO', 'Inv_Source']
                })
                if (billdetails.length > 0)
                    duplicateInvoices.push(draftData[i].billNo)

                if (valMsg != '')
                    break;
            }
            if (totalInvoices > invLimit)
                valMsg += `-Invoice limit exceeded.`

            if (duplicateInvoices.length > 0)
                valMsg += `-Duplicate Invoices`
        }

        if (valMsg != '') {
            res.status(400).send(apiResponse.errorFormat(`fail`, valMsg, duplicateInvoices, []));
            return;
        } else {
            var yr1 = new Date(fiscalYears.startDate).getFullYear().toString()
            var yr2 = moment(fiscalYears.endDate, 'YYYY-MM-DD').format('YY').toString()

            var incNum = await objDraftMemo.getNextMemoNumber(reqBody.baCode, yr1 + '-' + yr2)
            var incMemoNum = draftData[0].memoID + '-' + yr1 + '-' + yr2 + '-' + incNum;

            var objMemo = {
                MemoNumber: incMemoNum,
                SubmitToId: reqBody.submitToId,
                BaCode: reqBody.baCode,
                SubmittionLocationCode: reqBody.submittionLocationCode,
                CreatedBy: reqBody.userId,
            }
            memoId = await objDraftMemo.saveMemoData(objMemo)
            console.log('memoId', memoId)

            for (var i = 0; i < draftData.length; i++) {

                var invData = await objDraftMemo.getDraftInvoicedata(draftData[i].draftBillId)
                console.log('invoice number', invData.billNo)
                var errrTxt = '';

                var objBillDetails = {
                    MemoID: memoId,
                    BillNo: invData.billNo,
                    Amount: invData.totalAmount,
                    BillDate: invData.billDate,
                    status: 'S',
                    IGST: invData.igst,
                    CGST: invData.cgst,
                    SGST: invData.sgst,
                    OtherCharges: invData.otherCharges,
                    TaxableAmount: invData.baseAmount,
                    Additional_Amount: invData.additionalAmount,
                    Trade_Discount: invData.tradeDiscount,
                    Service_code: invData.serviceCode,
                    Reason: invData.reason,
                    Billing_To_code: invData.billingToCode,
                    Billing_From_code: invData.billingFromCode,
                    Comments: invData.comments,
                    BA_Code: invData.baCode,
                    UpdatedBy: reqBody.userId,
                    UpdatedOn: moment().format('YYYY-MM-DD HH:mm:ss'),
                    TotalPayment_Released: 0,
                    TotalPayment_Requested: 0,
                    Advance_Payment: 0,
                    Advance_TDS: 0,
                    HSN_Code: invData.hsnCode,
                    Customer_Name: invData.customerName,
                    File_Path: invData.filePath,
                    Inv_Source: (invData.invSource == undefined) ? '0' : invData.invSource.toUpperCase(),
                    IsPO: invData.isPO
                }

                console.log('objBillDetails--->', objBillDetails)
                var billDetailsID = await objDraftMemo.saveInvoiceData(objBillDetails)

                console.log('billDetailsID', billDetailsID)

                if (invData.files) {
                    if (invData.files.length > 0) {
                        let billFiles = []
                        _.forEach(invData.files, e => {
                            let obj = {
                                Bill_Details_ID: billDetailsID,
                                FilePath: e.filePath,
                                File_Name: e.fileName,
                                Created_By: reqBody.userId,
                                Created_On: moment().format('YYYY-MM-DD HH:mm:ss'),
                                File_Type: e.fileType
                            }
                            billFiles.push(obj)
                        });
                        await objDraftMemo.saveFiles(billFiles)
                    }
                }
                if (invData.baseTransactions) {
                    if (invData.baseTransactions.length > 0) {
                        let billLRs = []
                        _.forEach(invData.baseTransactions, e => {
                            let obj = {
                                Bill_details_id: billDetailsID,
                                Doc_Date: e.docDate,
                                Posting_Date: e.postingDate,
                                Provision_Document_Number: e.provisionDocumentNumber,
                                Fiscal_year: e.fiscalYear,
                                Provision_Document_Item: e.provisionDocumentItem,
                                Internal_order: e.internalOrder,
                                Base_Transaction_Type: e.baseTransactionType,
                                Base_Transaction_Date: e.baseTransactionDate,
                                Base_Transaction_Number: e.baseTransactionNumber,
                                Customer_Code: e.customerCode,
                                Amount_Provisional: e.amountProvisional,
                                Amount: e.amount,
                                Created_On: moment().format('YYYY-MM-DD HH:mm:ss'),
                                Created_By: reqBody.userId,
                                is_tagged_to_invoice: e.isTaggedToInvoice,
                                gl_number: e.glNumber
                            }
                            billLRs.push(obj)
                        });
                        await objDraftMemo.saveLRs(billLRs)
                    }
                }
                billActivity.billActivity.addLog({
                    billDetailsId: billDetailsID,
                    activityCode: "Invoice_Submitted",
                    activityDes: "Invoice Submitted with  BillNo : " + objBillDetails.BillNo,
                    currStatus: "S",
                    preStatus: "",
                    updatedBy: reqBody.userId
                });
                userActivity.userActivityLog.addLog({
                    activityName: "Invoice_Created",
                    details: "Invoice Created  - " + objBillDetails.BillNo + " Memo : " + objMemo.MemoNumber,
                    oldValue: "",
                    newValue: objBillDetails.BillNo,
                    userId: reqBody.userId
                });
            }
            objDraftMemo.sendMail(memoId, draftData.length)

            await objDraftMemo.deleteDraftDetails(reqBody.baCode, reqBody.billingFromState, reqBody.billingToState)
        }
        var objMemo = {
            memoID: memoId,
            memoNumber: incMemoNum,
            duplicateInvoices: duplicateInvoices
        }
        res.status(200).send(apiResponse.successFormat(`success`, `Data Saved Successfully`, objMemo, []))
    } catch (error) {
        console.log('Error in saveDraft ', error);
        const errorObj = {
            code: `err_001`,
            message: errorCode.err_001
        }
        res.status(400).send(apiResponse.errorFormat(`fail`, `Failed to save Draft`, errorObj, []));
    }
}
module.exports = {
    saveMemoDetails
}