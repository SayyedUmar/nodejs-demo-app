var workbook = new Excel.Workbook()
const getDashboardData = async (req, res) => {
    try {
        var reqQuery = req.query
        var onhold = ''
        var overDue = ''
        if (reqQuery.status) {
            reqQuery.status = reqQuery.status.replace(/IP/g, 'V,B,R')
            onhold = reqQuery.status.indexOf('OH') > -1 ? 'OH' : '';
            overDue = reqQuery.status.indexOf('OD') > -1 ? 'OD' : '';
            reqQuery.status = reqQuery.status.replace(/OH,|,OH|OD,|,OD|OD|OH/g, '')
        }
        let resData = await db.sequelize.query(`CALL SP_getDashboardData(:parentId, :userId , :serviceCode, :locations, :_status, :startDate, :endDate, :billDate,:memoNo, :baName,:billNo, :overDue,:onhold,:_limit , :_offset,:_type,:billIds,:_vertical,:submittedTo)`, {
            replacements: {
                parentId: reqQuery.parentId ? reqQuery.parentId : '',
                userId: reqQuery.userId ? reqQuery.userId : 0,
                serviceCode: reqQuery.serviceCode ? reqQuery.serviceCode : '',
                locations: reqQuery.locations ? reqQuery.locations : '',
                _status: reqQuery.status ? reqQuery.status : '',
                startDate: reqQuery.startDate ? moment(reqQuery.startDate).format('YYYY-MM-DD') : '',
                endDate: reqQuery.endDate ? moment(reqQuery.endDate).format('YYYY-MM-DD') : '',
                billDate: reqQuery.billDate ? moment(reqQuery.billDate).format('YYYY-MM-DD') : '',
                memoNo: reqQuery.memoNo ? reqQuery.memoNo : null,
                baName: reqQuery.baName ? reqQuery.baName : null,
                billNo: reqQuery.billNo ? reqQuery.billNo : null,
                overDue: overDue,
                onhold: onhold,
                _limit: reqQuery.itemsPerPage ? reqQuery.itemsPerPage : 10,
                _offset: ((reqQuery.page ? reqQuery.page : 1) - 1) * (reqQuery.itemsPerPage ? reqQuery.itemsPerPage : 10),
                _type: reqQuery.type ? reqQuery.type : 'Data',
                billIds: reqQuery.billIds ? reqQuery.billIds : '',
                _vertical: reqQuery._vertical ? reqQuery._vertical : '',
                submittedTo: reqQuery.submittedTo ? reqQuery.submittedTo : ''
            },
            type: db.sequelize.QueryTypes.SELECT
        });
        if (!_.isEmpty(resData) && !_.isEmpty(resData[0])) {
            var headerData = {}
            var totalCount = 0
            if (reqQuery.type == 'data') {
                _.forEach(resData[1], h => {
                    totalCount += h.count
                    headerData[h.fullStatus] = h
                })
                res.status(200).send(apiResponse.successFormat(`success`, `Dashboard data fectched successfully`, {
                    headerData,
                    bills: _.toArray(resData[0]),
                    totalCount,
                    page: reqQuery.page ? reqQuery.page : 1,
                    itemsPerPage: reqQuery.itemsPerPage ? reqQuery.itemsPerPage : 10
                }, []))
            } else {
                workbook.xlsx.readFile('public/uploads/templates/dashboardTemplate.xlsx')
                    .then(function () {
                        var billSheet = workbook.getWorksheet(1);
                        _.forEach(_.toArray(resData[0]), function (b, i) {
                            var rowNo = (i + 2)
                            var row = billSheet.getRow(rowNo);
                            row.getCell(1).value = b.status;
                            row.getCell(2).value = b.deviationReason;
                            row.getCell(3).value = b.billNo;
                            row.getCell(4).value = b.age;
                            row.getCell(5).value = b.totalAmount;
                            row.getCell(6).value = b.tds;
                            row.getCell(7).value = b.td;
                            row.getCell(8).value = b.billDate;
                            row.getCell(9).value = b.acknowledgedOn;
                            row.getCell(10).value = b.memoNo;
                            row.getCell(11).value = b.baName;
                            row.getCell(12).value = b.submittionLocation;
                            row.getCell(13).value = b.submitToName;
                            row.getCell(14).value = b.accReason;
                            row.getCell(15).value = b.taxReason;
                            row.getCell(16).value = b.memoDate;
                            row.commit();
                        })
                        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                        res.setHeader("Content-Disposition", "attachment; filename=" + 'bills.xlsx');
                        workbook.xlsx.write(res).then(function () {
                            res.end();
                        });
                    }).catch((errr) => {
                        res.status(200).send(apiResponse.errorFormat(`fail`, `error occurred while downloading excel`, {}, []))
                    })
            }
        } else {
            res.status(200).send(apiResponse.successFormat(`success`, `No data found`, {
                headerData: {},
                bills: [],
                totalCount: 0,
                page: reqQuery.page ? reqQuery.page : 1,
                itemsPerPage: reqQuery.itemsPerPage ? reqQuery.itemsPerPage : 10
            }, []))
        }
    } catch (error) {
        console.log(`error ${JSON.stringify(error)}`)
        const code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
        const response = errorResponse(error)
        res.status(code).send(response)
    }
}

module.exports.getDashboardData = getDashboardData