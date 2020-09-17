const CommonFuncs = require('../commonFunctions');
var BaseTrans = require('../lrData/getBaseTransactions')

Number.prototype.trucateNum = function () {
    var truncated = Math.floor(this * 100) / 100;
    return truncated;
}
class CheckValidations {

    async checkServiceCategoryName(serviceCatName) {
        let result = {
            isValidated: true,
            validationMsg: ''
        };

        try {
            if (serviceCatName == undefined || serviceCatName == '' || serviceCatName == null) {
                result.validationMsg = '-Service Category should not be blank.';
            } else {

                let isServiceCatExist = await db.serviceCategory.findOne({
                    where: {
                        Service_Name: serviceCatName,
                        IsActive: 1
                    }
                })
                if (isServiceCatExist) {
                    if (isServiceCatExist.length <= 0)
                        result.validationMsg = '-Service Category not present in master.';
                } else
                    result.validationMsg = '-Service Category not present in master.';
            }
        } catch (error) {
            result = {
                isValidated: false,
                validationMsg: error
            }
        }
        return result;
    }
    async checkInvDate(invDate) {

        let result = {
            isValidated: true,
            validationMsg: ''
        }
        try {
            let firstDate = new Date(invDate),
                secondDate = new Date(moment().format('YYYY-MM-DD'));

            if (secondDate > firstDate) {

                let invoiceDateLimit = Config.invoiceDateLimitInDays;

                let timeDifference = Math.abs(secondDate.getTime() - firstDate.getTime()) + 1;
                let differencetDays = Math.ceil(timeDifference / (1000 * 3600 * 24));
                if (differencetDays > invoiceDateLimit) {
                    result.isValidated = true, result.validationMsg = '-Invoice Date should not be less than ' + invoiceDateLimit + ' Days.';
                }
            }
        } catch (error) {
            result = {
                isValidated: false,
                validationMsg: error
            }
            console.log('checkInvDate', error)
        }
        return result;
    }
    async validateGST(cgst, sgst, igst, fromStateCode, toStateCode) {
        let result = {
            isValidated: true,
            validationMsg: ''
        }
        try {
            if (!(cgst == 0 && sgst == 0 && igst == 0)) {

                if (fromStateCode == toStateCode) {
                    if (cgst == '' || cgst == 0 || sgst == '' || sgst == 0) {
                        result.validationMsg = '-CGST and SGST is mandatory.', result.isValidated = true;
                    } else if (cgst != sgst) {
                        result.validationMsg = '-CGST should be same as SGST.', result.isValidated = true;
                    } else {
                        if (igst > 0)
                            result.validationMsg = '-IGST not applicable.', result.isValidated = true;
                    }
                } else {
                    if (igst == '')
                        result.validationMsg = '-IGST is mandatory.', result.isValidated = true;
                    else {
                        if (cgst > 0 || sgst > 0) {
                            result.validationMsg = '-CGST/SGST not applicable.', result.isValidated = true;
                        }
                    }
                }
            }
        } catch (error) {
            result = {
                isValidated: false,
                validationMsg: error
            }
            console.log('validateGST', error)
        }
        return result;
    }
    async checkHSNCode(hsnCodeString) {
        let result = {
            isValidated: false,
            validationMsg: ''
        }
        try {
            if (hsnCodeString == undefined)
                result.validationMsg = '-HSN Code is blank.';
            else if (_.isEmpty(hsnCodeString.toString().trim()))
                result.validationMsg = '-HSN Code is blank.';
            else {
                var hsnCodes = hsnCodeString.toString().split(',');
                result.isValidated = true, result.validationMsg = '';

                for (var i = 0; i < hsnCodes.length; i++) {
                    var element = hsnCodes[i]
                    if (element.length < 4 || element.length > 8) {
                        result.isValidated = true,
                            result.validationMsg = '-HSN Code should be of 4-8 digits.';
                        break;
                    }
                }
            }
        } catch (error) {
            result = {
                isValidated: false,
                validationMsg: error
            }
            console.log('checkHSNCode', error)
        }

        return result;
    }
    async checkLRCountPerInvoice(invoiceNum, lrData) {

        let lrCountPerInv = Config.LRCountPerInvoice;

        let result = {
            isValidated: false,
            validationMsg: ''
        }

        try {
            let lrCount = lrData.filter(value => value.Invoice_number == invoiceNum).length;

            if (lrCount > lrCountPerInv) {
                result.isValidated = true, result.validationMsg = '-LR limit per invoice is exceeded.';
            } else if (lrCount <= 0) {
                result.isValidated = true, result.validationMsg = '-Atleast one LR mandatory';
            }
        } catch (error) {
            result = {
                isValidated: false,
                validationMsg: error
            }
            console.log('checkLRCountPerInvoiceerror', error)
        }
        return result;
    }
    async checkInvoiceExist(invoiceNum, baGroupId) {

        let result = {
            isValidated: true,
            validationMsg: ''
        }

        try {
            if (invoiceNum == undefined || invoiceNum == '' || invoiceNum == null) {
                result.validationMsg = '-Invalid Invoice number.';
                return result
            } else if (invoiceNum.toString().length > 16) {
                result.validationMsg = '-Invoice number length shouldn`t be greater than 16 characters.';
                return result
            }

            if (/^[a-zA-Z0-9-/]*$/.test(invoiceNum) == false) {
                result.validationMsg = '-Invalid Invoice number.';
                return result
            }
            var commonFuncs = new CommonFuncs();
            var fiscalYears = await commonFuncs.getFiscalYear();

            let IsInvExist = await db.sequelize.query(`CALL SP_ChckIsInvoiceNumExists(:invNumber,:baCode,:startDate,:endDate)`, {
                replacements: {
                    invNumber: invoiceNum,
                    baCode: baGroupId,
                    startDate: fiscalYears.startDate,
                    endDate: fiscalYears.endDate
                }
            });
            var arr = IsInvExist;

            if (arr[0].IsInvExists == '1') {
                result.validationMsg = '-Invoice already exists.';
            }
        } catch (error) {
            result.isValidated = false;
            result.validationMsg = error;
            console.log('checkInvoiceExist', error)
        }
        return result;
    }
    async checkInvoiceExistUpdate(invoiceNum, baGroupId, draftBillId) {

        let result = {
            isValidated: true,
            validationMsg: ''
        }

        try {
            if (invoiceNum == undefined || invoiceNum == '' || invoiceNum == null) {
                result.validationMsg = '-Invalid Invoice number.';
                return result
            } else if (invoiceNum.toString().length > 16) {
                result.validationMsg = '-Invoice number length shouldn`t be greater than 16 characters.';
                return result
            }

            if (/^[a-zA-Z0-9-/]*$/.test(invoiceNum) == false) {
                result.validationMsg = '-Invalid Invoice number.';
                return result
            }

            var commonFuncs = new CommonFuncs();
            var fiscalYears = await commonFuncs.getFiscalYear();

            let IsDraftInvExist = await db.draftBills.findAll({
                raw: true,
                where: {
                    Draft_Bill_ID: {
                        [Sequelize.Op.notIn]: [draftBillId]
                    },
                    BillNo: invoiceNum,
                    status: {
                        [Sequelize.Op.notIn]: ["C"]
                    },
                    UpdatedOn: {
                        [Sequelize.Op.lte]: new Date(moment(fiscalYears.endDate, 'YYYY-MM-DD')),
                        [Sequelize.Op.gte]: new Date(moment(fiscalYears.startDate, 'YYYY-MM-DD'))
                    }
                },
                attributes: ["BillNo", "MemoID", "Draft_Bill_ID"],
                include: [{
                    model: db.ba,
                    required: true,
                    attributes: [],
                    where: {
                        ba_group_id: baGroupId
                    }
                }]
            })
            console.log('IsDraftInvExist---->', IsDraftInvExist)

            let IsInvExist = await db.billDetails.findAll({
                raw: true,
                where: {
                    BillDetails_ID: {
                        [Sequelize.Op.notIn]: [draftBillId]
                    },
                    BillNo: invoiceNum,
                    status: {
                        [Sequelize.Op.notIn]: ["C"]
                    },
                    UpdatedOn: {
                        [Sequelize.Op.lte]: new Date(moment(fiscalYears.endDate, 'YYYY-MM-DD')),
                        [Sequelize.Op.gte]: new Date(moment(fiscalYears.startDate, 'YYYY-MM-DD'))
                    }
                },
                attributes: ["BillNo", "MemoID", "BillDetails_ID"],
                include: [{
                    model: db.ba,
                    required: true,
                    attributes: [],
                    where: {
                        ba_group_id: baGroupId
                    }
                }]
            })
            console.log('IsInvExist---->', IsInvExist)

            if (IsDraftInvExist.length > 0 || IsInvExist.length > 0)
                result.validationMsg = '-Invoice already exists.';

        } catch (error) {
            result.isValidated = false;
            result.validationMsg = error;
            console.log('checkInvoiceExistUpdate', error)
        }
        return result;
    }
    async getDuplicateInvoice(invData) {
        var duplicateInvs = _(invData).groupBy(x => x.Invoice_number).pickBy(x => x.length > 1).keys().value();
        return duplicateInvs;
    }
    async checkGLMaster(GlCode) {

        let result = {
            isValidated: true,
            validationMsg: ''
        };
        try {
            if (GlCode == undefined || GlCode == '' || GlCode == null) {
                result.validationMsg = '-GL Number should not be blank.';
            } else {
                let isGLExist = await db.glCode.findAll({
                    where: {
                        Gl_code: GlCode,
                        IsActive: 1
                    }
                })
                if (isGLExist) {
                    if (isGLExist.length <= 0)
                        result.validationMsg = '-GL Number not present in master.';
                } else
                    result.validationMsg = '-GL Number not present in master.';
            }
        } catch (error) {
            result = {
                isValidated: false,
                validationMsg: error
            }
            console.log('checkGLMaster', error)
        }
        return result;
    }
    async checkGLAmount(invData, lrList) {
        let result = {
            isValidated: true,
            validationMsg: ''
        }
        try {
            let glData = await db.glCode.findAll({
                where: {
                    Gl_Name: 'Additional',
                    IsActive: 1
                },
                attributes: ["Gl_code"]
            })

            var glAdditionalData = _.map(glData, function (l) {
                return l.dataValues.Gl_code
            })

            var invLrList = lrList.filter(value => value.Invoice_number == invData.Invoice_number);

            var sumAdditional = 0,
                sumBase = 0;

            if (invLrList.length > 0) {

                _.forEach(invLrList, f => {
                    var d1 = glAdditionalData.filter(value => value.includes(f.GL_Number))
                    console.log('d2', d1)
                    if (d1.length) {
                        sumAdditional += ((f.Amount == undefined) || f.Amount == '') ? 0 : f.Amount;
                    } else
                        sumBase += ((f.Amount == undefined) || f.Amount == '') ? 0 : f.Amount;
                })
            }
            var commonFuncs = new CommonFuncs();

            var validationMsg = '';
            var invAdditionalAmt = 0;
            if (!(invData["Additonal_Amount"] == undefined || invData["Additonal_Amount"] == null || invData["Additonal_Amount"] == ''))
                invAdditionalAmt = await commonFuncs.converToNumber(invData["Additonal_Amount"]);

            var invBaseAmt = 0;
            if (!(invData["Base_Amount"] == undefined || invData["Base_Amount"] == null || invData["Base_Amount"] == ''))
                invBaseAmt = await commonFuncs.converToNumber(invData["Base_Amount"]);

            if (invAdditionalAmt.trucateNum() != sumAdditional.trucateNum()) {
                validationMsg = '-Additional Amount mismatch with BT Calculated(' + sumAdditional.trucateNum() + ')';
            }
            if (invBaseAmt.trucateNum() != sumBase.trucateNum()) {
                validationMsg += '-Base Amount mismatch with BT Calculated(' + sumBase.trucateNum() + ')';
            }
            result.validationMsg = validationMsg;
        } catch (error) {
            result.isValidated = false;
            result.validationMsg = error;
            console.log('checkGLAmount', error)
        }
        return result;
    }
    async checkTotalAmt(igst, sgst, cgst, baseAmont, addAmount, tdAmount, invTotalAmount) {
        let result = {
            isValidated: true,
            validationMsg: ''
        }
        try {
            var commonFuncs = new CommonFuncs();
            let igstAmt = await commonFuncs.converToNumber(igst)
            let cgstAmt = await commonFuncs.converToNumber(cgst)
            let sgstAmt = await commonFuncs.converToNumber(sgst)
            let baseAmt = await commonFuncs.converToNumber(baseAmont)
            let addAmt = await commonFuncs.converToNumber(addAmount)
            let tdAmt = await commonFuncs.converToNumber(tdAmount)
            let invTotalAmt = await commonFuncs.converToNumber(invTotalAmount)

            var totalAmt = 0;
            totalAmt = (igstAmt.trucateNum() + cgstAmt.trucateNum() + sgstAmt.trucateNum() + baseAmt.trucateNum() + addAmt.trucateNum() - tdAmt.trucateNum());

            console.log('igst', igstAmt.trucateNum(), 'cgstAmt', cgstAmt.trucateNum(), 'sgstAmt', sgstAmt.trucateNum(), 'baseAmt', baseAmt.trucateNum(), 'addAmt', addAmt.trucateNum(), 'tdAmt', tdAmt.trucateNum())
            console.log('invTotalAmt', invTotalAmt.trucateNum(), 'totalAmt', totalAmt.trucateNum())

            if (invTotalAmt.trucateNum() != totalAmt.trucateNum())
                result.validationMsg += '-Total amt mismatched with calculated amt(' + totalAmt.trucateNum() + ')';

        } catch (err) {
            result.isValidated = false;
            result.validationMsg = err;
            console.log('checkTotalAmt', error)
        }
        return result;
    }
    async checkForBlank(value, validationMsg) {

        let result = {
            isValidated: true,
            validationMsg: ''
        }
        try {
            if (value == undefined)
                result.validationMsg = validationMsg;
            else if (_.isEmpty(value.toString().trim()))
                result.validationMsg = validationMsg;

        } catch (error) {
            result.isValidated = false;
            result.validationMsg = error;
            console.log(error)
        }
        return result;
    }
    async checkAmt(value, validationMsg) {
        let result = {
            isValidated: true,
            validationMsg: ''
        }
        try {
            let newValue = 0;
            if (typeof (value) != 'number') {
                if (value != null && value != '' && (!isNaN(value))) {
                    newValue = parseFloat(value);
                }
            } else
                newValue = parseFloat(value);

            if (newValue == 0 || newValue == undefined)
                result.validationMsg = validationMsg;

        } catch (error) {
            result.isValidated = false;
            result.validationMsg = error;
            console.log(error)
        }
        return result;
    }
    async checkValidAmt(value, validationMsg) {
        let result = {
            isValidated: true,
            validationMsg: ''
        }
        try {
            if (typeof (value) != 'number') {
                if (value == null || value == '' || isNaN(value)) {
                    result.validationMsg = validationMsg;
                }
            } else {
                if (parseFloat(value) < 0)
                    result.validationMsg = validationMsg;
            }
        } catch (error) {
            result.isValidated = false;
            result.validationMsg = error;
            console.log(error)
        }
        return result;
    }
    async checkLRExists(lrNum, glNumber, baseTrasnsDate, baseTransType, draftBillId) {


        var transDate = '';
        if (moment(baseTrasnsDate, "DD-MMM-YYYY", true).isValid())
            transDate = moment(baseTrasnsDate, 'DD-MMM-YYYY').format('YYYY-MM-DD');
        else
            transDate = moment(baseTrasnsDate).format('YYYY-MM-DD');

        console.log('lrNum', lrNum, 'glNumber', glNumber, 'baseTrasnsDate', transDate, 'baseTransType', baseTransType)

        let result = {
            isValidated: true,
            validationMsg: ''
        }
        var isExists = false;
        try {
            let isExistDraft = await db.draftbaseTransMapping.findOne({
                raw: true,
                where: {
                    Base_Transaction_Number: lrNum,
                    gl_number: glNumber,
                    Base_Transaction_Date: new Date(transDate), // baseTrasnsDate,
                    Base_Transaction_Type: baseTransType,
                    is_tagged_to_invoice: 1,
                    Draft_Bill_Details_ID: {
                        [Sequelize.Op.notIn]: [draftBillId]
                    }
                },
                attributes: ['ID']
            })
            console.log('isExistDraft', isExistDraft)
            let isExistLR = await db.billBaseTransMapping.findOne({
                raw: true,
                where: {
                    Base_Transaction_Number: lrNum,
                    gl_number: glNumber,
                    Base_Transaction_Date: new Date(transDate), //baseTrasnsDate,
                    Base_Transaction_Type: baseTransType,
                    is_tagged_to_invoice: 1
                },
                attributes: ['ID']
            })
            if (isExistDraft != null || isExistLR != null) {
                isExists = true;
                result.validationMsg = '-LR(' + lrNum + ') mapped to other invoice.';
            }
            console.log('isExistLR', isExistLR)
        } catch (error) {
            result.isValidated = false;
            result.validationMsg = error;
            console.log('checkLRExists', error)
        }
        return result;
    }
    async checkDuplicateLRExcel(lrData) {

        var dupLRGroup = _(lrData).groupBy(x => x.BaseTransaction_Number).pickBy(x => x.length > 1).value(); // in same excel

        console.log(' Object.values(dupLRGroup)', Object.values(dupLRGroup))

        for (var i = 0; i < Object.keys(dupLRGroup).length; i++) {
            console.log('----->', Object.keys(dupLRGroup)[i])
            var dupGlGroup = _(Object.values(dupLRGroup)[i]).groupBy("GL_Number").pickBy(x => x.length > 1).value();

            console.log('-----Object.values(dupGlGroup)', Object.values(dupGlGroup)[i])
            for (var j = 0; j < Object.keys(dupGlGroup).length; j++) {

                var dupBTypeGroup = _(Object.values(dupGlGroup)[j]).groupBy("BaseTransaction_Type").pickBy(x => x.length > 1).value();
                for (var k = 0; k < Object.keys(dupBTypeGroup).length; k++) {

                    var dupBDateGroup = _(Object.values(dupBTypeGroup)[k]).groupBy("BaseTransaction_Date").pickBy(x => x.length > 1).value();
                    for (var m = 0; m < Object.keys(dupBDateGroup).length; m++) {
                        console.log(' Object.values(dupBDateGroup)', Object.values(dupBDateGroup)[m])

                        if (Object.values(dupBDateGroup)[m].length > 0) {

                            console.log("lrnumber1", Object.values(dupBDateGroup)[m][0].BaseTransaction_Number, "glnumber", Object.values(dupBDateGroup)[m][0].GL_Number)
                            console.log("baseTransDate1", Object.values(dupBDateGroup)[m][0].BaseTransaction_Date, "baseType1", Object.values(dupBDateGroup)[m][0].BaseTransaction_Type)

                            await lrData.forEach(function (lr, l) {
                                var val = '';
                                console.log('interation ', l)

                                if (lr['BaseTransaction_Number'] == Object.values(dupBDateGroup)[m][0].BaseTransaction_Number && lr['GL_Number'] == Object.values(dupBDateGroup)[m][0].GL_Number && lr['BaseTransaction_Date'].toString() == Object.values(dupBDateGroup)[m][0].BaseTransaction_Date.toString() && lr['BaseTransaction_Type'] == Object.values(dupBDateGroup)[m][0].BaseTransaction_Type) {

                                    console.log('lrnumber', lr['BaseTransaction_Number'], 'glnumber', lr['GL_Number'])
                                    //console.log('BaseTransaction_Number', Object.values(dupBDateGroup)[m][0].BaseTransaction_Number, 'GL_Number', Object.values(dupBDateGroup)[m][0].GL_Number)
                                    console.log('baseTransDate', lr['BaseTransaction_Date'], 'baseType', lr['BaseTransaction_Type'])
                                    console.log('------------------------------------>')

                                    val += '-Duplicate LRs present in excel.';
                                    lr['Status'] = val;
                                }
                                //console.log('VAl', val)
                            });
                        }
                    }
                }

            }
            console.log('-------End For------')
        }
        console.log('---------> Final lrData', lrData)

        return lrData;
    }
    async chckLRInvoiceExistInInvoiceData(LRMappedinvoiceNum, invData) {
        let result = {
            isValidated: true,
            validationMsg: ''
        }
        try {
            var invMappedCnt = invData.filter(x => x.Invoice_number == LRMappedinvoiceNum).length
            if (invMappedCnt <= 0) {
                result.isValidated = false;
                result.validationMsg = '-Invoice data not present';
            }
        } catch (error) {
            result.isValidated = false;
            result.validationMsg = error;
            //console.log(error)
        }
        return result;
    }
}
class ValidateExcelData {

    async validateExcelData(invData, lrData, fromStateCode, toStateCode, ba_group_id, baCode) {
        var isInValid = false;
        var lrErrCnt = 0;
        var invErrCnt = 0;
        console.log('validateExecelData Starts');
        var objCheckValidations = new CheckValidations();

        if (invData.length > 0) {

            var duplicateInvs = await objCheckValidations.getDuplicateInvoice(invData);

            for (var i = 0; i < invData.length; i++) {

                console.log('invoiceDate', invData[i].Invoice_Date)
                console.log('invoice date', moment(invData[i].Invoice_Date, 'DD-MMM-YYYY').format('YYYY-MM-DD'))

                var valMsg = '';
                if (duplicateInvs.length > 0) {
                    var existsCnt = duplicateInvs.filter(x => x === invData[i].Invoice_number).length

                    if (existsCnt > 0) {
                        valMsg += '-Duplicate invoice number present.'
                    }
                }
                await Promise.all([objCheckValidations.checkInvoiceExist(invData[i].Invoice_number, ba_group_id), objCheckValidations.checkServiceCategoryName(invData[i].Service_Name), objCheckValidations.checkLRCountPerInvoice(invData[i].Invoice_number, lrData), objCheckValidations.checkInvDate(invData[i].Invoice_Date), objCheckValidations.validateGST(invData[i].CGST, invData[i].SGST, invData[i].IGST, fromStateCode, toStateCode), objCheckValidations.checkHSNCode(invData[i].HSN_Code), objCheckValidations.checkForBlank(invData[i].Customer_Name, '-Customer Name is blank.'), objCheckValidations.checkForBlank(invData[i].Comments, '-Comments is blank.'), objCheckValidations.checkValidAmt(invData[i]["Base_Amount"], '-Invalid Base amount'), objCheckValidations.checkValidAmt(invData[i]["Additonal_Amount"], '-Invalid Addtional amount'), objCheckValidations.checkValidAmt(invData[i]["TD"], '-Invalid Trade Discount amount'), objCheckValidations.checkValidAmt(invData[i]["IGST"], '-Invalid IGST amount'), objCheckValidations.checkValidAmt(invData[i]["CGST"], '-Invalid CGST amount'), objCheckValidations.checkValidAmt(invData[i]["SGST"], '-Invalid SGST amount'), objCheckValidations.checkValidAmt(invData[i]["Total_Invoice_Amount"], '-Invalid total amount'), objCheckValidations.checkAmt(invData[i]["Base_Amount"], '-Base Amount cannot be blank,0 or less,'), objCheckValidations.checkGLAmount(invData[i], lrData), objCheckValidations.checkTotalAmt(invData[i].IGST, invData[i].SGST, invData[i].CGST, invData[i].Base_Amount, invData[i].Additonal_Amount, invData[i].TD, invData[i].Total_Invoice_Amount)]).then(function (values) {

                    values.forEach(function (item, index, array) {
                        valMsg += (item.validationMsg == undefined) ? '' : item.validationMsg;
                    })
                });
                invData[i].Status = valMsg

                if (invData[i].Status != null) {
                    if ((isNaN(invData[i].Status.trim()))) //checking if present numbers i.e 1,2..
                        invErrCnt++;
                }
            }
        }
        console.log('-------------Invoice Validation Ends---------------->');

        if (lrData.length > 0) {

            var lrUpdatedData = await objCheckValidations.checkDuplicateLRExcel(lrData)

            var allLRs = _.map(lrUpdatedData, function (l) {
                return l.BaseTransaction_Number
            }).join(',');

            console.log('LRs', allLRs)

            var objBaseTrans = new BaseTrans.BaseTransData()
            var allLrDetails = await objBaseTrans.getAllBaseTransactions(allLRs, baCode)
            console.log('allLrDetails', allLrDetails)

            let ioCheckArr = [];
            let ioCustArr = [];

            for (var i = 0; i < lrUpdatedData.length; i++) {
                var valMsg = '';

                console.log('lrUpdatedData i ---->', i, lrUpdatedData[i])
                await Promise.all([objCheckValidations.checkLRExists(lrUpdatedData[i]["BaseTransaction_Number"], lrUpdatedData[i]["GL_Number"], moment(lrUpdatedData[i]["BaseTransaction_Date"], 'DD-MMM-YYYY').format('YYYY-MM-DD'), lrUpdatedData[i]["BaseTransaction_Type"], 0), objCheckValidations.checkAmt(lrUpdatedData[i]["Amount"], '-LR Amount cannot be blank,0 or less.'), objCheckValidations.chckLRInvoiceExistInInvoiceData(lrUpdatedData[i]["Invoice_number"], invData), objCheckValidations.checkGLMaster(lrUpdatedData[i]["GL_Number"])]).then(function (values) {
                    values.forEach(function (item, index, array) {
                        valMsg += item.validationMsg;
                    })
                });
                let baseTransDate = moment(lrUpdatedData[i]["BaseTransaction_Date"], 'DD-MMM-YYYY').format('YYYY-MM-DD');

                let lrFound = allLrDetails.filter(function (l) {
                    console.log('lrUpdatedData[i]["BaseTransaction_Date"]', lrUpdatedData[i]["BaseTransaction_Date"])
                    console.log('toString()', l.base_transaction_date, 'baseTransDate', baseTransDate)
                    return (l.baseTransactionNumber == lrUpdatedData[i]["BaseTransaction_Number"] && l.glNumber == lrUpdatedData[i]["GL_Number"] && l.base_transaction_date == baseTransDate && l.baseTransactionType == lrUpdatedData[i]["BaseTransaction_Type"]);
                });
                console.log(lrUpdatedData[i]["BaseTransaction_Number"] + '/' + lrUpdatedData[i]["GL_Number"] + ' Lr in SAP-->', lrFound) //+ '/' + baseTransDate + '/' + lrUpdatedData[i]["BaseTransaction_Type"]

                if (lrFound == undefined)
                    valMsg += "-Invalid LR found.";
                else {
                    if (lrFound.length == 1) {
                        if (lrFound[0].is_tagged_to_invoice == 1 || lrFound[0].is_tagged_to_invoice == '1')
                            valMsg += "-LR already tagged to other invoice";
                        else {
                            //--------------IO validatins-------starts--------------//
                            if (lrFound[0].cust_pan == null || lrFound[0].cust_pan == '' || lrFound[0].cust_pan == undefined) {
                                valMsg += "-No customer found";
                            } else {

                                console.log('ioCustArr', ioCustArr.length)
                                if (ioCustArr.length <= 0) {
                                    ioCustArr.push({
                                        invoiceNum: lrUpdatedData[i]["Invoice_number"],
                                        ioCustPan: lrFound[0].cust_pan
                                    })
                                } else {
                                    console.log('ioCustArr---->', ioCustArr)
                                    console.log('INv---------------->', lrUpdatedData[i]['Invoice_number'], 'LR----->', lrUpdatedData[i]["BaseTransaction_Number"], 'ÍO number ---------->', lrFound[0].cust_pan)
                                    var custData = ioCustArr.filter(function (val) {
                                        return val.invoiceNum === lrUpdatedData[i]['Invoice_number'];
                                    });
                                    console.log('invoice exst check------>', custData)

                                    if (custData.length > 0) {
                                        var custCheck = custData.filter(function (val) {
                                            return val.ioCustPan != lrFound[0].cust_pan;
                                        });
                                        console.log('New cust data found------>', custCheck)
                                        if (custCheck.length > 0) {
                                            ioCheckArr.push({
                                                invoiceNum: lrUpdatedData[i]["Invoice_number"],
                                                lrNum: lrUpdatedData[i]["BaseTransaction_Number"],
                                                ioCustPan: lrFound[0].cust_pan
                                            })
                                            valMsg += "-LR of different customer";
                                        }
                                    } else {
                                        ioCustArr.push({
                                            invoiceNum: lrUpdatedData[i]["Invoice_number"],
                                            ioCustPan: lrFound[0].cust_pan
                                        })
                                    }
                                }
                            }
                            console.log('changed Customers-->', ioCheckArr)
                            //--------------IO validatins-------Ends--------------//
                        }
                    } else if (lrFound.length > 1)
                        valMsg += "-Multiple LR data found";
                    else
                        valMsg += "-Invalid LR found";
                }

                lrUpdatedData[i].Status += valMsg;

                if (lrUpdatedData[i].Status != null) {
                    if (isNaN(lrUpdatedData[i].Status.trim()))
                        lrErrCnt++;
                }
            }
            //----------------IO validations----------Starts---------//
            if (ioCheckArr.length > 0) {

                var ioGroup = _(ioCheckArr).groupBy(x => x.invoiceNum).keys().value()
                for (var k = 0; k < invData.length; k++) {
                    var isInvPresent = ioCheckArr.filter(x => x.invoiceNum === invData[k].Invoice_number).length
                    if (isInvPresent > 0) {
                        invData[k].Status += '-LRs found with Multiple customers';
                    }
                }
            }
            //-----------------IO validations----------Ends----------//
        }
        console.log('-------------LR Validation Ends---------------->');

        if (lrErrCnt > 0 || invErrCnt > 0)
            isInValid = true;

        var resData = {
            isInValidExcel: isInValid,
            invalidInvoiceCnt: invErrCnt,
            invalidLRCnt: lrErrCnt,
            excelPath: '',
            excelData: {
                invData: invData,
                lrData: lrUpdatedData
            }
        }
        console.log('isInValidExcel:------->', resData.isInValidExcel)
        return resData;
    }
}
module.exports = {
    CheckValidations,
    ValidateExcelData
};