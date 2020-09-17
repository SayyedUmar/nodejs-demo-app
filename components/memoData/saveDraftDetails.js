const CommonFuncs = require('../commonFunctions');
const Validation = require('../validations/invoiceValidations')
const BaseTrans = require('../lrData/getBaseTransactions')


Number.prototype.trucateNum = function () {
    var truncated = Math.floor(this * 100) / 100;
    return truncated;
}

class FilesClass {
    async deleteFile(filePath) {
        return new Promise((resolve, reject) => {
            try {
                fs.unlinkSync(`${filePath}`)
                resolve()
            } catch (error) {
                reject(error)
            }
        })
    }
}
class BaseTransUpdation {
    async tagLRToInvoice(lrNumbers) {
        try {
            console.log('lrNumbers', lrNumbers)
            let url = `http://${process.env.BA_PORTAL_URL}/api/v1/sap/tagBaseTransaction`
            // let url = `http://localhost:8081/api/v1/sap/tagBaseTransaction`
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
}

const filesClass = new FilesClass()
const objBaseTrans = new BaseTransUpdation()

class SaveDraftData {

    async saveDraftInvData(dataObj) {
        console.log('invoiceDate', dataObj.invDate)

        console.log('invoice date', moment(dataObj.invDate).format('YYYY-MM-DD'))
        console.log('invoice date', moment(dataObj.invDate).format('YYYY-MM-DD HH:mm:ss'))
        try {
            var commonFuncs = new CommonFuncs()

            let serviceCode;
            if (dataObj.serviceCode == null || dataObj.serviceCode != '') {
                serviceCode = await commonFuncs.getServiceID(dataObj.serviceName)
            } else
                serviceCode = dataObj.serviceCode

            let baStateCode;
            baStateCode = await commonFuncs.getBAUniqueCode(dataObj.baCode)

            console.log('dataObj.igst', dataObj.igst, 'dataObj.cgst', dataObj.cgst, 'dataObj.sgst ', dataObj.sgst, 'dataObj.baseAmount', dataObj.baseAmount, 'additionalAmount', dataObj.additionalAmount, 'tradeDiscount', dataObj.tradeDiscount)
            let totalAmt = 0;
            let igstAmt = await commonFuncs.converToNumber(dataObj.igst)
            let cgstAmt = await commonFuncs.converToNumber(dataObj.cgst)
            let sgstAmt = await commonFuncs.converToNumber(dataObj.sgst)
            let baseAmt = await commonFuncs.converToNumber(dataObj.baseAmount)
            let additionalAmt = await commonFuncs.converToNumber(dataObj.additionalAmount)
            let tdAmt = await commonFuncs.converToNumber(dataObj.tradeDiscount)

            console.log('igstAmt', igstAmt.trucateNum(), 'cgstAmt', cgstAmt.trucateNum(), 'sgstAmt', sgstAmt.trucateNum(), 'baseAmt', baseAmt.trucateNum(), 'additionalAmt', additionalAmt.trucateNum(), 'tdAmt', tdAmt.trucateNum())
            totalAmt = (igstAmt.trucateNum() + cgstAmt.trucateNum() + sgstAmt.trucateNum() + baseAmt.trucateNum() + additionalAmt.trucateNum() - tdAmt.trucateNum())
            console.log('totalAmt', totalAmt.trucateNum())

            var billDraftID = await db.draftBills
                .create({
                    MemoID: baStateCode,
                    BillNo: dataObj.invNumber,
                    Amount: (totalAmt == undefined || totalAmt == '') ? 0 : totalAmt.trucateNum(),
                    BillDate: moment(dataObj.invDate).format('YYYY-MM-DD HH:mm:ss'),
                    status: 'S',
                    IGST: (igstAmt == undefined || igstAmt == '') ? 0 : igstAmt.trucateNum(),
                    CGST: (cgstAmt == undefined || cgstAmt == '') ? 0 : cgstAmt.trucateNum(),
                    SGST: (sgstAmt == undefined || sgstAmt == '') ? 0 : sgstAmt.trucateNum(),
                    OtherCharges: dataObj.otherCharges,
                    TaxableAmount: (baseAmt == undefined || baseAmt == '') ? 0 : baseAmt.trucateNum(),
                    Service_code: serviceCode,
                    Reason: dataObj.reason,
                    Billing_To_code: dataObj.billingToCode,
                    Billing_From_code: dataObj.billingFromCode,
                    Comments: dataObj.comments,
                    BA_Code: dataObj.baCode,
                    UpdatedBy: dataObj.baCode,
                    UpdatedOn: moment().format('YYYY-MM-DD HH:mm:ss'),
                    CreatedOn: moment().format('YYYY-MM-DD HH:mm:ss'),
                    File_Path: dataObj.filePath,
                    HSN_Code: dataObj.hsnCode,
                    Customer_Name: dataObj.customerName,
                    Additional_Amount: (additionalAmt == undefined || additionalAmt == '') ? 0 : additionalAmt.trucateNum(),
                    Trade_Discount: (tdAmt == undefined || tdAmt == '') ? 0 : tdAmt.trucateNum(),
                    Inv_Source: ((dataObj.invSource == undefined) ? '0' : dataObj.invSource.toUpperCase()),
                    IsPO: ((dataObj.isPO == undefined) ? 0 : dataObj.isPO)
                })
                .then(result => {
                    return result.Draft_Bill_ID
                })
                .catch((error) => {
                    //console.log('error', error)
                    throw error;
                });
            return billDraftID;
        } catch (error) {
            throw error;
        }
    }
    async saveDraftFileData(files, draftBillID) {
        try {
            var draftFiles = [];

            _.forEach(files, (fl, key) => {
                //if (fl.draftBillFileID == '' || fl.draftBillFileID == null || fl.draftBillFileID == undefined) {
                draftFiles.push({
                    Draft_Bill_Details_ID: draftBillID,
                    FilePath: fl.filePath,
                    File_Name: fl.fileName,
                    Created_By: fl.createdBy,
                    Created_On: moment().format('YYYY-MM-DD HH:mm:ss'),
                    File_Type: fl.fileType
                })
                //}
            })
            await db.draftfildetails.bulkCreate(draftFiles, {
                individualHooks: true
            }).catch(err => {
                throw err;
            })
        } catch (error) {
            throw error;
        }
    }
    async saveDraftBaseTransMapping(baseTransactions, draftBillID, allBaseTransData) {
        try {
            console.log('saveDraftBaseTransMapping', allBaseTransData)

            var draftBaseTransMappings = [];
            var taggingLRs = [];
            _.forEach(baseTransactions, (fl, key) => {
                console.log('------------------------------->')
                console.log('fl', fl)

                //  if (fl.id == '' || fl.id == null || fl.id == undefined) {
                let baseTransDate = '';

                if (moment(fl.baseTransactionDate, "DD-MMM-YYYY", true).isValid())
                    baseTransDate = moment(fl.baseTransactionDate, 'DD-MMM-YYYY').format('YYYY-MM-DD');
                else
                    baseTransDate = moment(fl.baseTransactionDate).format('YYYY-MM-DD');

                console.log('fl.baseTransactionDate', fl.baseTransactionDate, 'New date', baseTransDate)

                var lrFound = allBaseTransData.filter(function (l) {
                    console.log('fl.baseTransactionNumber ', l.baseTransactionNumber, 'l.baseTransactionDate ', l.baseTransactionDate)
                    return (l.baseTransactionNumber == fl.baseTransactionNumber && l.glNumber == fl.glNumber && l.baseTransactionDate == baseTransDate && l.baseTransactionType == fl.baseTransactionType);
                });
                console.log('singleLR', lrFound)

                if (lrFound.length > 0) {
                    draftBaseTransMappings.push({
                        Draft_Bill_Details_ID: draftBillID,
                        Doc_Date: lrFound[0].docDate,
                        Posting_Date: lrFound[0].postingDate,
                        Provision_Document_Number: lrFound[0].provisionDocumentNumber,
                        Fiscal_year: lrFound[0].fiscalYear,
                        Provision_Document_Item: lrFound[0].provisionDocumentItem,
                        Internal_order: lrFound[0].internalOrder,
                        Base_Transaction_Type: lrFound[0].baseTransactionType,
                        Base_Transaction_Date: lrFound[0].baseTransactionDate,
                        Base_Transaction_Number: lrFound[0].baseTransactionNumber,
                        Customer_Code: lrFound[0].customerCode,
                        Amount_Provisional: lrFound[0].amountProvisional,
                        Amount: (fl.amount == undefined || fl.amount == '') ? 0 : fl.amount, //.trucateNum(),
                        Created_On: moment().format('YYYY-MM-DD HH:mm:ss'),
                        Created_By: fl.createdBy,
                        is_tagged_to_invoice: 1,
                        gl_number: fl.glNumber
                    })

                    taggingLRs.push({
                        baseTransactionNumber: lrFound[0].baseTransactionNumber,
                        glNumber: fl.glNumber
                    })
                    console.log('taggingLRs------------>', taggingLRs)
                }
                //}
            })
            console.log('draftBaseTransMappings-----> Pushing', draftBaseTransMappings)

            await db.draftbaseTransMapping.bulkCreate(draftBaseTransMappings, {
                individualHooks: true
            }).catch(err => {
                console.log('error in lr', err)
                throw err;
            })
            await objBaseTrans.tagLRToInvoice(taggingLRs);
        } catch (error) {
            console.log('Error in saveDraftBaseTransMapping', error)
            throw error;
        }
    }
    async updateDraftBaseTransMapping(baseTransactions, draftBillID) {
        try {
            console.log('draftBaseTransMappings-----> updating', baseTransactions)

            _.forEach(baseTransactions, async (fl, key) => {
                await db.draftbaseTransMapping.update({
                    Amount: (fl.amount == undefined || fl.amount == '') ? 0 : fl.amount.trucateNum()
                }, {
                    where: {
                        ID: fl.id,
                        Draft_Bill_Details_ID: draftBillID,
                        Base_Transaction_Number: fl.baseTransactionNumber
                    }
                }).catch(err => {
                    console.log('error in update lr', err)
                    throw err;
                })
            })

        } catch (error) {
            console.log('Error in updateDraftBaseTransMapping', error)
            throw error;
        }
    }
    async updateDraftInvData(dataObj) {
        try {
            var commonFuncs = new CommonFuncs()

            let baStateCode;
            baStateCode = await commonFuncs.getBAUniqueCode(dataObj.baCode)

            //console.log('dataObj.igst', dataObj.igst, 'dataObj.cgst', dataObj.cgst, 'dataObj.sgst ', dataObj.sgst, 'dataObj.baseAmount', dataObj.baseAmount, 'additionalAmount', dataObj.additionalAmount, 'tradeDiscount', dataObj.tradeDiscount)
            let totalAmt = 0;
            let igstAmt = await commonFuncs.converToNumber(dataObj.igst)
            let cgstAmt = await commonFuncs.converToNumber(dataObj.cgst)
            let sgstAmt = await commonFuncs.converToNumber(dataObj.sgst)
            let baseAmt = await commonFuncs.converToNumber(dataObj.baseAmount)
            let additionalAmt = await commonFuncs.converToNumber(dataObj.additionalAmount)
            let tdAmt = await commonFuncs.converToNumber(dataObj.tradeDiscount)

            console.log('igstAmt', igstAmt.trucateNum(), 'cgstAmt', cgstAmt.trucateNum(), 'sgstAmt', sgstAmt.trucateNum(), 'baseAmt', baseAmt.trucateNum(), 'additionalAmt', additionalAmt.trucateNum(), 'tdAmt', tdAmt.trucateNum())
            totalAmt = (igstAmt.trucateNum() + cgstAmt.trucateNum() + sgstAmt.trucateNum() + baseAmt.trucateNum() + additionalAmt.trucateNum() - tdAmt.trucateNum())
            console.log('totalAmt', totalAmt.trucateNum())

            var billDraftID = await db.draftBills
                .update({
                    MemoID: baStateCode,
                    BillNo: dataObj.invNumber,
                    Amount: (totalAmt == undefined || totalAmt == '') ? 0 : totalAmt.trucateNum(),
                    BillDate: dataObj.invDate,
                    status: 'S',
                    IGST: (dataObj.igst == undefined || dataObj.igst == '') ? 0 : igstAmt.trucateNum(),
                    CGST: (dataObj.cgst == undefined || dataObj.cgst == '') ? 0 : cgstAmt.trucateNum(),
                    SGST: (dataObj.sgst == undefined || dataObj.sgst == '') ? 0 : sgstAmt.trucateNum(),
                    OtherCharges: dataObj.otherCharges,
                    TaxableAmount: (dataObj.baseAmount == undefined || dataObj.baseAmount == '') ? 0 : baseAmt.trucateNum(),
                    Service_code: dataObj.serviceCode,
                    Reason: dataObj.reason,
                    Billing_To_code: dataObj.billingToCode,
                    Billing_From_code: dataObj.billingFromCode,
                    Comments: dataObj.comments,
                    BA_Code: dataObj.baCode,
                    UpdatedBy: dataObj.updatedBy,
                    UpdatedOn: moment().format('YYYY-MM-DD HH:mm:ss'),
                    File_Path: dataObj.filePath,
                    HSN_Code: dataObj.hsnCode,
                    Customer_Name: dataObj.customerName,
                    Additional_Amount: (dataObj.additionalAmount == undefined || dataObj.additionalAmount == '') ? 0 : additionalAmt.trucateNum(),
                    Trade_Discount: (dataObj.tradeDiscount == undefined || dataObj.tradeDiscount == '') ? 0 : tdAmt.trucateNum(),
                    //Inv_Source: ((dataObj.invSource == undefined) ? 0 : (dataObj.invSource.toUpperCase() == "MOBILE" ? 2 : (dataObj.invSource.toUpperCase() == "WEB" ? 1 : 0)))
                    Inv_Source: ((dataObj.invSource == undefined) ? '0' : dataObj.invSource.toUpperCase())
                }, {
                    where: {
                        Draft_Bill_ID: dataObj.draftBillID
                    }
                })
                .then(result => {
                    return result.Draft_Bill_ID
                })
                .catch((error) => {
                    // console.log('error', error)
                    throw error;
                });
            console.log('billDraftID------>', dataObj.draftBillID)
            return dataObj.draftBillID;
        } catch (error) {
            throw error;
        }
    }
    async validateGLAmount(invAdditionalAmt, invBaseAmt, lrList) {
        try {
            let glData = await db.glCode.findAll({
                raw: true,
                where: {
                    Gl_Name: 'Additional',
                    IsActive: 1
                },
                attributes: ["Gl_code"]
            })

            var glAdditionalData = _.map(glData, function (l) {
                return l.Gl_code
            })
            var sumAdditional = 0,
                sumBase = 0;
            var commonFuncs = new CommonFuncs()

            if (lrList.length > 0) {

                for (var j = 0; j < lrList.length; j++) {
                    var d1 = glAdditionalData.filter(value => value.includes(lrList[j].glNumber))

                    if (d1.length) {
                        sumAdditional += (await commonFuncs.converToNumber(lrList[j].amount)).trucateNum()
                    } else
                        sumBase += (await commonFuncs.converToNumber(lrList[j].amount)).trucateNum()
                }
            }
            var validationMsg = '';
            var addAmt = await commonFuncs.converToNumber(invAdditionalAmt)
            var baseAmt = await commonFuncs.converToNumber(invBaseAmt)

            console.log('sumAdditional', sumAdditional.trucateNum(), 'invAddAmt', addAmt.trucateNum(), 'sumBase', sumBase.trucateNum(), 'invBaseAmt', baseAmt.trucateNum())

            if (addAmt.trucateNum() != sumAdditional.trucateNum()) {
                validationMsg = '-Total Additional Amount mismatch with BT Calculated(' + sumAdditional.trucateNum() + ')';
            }
            if (baseAmt.trucateNum() != sumBase.trucateNum()) {
                validationMsg += '-Total Base Amount mismatch with BT Calculated(' + sumBase.trucateNum() + ')';
            }
            return validationMsg;
        } catch (error) {
            console.log('validateGLAmount', error)
            throw error;
        }
    }
    async checkDuplicateLRs(lrData) {
        var valMsg = '';
        var dupLRGroup = _(lrData).groupBy(x => x.baseTransactionNumber).pickBy(x => x.length > 1).value(); // in same excel

        console.log(' Object.values(dupLRGroup)', Object.values(dupLRGroup))

        for (var i = 0; i < Object.keys(dupLRGroup).length; i++) {
            console.log('----->', Object.keys(dupLRGroup)[i])
            var dupGlGroup = _(Object.values(dupLRGroup)[i]).groupBy("glNumber").pickBy(x => x.length > 1).value();

            console.log('-----Object.values(dupGlGroup)', Object.values(dupGlGroup)[i])
            for (var j = 0; j < Object.keys(dupGlGroup).length; j++) {

                var dupBTypeGroup = _(Object.values(dupGlGroup)[j]).groupBy("baseTransactionType").pickBy(x => x.length > 1).value();
                console.log('-----Object.values(dupBTypeGroup)', Object.values(dupBTypeGroup)[j])
                for (var k = 0; k < Object.keys(dupBTypeGroup).length; k++) {

                    var dupBDateGroup = _(Object.values(dupBTypeGroup)[k]).groupBy("baseTransactionDate").pickBy(x => x.length > 1).value();
                    console.log('-----Object.values(dupBDateGroup)', Object.values(dupBDateGroup)[k])

                    for (var m = 0; m < Object.keys(dupBDateGroup).length; m++) {
                        console.log('Object.keys(dupBDateGroup)', Object.keys(dupBDateGroup))
                        if (Object.keys(dupBDateGroup).length > 0) { // multiple type date found
                            valMsg += '-Duplicate LRs(' + Object.values(dupBDateGroup)[m][0].baseTransactionNumber + '/' + Object.values(dupBDateGroup)[m][0].glNumber + '/' + Object.values(dupBDateGroup)[m][0].baseTransactionType + '/' + Object.values(dupBDateGroup)[m][0].baseTransactionDate + ') in request.';
                        }
                    }
                }
            }
            if (valMsg != '')
                break;
        }
        return valMsg;
    }
}
let objDraftMemo = new SaveDraftData();
let objValidateInvs = new Validation.CheckValidations()
const saveDraft = async (req, res) => {

    let reqBody = req.body;
    try {
        let badetails = await db.ba.findAll({
            where: {
                isActive: 1,
                ba_id: reqBody[0].baCode,
                ba_group_id: reqBody[0].ba_group_id
            }
        })
        if (badetails.length <= 0) {
            res.status(200).send(apiResponse.successFormat(`fail`, `Ba not found`, '', []));
            return;
        }

        // for (var i = 0; i < reqBody.length; i++) {
        let reqObj = reqBody[0];
        let draftBillID;
        let allLrDetails = '';
        //-----------------------Validations---------------S----//
        var commonFuncs = new CommonFuncs()

        var valMsg = '';

        if (reqObj.event == "UPD") {
            if (reqObj.draftBillID == undefined || reqObj.draftBillID == '' || reqObj.draftBillID == null)
                valMsg += '-Invoice Id not present';
        }
        await Promise.all([objValidateInvs.checkInvoiceExistUpdate(reqObj.invNumber, reqObj.ba_group_id, ((reqObj.event == "CRE") ? 0 : reqObj.draftBillID)), objValidateInvs.checkInvDate(reqObj.invDate), objValidateInvs.validateGST(reqObj.cgst, reqObj.sgst, reqObj.igst, reqObj.billingFromCode, reqObj.billingToCode), objValidateInvs.checkHSNCode(reqObj.hsnCode), objValidateInvs.checkForBlank(reqObj.comments, '-Comments cannot be blank'), objValidateInvs.checkForBlank(reqObj.customerName, '-Customer Name cannot be blank'), objValidateInvs.checkValidAmt(reqObj.baseAmount, '-Invalid Base amount'), objValidateInvs.checkValidAmt(reqObj.additionalAmount, '-Invalid Addtional amount'), objValidateInvs.checkValidAmt(reqObj.tradeDiscount, '-Invalid Trade Discount amount'), objValidateInvs.checkValidAmt(reqObj.igst, '-Invalid IGST amount'), objValidateInvs.checkValidAmt(reqObj.cgst, '-Invalid CGST amount'), objValidateInvs.checkValidAmt(reqObj.sgst, '-Invalid SGST amount'), objValidateInvs.checkValidAmt(reqObj.amount, '-Invalid total amount'), objValidateInvs.checkValidAmt(reqObj.otherCharges, '-Invalid other charges amount'), objValidateInvs.checkAmt(reqObj.baseAmount, '-BaseAmount cannot be 0 or blank'), objValidateInvs.checkServiceCategoryName(reqObj.serviceName), objValidateInvs.checkTotalAmt(reqObj.igst, reqObj.sgst, reqObj.cgst, reqObj.baseAmount, reqObj.additionalAmount, reqObj.tradeDiscount, reqObj.amount)]).then(function (values) {

            values.forEach(function (item, index, array) {
                valMsg += (item.validationMsg == undefined) ? '' : item.validationMsg;
            })
        });

        if (valMsg != '') {
            res.status(200).send(apiResponse.successFormat(`fail`, valMsg, [], []))
            return;
        } else {

            if ((reqObj.baseTransactions == undefined && (reqObj.isPO == 0 || reqObj.isPO == undefined)) || reqObj.files == undefined)
                valMsg += '-Files or LR details not found.'
            else {
                if (reqObj.files.length <= 0)
                    valMsg += '-Files not found.'
                else {
                    var invfile = reqObj.files.filter(function (item) {
                        return item.fileType === 'Invoice';
                    });
                    var invfile = reqObj.files.filter(function (item) {
                        return item.fileType === 'Invoice';
                    });
                    if (invfile.length <= 0)
                        valMsg += '-Invoice Copy not uploaded.'
                }
                if (reqObj.isPO == 0 || reqObj.isPO == undefined) {
                    if (reqObj.baseTransactions.length <= 0)
                        valMsg += '-LR details not found.'
                    else {
                        valMsg += await objDraftMemo.validateGLAmount(reqObj.additionalAmount, reqObj.baseAmount, reqObj.baseTransactions)
                    }
                }
            }
            if (valMsg != '') {
                res.status(200).send(apiResponse.successFormat(`fail`, valMsg, [], []))
                return;
            } else {
                console.log('Event ', reqObj.event, 'Bill Id to be updated ', reqObj.draftBillID)

                if (reqObj.isPO == 0 || reqObj.isPO == undefined) {
                    //----------------Base Trans Validations----S-------------------//
                    var draftBillId = (reqObj.draftBillID == undefined || reqObj.draftBillID == '' || reqObj.draftBillID == null) ? 0 : reqObj.draftBillID;
                    for (var i = 0; i < reqObj.baseTransactions.length; i++) {

                        await Promise.all([objValidateInvs.checkLRExists(reqObj.baseTransactions[i]["baseTransactionNumber"], reqObj.baseTransactions[i]["glNumber"], reqObj.baseTransactions[i]["baseTransactionDate"], reqObj.baseTransactions[i]["baseTransactionType"], draftBillId), objValidateInvs.checkAmt(reqObj.baseTransactions[i]["amount"], '-LR Amount cannot be blank,0 or less.'), objValidateInvs.checkGLMaster(reqObj.baseTransactions[i]["glNumber"])]).then(function (values) {
                            values.forEach(function (item, index, array) {
                                valMsg += item.validationMsg;
                            })
                        });
                    }
                    valMsg += await objDraftMemo.checkDuplicateLRs(reqObj.baseTransactions)
                    if (valMsg != '') {
                        res.status(200).send(apiResponse.successFormat(`fail`, valMsg, [], []))
                        return;
                    }
                }
            }
            if (reqObj.isPO == 0 || reqObj.isPO == undefined) {
                console.log('<--------checking in SAP---------->')
                var allLRs = _.map(reqObj.baseTransactions, function (l) {
                    return l.baseTransactionNumber
                }).join(',');

                console.log('LRs', allLRs)

                var objBaseTransData = new BaseTrans.BaseTransData()
                allLrDetails = await objBaseTransData.getAllBaseTransactions(allLRs, reqBody[0].baCode);
                console.log('allLrDetails', allLrDetails)

                let ioCustPan = '';

                _.forEach(reqObj.baseTransactions, (fl, key) => {

                    var baseTransDate = '';
                    if (moment(fl.baseTransactionDate, "DD-MMM-YYYY", true).isValid())
                        baseTransDate = moment(fl.baseTransactionDate, 'DD-MMM-YYYY').format('YYYY-MM-DD');
                    else
                        baseTransDate = moment(fl.baseTransactionDate).format('YYYY-MM-DD');

                    let lrFound = allLrDetails.filter(function (l) {
                        return (l.baseTransactionNumber == fl.baseTransactionNumber && l.glNumber == fl.glNumber && l.baseTransactionDate == baseTransDate && l.baseTransactionType == fl.baseTransactionType);
                    });
                    console.log(fl.baseTransactionNumber, '/', fl.glNumber, '/', baseTransDate, '/', fl.baseTransactionType, ' Lr in SAP-->', lrFound)

                    if (lrFound == undefined)
                        valMsg += "LR(" + fl.baseTransactionNumber + "/" + fl.glNumber + ") not found";
                    else {
                        if (lrFound.length == 1) {
                            if (lrFound[0].cust_pan == null || lrFound[0].cust_pan == '' || lrFound[0].cust_pan == undefined)
                                valMsg += "No customer found for LR(" + lrFound[0].baseTransactionNumber + "/" + lrFound[0].glNumber + ")";
                            else {
                                if (key == 0)
                                    ioCustPan = lrFound[0].cust_pan
                                else {
                                    if (ioCustPan != lrFound[0].cust_pan)
                                        valMsg += 'LRs found with Multiple customers';
                                }
                                if (reqObj.event == "CRE" && (lrFound[0].is_tagged_to_invoice == 1 || lrFound[0].is_tagged_to_invoice == '1'))
                                    valMsg += "LR(" + lrFound[0].baseTransactionNumber + "/" + lrFound[0].glNumber + ") already tagged to other invoice";
                            }
                        } else if (lrFound.length > 1)
                            valMsg += "LR(" + fl.baseTransactionNumber + "/" + fl.glNumber + "/" + fl.baseTransactionNumber + "/" + fl.baseTransactionNumber + ") multiple data found";
                        else
                            valMsg += "LR(" + fl.baseTransactionNumber + "/" + fl.glNumber + ") not found";
                    }
                    console.log('valMsg---', valMsg)
                    if (valMsg != '') {
                        return false;
                    }
                });
                if (valMsg != '') {
                    res.status(200).send(apiResponse.successFormat(`fail`, valMsg, [], []))
                    return;
                }
            }
        }
        //----------------Base Trans Validations----E-------------------//
        //--------------Validation-----------------E-------------//        
        console.log('isPO ===========>', reqObj.isPO)

        if (reqObj.event == "CRE") {

            console.log('Invoice Creation')

            draftBillID = await objDraftMemo.saveDraftInvData(reqObj);
            console.log('billDraftID', draftBillID)

            if (reqObj.files != null && reqObj.files.length > 0) {
                console.log('files', reqObj.files, 'length-->', reqObj.files.length)
                let billDraftFileID = await objDraftMemo.saveDraftFileData(reqObj.files, draftBillID);
            }

            if (reqObj.baseTransactions != null && reqObj.baseTransactions.length > 0 && (reqObj.isPO == 0 || reqObj.isPO == undefined)) {
                console.log('baseTransactions length-->', reqObj.baseTransactions.length)

                await objDraftMemo.saveDraftBaseTransMapping(reqObj.baseTransactions, draftBillID, allLrDetails);
            }
        } else {

            console.log('Invoice Updation')

            if (reqObj.files != null && reqObj.files.length > 0) {
                await db.draftfildetails.destroy({
                    where: {
                        Draft_Bill_Details_ID: reqObj.draftBillID
                    }
                })
                let billDraftFileID = await objDraftMemo.saveDraftFileData(reqObj.files, reqObj.draftBillID);
            }
            if (reqObj.removedFiles != null && reqObj.removedFiles.length > 0) {

                _.forEach(reqObj.removedFiles, async (fl, key) => {
                    let filePath = fl.filePath

                    if (!(fl.draftBillFileID == '' || fl.draftBillFileID == null || fl.draftBillFileID == undefined)) {
                        db.draftfildetails.destroy({
                            where: {
                                Draft_Bill_File_Id: fl.draftBillFileID
                            }
                        })
                        if (fs.existsSync(`${__basedir}/public/uploads/${filePath}`)) {
                            await filesClass.deleteFile(`${__basedir}/public/uploads/${filePath}`)
                        }
                    }
                })
            }
            if (reqObj.baseTransactions != null && reqObj.baseTransactions.length > 0 && (reqObj.isPO == 0 || reqObj.isPO == undefined)) {
                var unTaggingLRs = await db.draftbaseTransMapping.findAll({
                    where: {
                        Draft_Bill_Details_ID: reqObj.draftBillID
                    },
                    attributes: [
                        ['Base_Transaction_Number', 'baseTransactionNumber'],
                        ['gl_number', 'glNumber']
                    ]
                })
                console.log('unTagLRs', unTaggingLRs)
                await db.draftbaseTransMapping.destroy({
                    where: {
                        Draft_Bill_Details_ID: reqObj.draftBillID
                    }
                })
                await objBaseTrans.unTagLRToInvoice(unTaggingLRs);

                console.log('TagLRs', reqObj.baseTransactions)
                await objDraftMemo.saveDraftBaseTransMapping(reqObj.baseTransactions, reqObj.draftBillID, allLrDetails);
            }
            draftBillID = await objDraftMemo.updateDraftInvData(reqObj);
            console.log('billDraftID', draftBillID)
        }
        let results = {
            draftBillID: draftBillID
        };
        res.status(200).send(apiResponse.successFormat(`success`, `Data Saved Successfully`, results, []))
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
    SaveDraftData,
    saveDraft
}