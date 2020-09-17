var workbook = new Excel.Workbook()
class BaseTransData {
    async getAllBaseTransactions(reqQuery, ba_code) {
        return new Promise((resolve, reject) => {

            console.log('reqQuery', reqQuery)

            var itemsPerPg = 0;
            var pgNo = 0;

            var lrUniqueIds = ''
            if (reqQuery.flag != 'SelectALL') {
                lrUniqueIds = reqQuery.lrIds;
            }

            let url = `http://${process.env.BA_PORTAL_URL}/api/v1/sap/getBaseTransaction?lrNumbers=${reqQuery.lrNumbers}&serviceType=${reqQuery.serviceType}&baCode=${ba_code}&fromDate=${reqQuery.fromDate}&toDate=${reqQuery.toDate}&lrIds=${lrUniqueIds}&nPerPage=${itemsPerPg}&pageNo=${pgNo}&flag=${reqQuery.flag}`
            //let url = `http://localhost:8081/api/v1/sap/getBaseTransaction?lrNumbers=${reqQuery.lrNumbers}&serviceType=${reqQuery.serviceType}&baCode=${ba_code}&fromDate=${reqQuery.fromDate}&toDate=${reqQuery.toDate}&lrIds=${reqQuery.lrIds}&nPerPage=${itemsPerPg}&pageNo=${pgNo}&flag=${reqQuery.flag}`
            if (ba_code != null) {

                try {
                    request.get({
                            headers: {
                                "content-type": `application/json`
                            },
                            url: url,
                            json: true
                        },
                        (err, res, body) => {
                            if (err) {
                                console.log("getAllBaseTransactions Error", err);
                                reject(err);
                            } else {
                                console.log("statusCode Error", res.statusCode);
                                if (res.statusCode == 200) {
                                    let resData = {
                                        totalCnt: res.body.totalRows,
                                        lrList: res.body.lrs
                                    }
                                    resolve(resData);
                                } else {
                                    resolve(null);
                                }

                            }
                        }
                    );
                } catch (error) {
                    console.log("getAllBaseTransactions catch", err);
                    reject(error);
                }
            }
        })
    }
}
const exportBaseTransactions = async (req, res) => {
    var objBaseTransData = new BaseTransData();
    try {

        let baDetails = await db.ba.findOne({
            raw: true,
            where: {
                ba_id: req.query.baCode
            },
            attributes: ['ba_code']
        })
        console.log('baDetails', baDetails)

        if (baDetails) {
            if (baDetails.length <= 0) {
                let resp = errorResponse(apiResponse.errorFormat(`fail`, `BA not found`, {}, [errorObj], 400))
                res.status(400).send(resp)
                return;
            }
        }
        var data = await objBaseTransData.getAllBaseTransactions(req.query, baDetails.ba_code);

        console.log('data----------->', data.totalCnt)
        if (data.totalCnt > 0) {
            console.log('IN--------------->')
            workbook.xlsx.readFile('public/uploads/templates/Invoice_Template-Copy.xlsx')
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
                            formulae: ["'Service Category'!A2:A81"]
                        };
                    }
                    _.forEach(data.lrList, function (k, i) {
                        let baseTransDate = moment((k.baseTransactionDate).toString()).format('DD-MMM-YYYY');

                        var row = lrSheet.getRow(i + 2);
                        row.getCell(4).value = k.lrNumber;
                        row.getCell(5).value = k.glNumber;
                        row.getCell(6).value = k.glDescription;
                        row.getCell(7).value = k.baseTransactionType;
                        row.getCell(8).value = baseTransDate.toString();
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
        } else {
            let resp = errorResponse(apiResponse.errorFormat(`fail`, `No data found`, {}, [], 400))
            res.status(400).send(resp)
            return;
        }
    } catch (error) {
        console.log("Error in exportBaseTransactions", error)
    }
}
module.exports = {
    exportBaseTransactions
}