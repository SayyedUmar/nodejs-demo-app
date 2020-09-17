const invoiceForChecker = async (req, res) => {
    try {
        var reqQuery = req.query
        let locations = await db.userMapping.findAll({
            attributes: ['Location_ID'],
            where: {
                User_ID: reqQuery.userId
            }
        })
        var allLocations = _.map(locations, function (l) {
            return l.dataValues.Location_ID
        })
        if (reqQuery.verifiedBy) {
            var verifiedByWhere = {
                [Op.or]: [{
                    user_name: {
                        [Op.like]: `%${reqQuery.verifiedBy}%`
                    },
                }, {
                    First_Name: {
                        [Op.like]: `%${reqQuery.verifiedBy}%`
                    },
                }, {
                    Last_Name: {
                        [Op.like]: `%${reqQuery.verifiedBy}%`
                    }
                }, {
                    token_id: {
                        [Op.like]: `%${reqQuery.verifiedBy}%`
                    }
                }]
            }

        }
        var assignToWhere = {}
        if (reqQuery.assignTo) {
            assignToWhere = {
                [Op.or]: [{
                    user_name: {
                        [Op.like]: `%${reqQuery.assignTo}%`
                    },
                }, {
                    First_Name: {
                        [Op.like]: `%${reqQuery.assignTo}%`
                    },
                }, {
                    Last_Name: {
                        [Op.like]: `%${reqQuery.assignTo}%`
                    }
                }, {
                    token_id: {
                        [Op.like]: `%${reqQuery.assignTo}%`
                    }
                }]
            }

        }
        if (reqQuery.baName) {
            var baWhere = {
                ba_name: {
                    [Op.like]: `%${reqQuery.baName}%`
                }
            }
        }
        var billWhere = {
            status: 'V'
        }
        if (reqQuery.invoiceNo) {
            billWhere.BillNo = {
                [Op.like]: `%${reqQuery.invoiceNo}%`
            }
        }
        if (reqQuery.billDate) {
            billWhere.BillDate = new Date(reqQuery.billDate)
        }
        if (reqQuery.verifiedOn) {
            billWhere.ApprovedOn = new Date(reqQuery.verifiedOn)
        }
        var memoWhere = {
            Submittion_Location_Code: allLocations
        }
        if (reqQuery.memoNumber) {
            memoWhere.Memo_Number = {
                [Op.like]: `%${reqQuery.memoNumber}%`
            }
        }
        var checkerInvoiceWhere = {
            where: billWhere,
            attributes: [],
            order: [
                ['ApprovedOn', 'DESC']
            ],
            raw: true,
            include: [{
                model: db.memoDetails,
                required: true,
                where: memoWhere,
                attributes: ['Memo_ID', 'Memo_Date', 'Memo_Number', 'Submit_To_ID'],
                include: [{
                    model: db.users,
                    required: true,
                    where: assignToWhere ? assignToWhere : {},
                    attributes: ['user_name', 'token_id', 'First_Name', 'Last_Name'],
                }]
            }, {
                model: db.ba,
                required: true,
                attributes: ['ba_name', 'ba_group_id'],
                where: baWhere ? baWhere : {}
            }, {
                model: db.users,
                required: true,
                attributes: ['user_name', 'token_id', 'First_Name', 'Last_Name'],
                where: verifiedByWhere ? verifiedByWhere : {}
            }]
        }
        var itemPerPage = reqQuery.itemPerPage ? reqQuery.itemPerPage : 10
        var invoiceCount = await db.billDetails.count(checkerInvoiceWhere)
        checkerInvoiceWhere.attributes = ['BillDetails_ID', 'MemoID', 'BillNo', 'Amount', 'BillDate', 'status', 'ApprovedBy', 'ApprovedOn', 'BA_Code']
        if (reqQuery.page) {
            checkerInvoiceWhere.limit = itemPerPage
            checkerInvoiceWhere.offset = (reqQuery.page - 1) * itemPerPage
        }
        var invoiceList = await db.billDetails.findAll(checkerInvoiceWhere)


        if (invoiceList) {
            var allInvoice = _.map(invoiceList, inv => {
                return {
                    billId: inv.BillDetails_ID,
                    memoId: inv.MemoID,
                    billNo: inv.BillNo,
                    amount: inv.Amount,
                    billDate: inv.BillDate,
                    status: inv.status,
                    verifiedById: inv.ApprovedBy,
                    verifiedOn: inv.ApprovedOn,
                    verifiedByUserName: inv['user.user_name'],
                    verifiedByToken: inv['user.token_id'],
                    verifiedByFullName: inv['user.First_Name'] + ' ' + inv['user.Last_Name'],
                    baCode: inv.BA_Code,
                    memoDate: inv['memoDetail.Memo_Date'],
                    memoNumber: inv['memoDetail.Memo_Number'],
                    submitToId: inv['memoDetail.Submit_To_ID'],
                    submitToUserName: inv['memoDetail.user.user_name'],
                    submitToToken: inv['memoDetail.user.token_id'],
                    submitToFullName: inv['memoDetail.user.First_Name'] + ' ' + inv['memoDetail.user.Last_Name'],
                    baName: inv['ba_detail.ba_name'],
                    baParentCode: inv['ba_detail.ba_group_id']
                }
            })
            res.status(200).send(apiResponse.successFormat(`success`, `Invoice list for successfully`, {
                invoiceList: allInvoice,
                itemPerPage: itemPerPage ? itemPerPage : 0,
                page: reqQuery.page ? reqQuery.page : 0,
                invoiceCount: invoiceCount ? invoiceCount : 0
            }, []))
        } else {
            res.status(200).send(apiResponse.errorFormat(`fail`, `No data found`, {
                invoiceList: [],
                itemPerPage: itemPerPage ? itemPerPage : 0,
                page: reqQuery.page ? reqQuery.page : 0,
                invoiceCount: invoiceCount ? invoiceCount : 0
            }, []))
        }
    } catch (error) {
        console.log(`error ${JSON.stringify(error)}`)
        const code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
        const response = errorResponse(error)
        res.status(code).send(response)
    }
}

module.exports.invoiceForChecker = invoiceForChecker