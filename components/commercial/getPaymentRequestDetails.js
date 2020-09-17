const getPaymentRequestDetails = async (req, res) => {
    try {
        var reqQuery = req.query
        // reqQuery.itemPerPage = reqQuery.itemPerPage ? reqQuery.itemPerPage : 10
        // reqQuery.page = reqQuery.page ? reqQuery.page : 1
        var baDetails = await db.ba.findOne({
            where: {
                ba_id: reqQuery.baId,
                isActive: 1
            },
            raw: true,
            attributes: ['ba_id', 'ba_code', 'ba_group_id', 'ba_name']
        })
        let locations = await db.userMapping.findAll({
            attributes: ['Location_ID'],
            where: {
                User_ID: reqQuery.userId
            },
            raw: true
        })
        var expenseWhere = {
            IsReversal: 0,
            IsPaymentDetailsUpdated: 1,
            // Vendor: baDetails.ba_code
        }
        var billWhere = {
            BA_Code: reqQuery.baId,
            status: 'B'
        }
        if (reqQuery.billNo) {
            expenseWhere.Bill_No = {
                [Op.like]: `%${reqQuery.billNo}%`
            }
        }
        if (reqQuery.krNo) {
            expenseWhere.Document_No = {
                [Op.like]: `%${reqQuery.krNo}%`
            }
        }
        if (reqQuery.postingDate) {
            expenseWhere['Posting _Date'] = reqQuery.postingDate
        }
        if (reqQuery.costCenter) {
            expenseWhere.Cost_Ctr = {
                [Op.like]: `%${reqQuery.costCenter}%`
            }
        }
        if (reqQuery.businessArea) {
            expenseWhere.BusArea = reqQuery.businessArea
        }
        if (reqQuery.age) {
            billWhere.acknowledgedDate = new Date(moment().subtract(reqQuery.age, "days").format("YYYY-MM-DD"))
        }
        var whereStr = {
            where: expenseWhere,
            raw: true,
            order: [
                ['Posting _Date', 'DESC']
            ],
            attributes: [
                ['ID', 'expenseId'],
                ['Bill_Details_ID', 'billId'],
                ['Cost_Ctr', 'costCenter'],
                ['Order_no', 'ioNumber'],
                ['Bill_No', 'billNo'],
                ['Document_No', 'krNo'],
                ['BusArea', 'businessArea'],
                ['Posting _Date', 'postingDate'],
                ['GST', 'gstAmount'],
                ['TDS', 'tdsAmount'],
                ['Vendor', 'baCode'],
                ['TD', 'tdAmount'],
                ['Expense_Amount', 'expenseAmount'],
                ['Payment Amount', 'paymentAmount']
            ],
            include: [{
                model: db.billDetails,
                required: true,
                where: billWhere,
                attributes: [
                    ['Amount', 'invoiceAmount'],
                    ['DueDate', 'dueDate'],
                    ['Edited_On', 'editedOn'],
                    ['AcknowledgedOn', 'acknowledgedDate'],
                    ['BillDate', 'billDate'],
                    ['TotalPayment_Requested', 'totalPaymentRequested']
                ],
                include: [{
                        model: db.memoDetails,
                        required: true,
                        where: {
                            Submittion_Location_Code: _.map(locations, 'Location_ID')
                        },
                        attributes: [
                            // 'Memo_ID', 'Memo_Date', 'Memo_Number', 'Submit_To_ID'
                        ]
                    },
                    {
                        model: db.advanceDocumentMapping,
                        required: false,
                        attributes: [
                            ['advance_document_id', 'advanceDocumentId'],
                            ['advance_document_number', 'advanceDocumentNumber'],
                            ['advance_payment', 'advancePayment'],
                            ['fiscal_year', 'fiscalYear'],
                            ['doc_type', 'docType'],
                            ['doc_date', 'docDate'],
                            ['post_date', 'postDate'],
                            ['profit_center', 'profitCenter'],
                            ['bussiness_place', 'businessPlace'],
                            ['document_amount', 'advanceAmount']
                        ]
                    },
                    // {
                    //     model: db.onholdBills,
                    //     required: false,
                    //     attributes: [
                    //         ['OnHold_Bill_ID', 'onHoldBillId'],
                    //         ['Acc_Reason', 'accReason'],
                    //         ['Tax_Reason', 'taxReason'],
                    //         ['Status', 'onholdStatus']
                    //     ]
                    // }
                ]
            }, {
                model: db.internalOrderData,
                required: true,
                attributes: ['Customer_Code']
            }]
        }
        //for count and pagination we need to remove advance document join and add using for loop 
        // var paymentDetailsCount = await db.expenseModel.count(whereStr)
        // whereStr.limit = reqQuery.itemPerPage
        // whereStr.offset = (reqQuery.page - 1) * reqQuery.itemPerPage
        var paymentData = await db.expenseModel.findAll(whereStr)

        if (paymentData.length > 0) {
            var paymentRequestData = {}
            var allBillIds = []
            for (p = 0; p < paymentData.length; p++) {
                var pay = paymentData[p]
                //added a in key to keep element sorted
                if (!paymentRequestData['a' + pay.billId]) {
                    allBillIds.push(pay.billId)
                    var paySingle = {
                        expenseId: pay.expenseId,
                        billId: pay.billId,
                        ioNumber: pay.ioNumber,
                        billNo: pay.billNo,
                        krNo: pay.krNo,
                        baName: baDetails.ba_name,
                        postingDate: moment(pay.postingDate).format('DD-MMM-YYYY'),
                        costCenter: pay.costCenter,
                        businessArea: pay.businessArea,
                        tdAmount: pay.tdAmount,
                        gstAmount: pay.gstAmount,
                        tdsAmount: pay.tdsAmount,
                        baCode: pay.baCode,
                        customerCode: pay['internal_order.Customer_Code'],
                        expenseAmount: pay.expenseAmount,
                        netPayable: pay.paymentAmount ? pay.paymentAmount : pay['billDetail.invoiceAmount'],
                        invoiceAmount: pay['billDetail.invoiceAmount'],
                        dueDate: pay['billDetail.dueDate'],
                        editedOn: pay['billDetail.editedOn'],
                        acknowledgedDate: pay['billDetail.acknowledgedDate'],
                        paymentReleased: pay['billDetail.totalPaymentRequested'],
                        // billDate: pay['billDetail.billDate'],
                        accReason: null,
                        taxReason: null,
                        onholdStatus: null,
                        abDocNo: "",
                        abDocDate: "",
                        advanceDocuments: [],
                        adjustedAmount: 0
                    }
                    paySingle.tdPercent = ((paySingle.tdAmount * 100) / paySingle.expenseAmount);
                    paySingle.paymentToBeMade = paySingle.netPayable - paySingle.paymentReleased;
                    paySingle.age = paySingle.editedOn ? moment().diff(moment(paySingle.editedOn, 'YYYY-MM-DD'), 'days') : moment().diff(moment(paySingle.acknowledgedDate, 'YYYY-MM-DD'), 'days');
                    paymentRequestData['a' + pay.billId] = paySingle
                }
                if (pay['billDetail.advanceDocumentMapping.advanceDocumentId'] && paySingle.paymentReleased == 0) {
                    paySingle.adjustedAmount += pay['billDetail.advanceDocumentMapping.advancePayment']
                    paySingle.paymentToBeMade -= pay['billDetail.advanceDocumentMapping.advancePayment']
                    paymentRequestData['a' + pay.billId].advanceDocuments.push({
                        advanceDocumentId: pay['billDetail.advanceDocumentMapping.advanceDocumentId'],
                        documentNumber: pay['billDetail.advanceDocumentMapping.advanceDocumentNumber'],
                        advancePayment: pay['billDetail.advanceDocumentMapping.advancePayment'],
                        fiscalYear: pay['billDetail.advanceDocumentMapping.fiscalYear'],
                        docType: pay['billDetail.advanceDocumentMapping.docType'],
                        docDate: pay['billDetail.advanceDocumentMapping.docDate'],
                        postDate: pay['billDetail.advanceDocumentMapping.postDate'],
                        profitCenter: pay['billDetail.advanceDocumentMapping.profitCenter'],
                        businessPlace: pay['billDetail.advanceDocumentMapping.businessPlace'],
                        advanceAmount: pay['billDetail.advanceDocumentMapping.advanceAmount'],
                    })
                }
            }
            try {
                var onholdBill = await db.onholdBills.findAll({
                    where: {
                        BillDetails_ID: allBillIds
                    },
                    raw: true,
                    group: ['BillDetails_ID'],
                    attributes: [
                        ['BillDetails_ID', 'billId'],
                        [db.sequelize.fn('max', db.sequelize.col('Acc_Reason')), 'accReason'],
                        [db.sequelize.fn('max', db.sequelize.col('Tax_Reason')), 'taxReason'],
                        [db.sequelize.fn('max', db.sequelize.col('Status')), 'onholdStatus']
                    ]
                })
            } catch (e) {
                console.log(e)
            }
            for (var o = 0; o < onholdBill.length; o++) {
                var bill = onholdBill[o]
                paymentRequestData['a' + bill.billId].accReason = bill.accReason;
                paymentRequestData['a' + bill.billId].taxReason = bill.taxReason;
                paymentRequestData['a' + bill.billId].onholdStatus = bill.onholdStatus;
            }
            res.status(200).send(apiResponse.successFormat(`success`, `Payment details fectched successfully`, {
                paymentRequestData: _.toArray(paymentRequestData)
                // totalCount: paymentDetailsCount,
                // page: reqQuery.page,
                // itemPerPage: reqQuery.itemPerPage
            }, []))
        } else {
            res.status(200).send(apiResponse.errorFormat(`fail`, `No data found`, {
                paymentRequestData: []
            }, []))
        }
    } catch (error) {
        console.log(`error ${JSON.stringify(error)}`)
        const code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
        const response = errorResponse(error)
        res.status(code).send(response)
    }
}

module.exports.getPaymentRequestDetails = getPaymentRequestDetails