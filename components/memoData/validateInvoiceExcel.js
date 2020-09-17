var workbook = new Excel.Workbook()
const Validation = require('../validations/invoiceValidations')
var SaveDraftData = require('../memoData/saveDraftDetails')
var BaseTrans = require('../lrData/getBaseTransactions')

class ModifyExcel {
    storeFile(filePath, bufferFile) {
        return new Promise((resolve, reject) => {
            try {
                fs.writeFile(`${filePath}`, bufferFile, {
                    encoding: 'base64'
                }, (err) => {
                    if (err) {
                        return reject(err)
                    }

                    resolve()
                })
            } catch (error) {
                // console.log(`error ${error}`)
                reject(error)
            }
        })
    }

    deleteFile(filePath) {
        return new Promise((resolve, reject) => {
            try {
                fs.unlinkSync(`${filePath}`)
                resolve()
            } catch (error) {
                reject(error)
            }
        })
    }

    createDirectory(folderPath) {
        return new Promise((resolve, reject) => {
            try {
                mkdirp(folderPath, (err) => {
                    if (err) {
                        return reject(err)
                    }

                    resolve()
                })
            } catch (error) {
                // console.log(`err ${error}`)
                reject(error)
            }
        })
    }

    async createInvalidExcel(validatedData, fileName) {
        var finalFilePath = null;
        //console.log('createInvalidExcel-------IN------------->')

        await workbook.xlsx.readFile('public/uploads/batemplates/' + fileName)
            .then(async function () {
                var invoiceSheetId = 1;
                var serviceCategorySheetId = 3;
                var lrsheetId = 2;
                var invoiceSheet = workbook.getWorksheet(invoiceSheetId);
                var serviceCategorySheet = workbook.getWorksheet(serviceCategorySheetId);
                var lrSheet = workbook.getWorksheet(lrsheetId);
                var serviceArr = []

                for (var i = 2; i <= 21; i++) {
                    invoiceSheet.getCell(`D${i}`).dataValidation = {
                        type: 'list',
                        allowBlank: true,
                        //formulae: [`${serviceArr.toString()}`]
                        formulae: ["'Service Category'!A2:A81"]
                    };
                }
                console.log('validatedData.lrData.length', validatedData.lrData.length)
                console.log('validatedData.invData.length', validatedData.invData.length)

                for (var i = 0; i < validatedData.invData.length; i++) {

                    var invRow = i + 2
                    var row = invoiceSheet.getRow(invRow);

                    var singleInv = validatedData.invData.filter(function (item) {
                        //   return item.Invoice_number === row.findCell(2).value
                        return (item.RowId + 1) === invRow //----------sequence on rowid
                    });

                    row.getCell(1).value = singleInv[0].Status;
                    row.commit();
                }
                for (var i = 0; i < validatedData.lrData.length; i++) {

                    var lrRow = i + 2
                    var row2 = lrSheet.getRow(lrRow);

                    var singleLr = validatedData.lrData.filter(function (item) {
                        //return item.BaseTransaction_Number === row.findCell(3).value
                        return (item.RowId + 1) === lrRow
                    });
                    row2.getCell(1).value = singleLr[0].Status;
                    row2.commit();
                }

                let folderPath = `public/uploads/batemplates/` + fileName
                finalFilePath = `batemplates/` + fileName
                await workbook.xlsx.writeFile(folderPath);

            }).catch((errr) => {
                console.log("Error in createInvalidTemplateOfLR", errr)
                throw errr;
            })
        return finalFilePath;
    }

    async objectMap(sourceData, keysMap) {
        var newArray = []
        if (sourceData.length > 0) {

            sourceData.forEach(element => {
                try {
                    var ss = Object.entries(keysMap).reduce((o, [key, newKey]) => {
                        o[newKey] = element[key]
                        return o;
                    }, {})
                    newArray.push(ss);

                } catch (Er) {
                    console.log('Error', Er)
                }
            });
        }
        return newArray;
    }
    async renameParams(memoData, lrData, fromStateCode, toStateCode, baCode) {

        var invkeysMap = {
            "event": "event", //old key:new Key
            "Invoice_number": "invNumber",
            "Invoice_Date": "invDate",
            "Service_Name": "serviceName",
            "Base_Amount": "baseAmount",
            "Additonal_Amount": "additionalAmount",
            "CGST": "cgst",
            "SGST": "sgst",
            "IGST": "igst",
            "TD": "tradeDiscount",
            "HSN_Code": "hsnCode",
            "Customer_Name": "customerName",
            "Comments": "comments",
            "Total_Invoice_Amount": "amount",

            "otherCharges": "otherCharges",
            "reason": "reason",
            "billingToCode": "billingToCode",
            "billingFromCode": "billingFromCode",
            "baCode": "baCode",
            "updatedBy": "updatedBy",
        };

        var lrkeysMap = {
            "Invoice_number": "invNumber", //old key:new Key
            "BaseTransaction_Number": "baseTransactionNumber",
            "GL_Number": "glNumber",
            "BaseTransaction_Type": "baseTransactionType",
            "BaseTransaction_Date": "baseTransactionDate",
            "Amount": "amount"
        };

        var invList, lrList = []

        invList = this.objectMap(memoData, invkeysMap)
        lrList = this.objectMap(lrData, lrkeysMap)

        var invList1 = await invList.then(async function (result) {
            return result
        });

        var lrList1 = await lrList.then(async function (result) {
            return result
        });

        console.log('lrList1', lrList1)

        //------------Need to update--------//
        _.forEach(lrList1, e => {
            e.createdBy = baCode;
        });
        //--------------------//

        _.forEach(invList1, e => {
            e.event = "CRE";
            e.billingFromCode = fromStateCode;
            e.billingToCode = toStateCode;
            e.baCode = baCode
            e.updatedBy = baCode

            var invLrList = lrList1.filter(function (item) {
                return item.invNumber == e.invNumber
            });
            e.baseTransactions = invLrList;
        })

        var successData = {
            invList: invList1
        }
        return successData;
    }
    async saveValidatedDraftData(validatedData, lrData, baCode) {

        try {
            var allLRs = _.map(lrData, function (l) {
                return l.BaseTransaction_Number
            }).join(',');

            console.log('LRs', allLRs)
            var objBaseTrans = new BaseTrans.BaseTransData()

            var allLrDetails = await objBaseTrans.getAllBaseTransactions(allLRs, baCode);
            console.log('allLrDetails', allLrDetails)

            var objDraftMemo = new SaveDraftData.SaveDraftData()
            _.forEach(validatedData.invList, async element => {
                element.invSource = "WEB"; // excel export from web
                var draftBillID = await objDraftMemo.saveDraftInvData(element);

                if (draftBillID) {
                    if (element.files != null && element.files.length > 0) {
                        //for (var j = 0; j < element.files.length; j++) {
                        await objDraftMemo.saveDraftFileData(element.files, draftBillID);
                    }

                    if (element.baseTransactions != null && element.baseTransactions.length > 0) {
                        //for (var k = 0; k < element.baseTransationDetails.length; k++) {                        
                        await objDraftMemo.saveDraftBaseTransMapping(element.baseTransactions, draftBillID, allLrDetails);
                        //}
                    }
                }
            });
        } catch (error) {
            throw error;
        }
    }
}

var objModifyExcel = new ModifyExcel()

const validateExcelFromTemplate = async (req, res) => {
    try {
        // console.log(req.file)
        const file = req.file

        //------------Ba-Code Check---S-------------//
        var baCode, stateCode;
        var valMsg = '';
        db.ba.belongsTo(db.state, {
            foreignKey: 'state_code',
            targetKey: 'State_ID'
        })
        let baData = await db.ba.findOne({
            include: {
                model: db.state,
                required: true,
                attributes: ['State_Code']
            },
            where: {
                ba_group_id: req.query.ba_group_id,
                state_code: req.query.fromStateCode,
                isActive: 1
            },
            attributes: ['ba_id']
        })

        if (baData != null) {
            if (baData.length > 1)
                valMsg += '-Invalid BA found.'
            else {
                baCode = baData.dataValues.ba_id;
                stateCode = baData.dataValues.state.dataValues.State_Code;
            }
        } else
            valMsg += '-BA not found.'

        if (valMsg != '') {
            data = {
                isInValidExcel: false,
                excelPath: '',
                excelData: {}
            }
            res.status(200).send(apiResponse.successFormat(`fail`, valMsg, data, []))
            return;
        }
        //----------------Ba-Code Check--E--------------//

        const timestamp = moment().valueOf()
        const ext = path.extname(file.originalname).toLowerCase()
        const fileName = `${baCode}_${stateCode}${ext}`
        const folderPath = `${__basedir}/public/uploads/batemplates`
        const filePath = `${folderPath}/${fileName}`

        const bufferFile = file.buffer

        // create Directory if not exist for BA
        await objModifyExcel.createDirectory(folderPath)
        // store file on server

        await objModifyExcel.storeFile(filePath, bufferFile)
        const result = excelToJson({
            sourceFile: filePath
        });

        let memoSheet = Object.keys(result)[0]
        let lrSheet = Object.keys(result)[1]

        //-------------Column validations--S------------//
        if (valMsg == '') {
            var invCols = ['STATUS', 'INVOICE_NUMBER', 'INVOICE_DATE', 'SERVICE_NAME', 'BASE_AMOUNT', 'ADDITONAL_AMOUNT', 'CGST', 'SGST', 'IGST', 'TD', 'HSN_CODE', 'CUSTOMER_NAME', 'COMMENTS', 'TOTAL_INVOICE_AMOUNT']
            // var lrCols = ['STATUS', 'INVOICE_NUMBER', 'BASETRANSACTION_NUMBER', 'GL_NUMBER', 'GL_DESCRIPTION', 'AMOUNT']
            var lrCols = ['STATUS', 'INVOICE_NUMBER', 'BASETRANSACTION_NUMBER', 'GL_NUMBER', 'GL_DESCRIPTION', 'BASETRANSACTION_TYPE', 'BASETRANSACTION_DATE', 'AMOUNT']

            var excelInvCols = Object.values(result[memoSheet][0]).map(function (value) {
                return value.toUpperCase();
            })
            var excelLRCols = Object.values(result[lrSheet][0]).map(function (value) {
                return value.toUpperCase();
            })

            if (!(_.difference(invCols, excelInvCols).length === 0))
                valMsg += '-Columns mismatched in invoice sheet.'

            if (!(_.difference(lrCols, excelLRCols).length === 0))
                valMsg += '-Columns mismatched in LR sheet'
        }

        if (valMsg != '') {
            data = {
                isInValidExcel: false,
                excelPath: '',
                excelData: {}
            }
            res.status(200).send(apiResponse.successFormat(`fail`, valMsg, data, []))
            return;
        }
        //-------------Column validations----E----------//

        //-------------Converting excel to json-----//
        const memoData = []
        var memoRowNum = 1;
        _.forEach(result[memoSheet], function (d, i) {
            //if (i > 0 && d['A']) { //-----null handling    
            if (i > 0) {
                var data = {}
                if (d.A == undefined || d.A == '')
                    d.A = '';

                d.A = ''; //--------Removed Excel validations

                if (d.B != undefined && d.B != '') {
                    _.forEach(d, function (d1, k) {
                        if (k == 'A') {
                            data['RowId'] = memoRowNum
                        }
                        data[result[memoSheet][0][k]] = (d1)
                    })
                }
                if (Object.keys(data).length > 0) {
                    memoData.push(data)
                    memoRowNum += 1;
                }
            }
        })
        console.log('memoData', memoData)

        var invLimit = Config.InvoiceCntPerDraft
        if (memoData.length > invLimit) {
            data = {
                isInValidExcel: false,
                excelPath: '',
                excelData: {}
            }
            res.status(200).send(apiResponse.successFormat(`fail`, '-Invoice limit exceed', data, []))
            return;
        }

        const lrData = []
        var lrRowNum = 1;
        _.forEach(result[lrSheet], function (lr, i) {
            //  if (i > 0 && lr['A']) { //-----null handling
            if (i > 0) {
                var data1 = {}
                if (lr.A == undefined || lr.A == '')
                    lr.A = '';

                lr.A = ''; //--------Removed Excel validations

                if (lr.B != undefined && lr.B != '') {
                    _.forEach(lr, function (lr1, k) {
                        if (k == 'A') {
                            data1['RowId'] = lrRowNum
                        }
                        data1[result[lrSheet][0][k]] = (lr1)
                    })
                }
                if (Object.keys(data1).length > 0) {
                    lrData.push(data1)
                    lrRowNum += 1;
                }
            }
        })
        console.log('lrData', lrData)

        let objChckValidations = new Validation.ValidateExcelData()
        var resultData = await objChckValidations.validateExcelData(memoData, lrData, req.query.fromStateCode, req.query.toStateCode, req.query.ba_group_id, baCode);

        if (resultData.isInValidExcel == true) {

            console.log('Invalid Data------>', resultData.excelData.invData)
            var invalidfilePath = await objModifyExcel.createInvalidExcel(resultData.excelData, fileName, req.query.ba_group_id)

            resultData.excelPath = invalidfilePath;
            res.status(200).send(apiResponse.successFormat(`fail`, `Invalid Excel`, resultData, []))
        } else {
            console.log('Valid Data------>')
            var validatedData = await objModifyExcel.renameParams(memoData, lrData, req.query.fromStateCode, req.query.toStateCode, baCode);

            await objModifyExcel.saveValidatedDraftData(validatedData, lrData, baCode);
            res.status(200).send(apiResponse.successFormat(`success`, `Data successfully saved`, resultData, []))
        }

    } catch (error) {
        console.log(`Error in validating excel `, error)
        console.log(`error ${JSON.stringify(error)}`)
        const code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
        const response = errorResponse(error)
        res.status(code).send(response)
    }
}

const createTemplateOfLR = async (req, res) => {
    try {
        let reqBody = req.body;

        if (req.body.length <= 0) {
            res.status(200).send(apiResponse.errorFormat(`fail`, `No Data requested`, {}, []));
            return;
        }

        workbook.xlsx.readFile('public/uploads/templates/Invoice_Template.xlsx')
            .then(function () {
                var invoiceSheetId = 1;
                var serviceCategorySheetId = 3;
                var lrsheetId = 2;
                var invoiceSheet = workbook.getWorksheet(invoiceSheetId);
                var serviceCategorySheet = workbook.getWorksheet(serviceCategorySheetId);
                var lrSheet = workbook.getWorksheet(lrsheetId);
                var serviceArr = []

                for (var i = 2; i <= 21; i++) {
                    invoiceSheet.getCell(`D${i}`).dataValidation = {
                        type: 'list',
                        allowBlank: true,
                        // formulae: [`${serviceArr.toString()}`]
                        formulae: ["'Service Category'!A2:A81"]
                    };

                }
                _.forEach(reqBody.lrList, function (k, i) {
                    //let baseTransDate = moment((k.baseTransactionDate).toString()).format('YYYY-MM-DD');

                    var row = lrSheet.getRow(i + 2);
                    row.getCell(3).value = k.lrNumber;
                    row.getCell(4).value = k.glNumber;
                    row.getCell(5).value = k.glDescription;
                    //  row.getCell(6).value = k.baseTransactionType;
                    row.commit();
                })
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader("Content-Disposition", "attachment; filename=" + 'memo_template.xlsx');
                workbook.xlsx.write(res).then(function () {
                    res.end();
                });
            }).catch((errr) => {
                console.log("catch in createTemplateOfLR", errr)
            })

    } catch (e) {
        console.log("error in createTemplateOfLR", e)
    }
}

module.exports = {
    validateExcelFromTemplate,
    createTemplateOfLR
}