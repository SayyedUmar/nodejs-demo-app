var workbook = new Excel.Workbook()
const accData = require(`./getBillsAccounts`)

const exportToExcelAcc = async (req, res) => {
    try {
        const reqQuery = req.query
        let data = await accData.getAllAccBills(reqQuery.roleId, reqQuery.userId, reqQuery.postingFromDate, reqQuery.postingEndDate, reqQuery.vertical, reqQuery.location, reqQuery.krDocNum, reqQuery.isNonTaxable, reqQuery.billIDs, reqQuery.commercialId, '', '', reqQuery.itemsPerPage, reqQuery.pageNo, reqQuery.isAllowPagination, reqQuery.allowAllInvoice)

        console.log('invDetails', data)
        workbook.xlsx.readFile('public/uploads/templates/AccountsData_Template.xlsx')
            .then(function () {
                var dataSheet = workbook.getWorksheet("Invoices")

                _.forEach(data.billDetails, function (k, i) {
                    var row = dataSheet.getRow(i + 2);
                    row.getCell(1).value = k.baName;
                    row.getCell(2).value = k.baGSTCode;
                    row.getCell(3).value = k.billNo;
                    row.getCell(4).value = k.postingDate;
                    row.getCell(5).value = k.krNumber;
                    row.getCell(6).value = k.approvedByName;
                    row.getCell(7).value = k.gst;
                    row.getCell(8).value = k.locationName;
                    row.getCell(9).value = k.invoiceAmount;
                    row.getCell(10).value = moment(k.billdate).format('DD-MMM-YYYY'); //k.billdate;
                    row.getCell(11).value = k.hsn_code;
                    row.getCell(12).value = k.accountReason;
                    row.getCell(13).value = k.taxReason;
                    row.getCell(14).value = k.Commercial_Reason == "OK" ? 'Resolved' : ''
                    row.commit();
                    //BA_Name BA code Inv number Posting Date KR Number Commercial Name Tax Profit center Invoice Amount Verification

                })
                let fileName = ''
                if (reqQuery.allowAllInvoice == '1')
                    fileName = 'All_Invoices.xlsx';
                else
                    fileName = 'Pending_Invoices.xlsx';

                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader("Content-Disposition", "attachment; filename=" + fileName);
                workbook.xlsx.write(res).then(function () {
                    res.end();
                });
            }).catch((errr) => {
                console.log("catch in createTemplateOfLR", errr)
            })

    } catch (err) {
        console.log('Error while Export Excel', err)
        const errorObj = {
            code: `err_001`,
            message: errorCode.err_001
        }
        res.status(400).send(apiResponse.errorFormat(`fail`, `Failed to Export Excel`, errorObj, []));
    }
}
module.exports = {
    exportToExcelAcc
};