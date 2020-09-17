const getPaymentRequestForReject = async (req, res) => {
    try {
        var reqQuery = req.query
        let locations = await db.userMapping.findAll({
            attributes: ['Location_ID'],
            where: {
                User_ID: reqQuery.userId
            },
            raw: true
        })

        var paymentData = await db.paymentProcessedDetails.findAll({
            where: {
                Payment_Req_No: reqQuery.paymentRequestNo,
                // status: "Open"
            },
            raw: true,
            attributes: ['Process_ID', 'Payment_Req_No', 'Amount', 'AB_Doc_No', 'AB_Doc_Date', 'Status'],
            include: [{
                    model: db.expenseModel,
                    required: true,
                    raw: true,
                    where: {
                        IsReversal: 0
                    },
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
                        model: db.internalOrderData,
                        required: true,
                        attributes: ['Customer_Code']
                    }]
                },
                {
                    model: db.billDetails,
                    required: true,
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
                            // where: {
                            //     Submittion_Location_Code: _.map(locations, 'Location_ID')
                            // },
                            attributes: []
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
                        {
                            model: db.ba,
                            required: true,
                            attributes: ['ba_name']
                        }
                    ]
                }
            ]
        })
        if (paymentData.length > 0) {
            var paymentRequestData = {}
            var allBillIds = []
            for (p = 0; p < paymentData.length; p++) {
                var pay = paymentData[p]
                //added a in key to keep element sorted
                if (!paymentRequestData['a' + pay['expense.billId']]) {
                    allBillIds.push(pay['expense.billId'])
                    var paySingle = {
                        paymentProcessId: pay.Process_ID,
                        paymentStatus: pay.Status,
                        paymentRequestNo: pay.Payment_Req_No,
                        paymentMade: pay.Amount,
                        expenseId: pay['expense.expenseId'],
                        billId: pay['expense.billId'],
                        ioNumber: pay['expense.ioNumber'],
                        billNo: pay['expense.billNo'],
                        krNo: pay['expense.krNo'],
                        baName: pay['billDetail.ba_detail.ba_name'],
                        postingDate: moment(pay['expense.postingDate']).format('DD-MMM-YYYY'),
                        costCenter: pay['expense.costCenter'],
                        businessArea: pay['expense.businessArea'],
                        tdAmount: pay['expense.tdAmount'],
                        gstAmount: pay['expense.gstAmount'],
                        tdsAmount: pay['expense.tdsAmount'],
                        baCode: pay['expense.baCode'],
                        customerCode: pay['expense.internal_order.Customer_Code'],
                        expenseAmount: pay['expense.expenseAmount'],
                        netPayable: pay['expense.paymentAmount'] ? pay['expense.paymentAmount'] : pay['billDetail.invoiceAmount'],
                        invoiceAmount: pay['billDetail.invoiceAmount'],
                        dueDate: pay['billDetail.dueDate'],
                        editedOn: pay['billDetail.editedOn'],
                        acknowledgedDate: pay['billDetail.acknowledgedDate'],
                        paymentReleased: pay['billDetail.totalPaymentRequested'],
                        // billDate: pay['billDetail.billDate'],
                        accReason: null,
                        taxReason: null,
                        onholdStatus: null,
                        abDocNo: pay.AB_Doc_No ? pay.AB_Doc_No : null,
                        abDocDate: pay.AB_Doc_Date ? pay.AB_Doc_Date : null,
                        advanceDocuments: []
                    }
                    paySingle.tdPercent = ((paySingle.tdAmount * 100) / paySingle.expenseAmount);
                    paySingle.paymentToBeMade = paySingle.netPayable - paySingle.paymentReleased;
                    paySingle.age = paySingle.editedOn ? moment().diff(moment(paySingle.editedOn, 'YYYY-MM-DD'), 'days') : moment().diff(moment(paySingle.acknowledgedDate, 'YYYY-MM-DD'), 'days');
                    paymentRequestData['a' + pay['expense.billId']] = paySingle
                }
                if (pay['billDetail.advanceDocumentMapping.advanceDocumentId']) {
                    paymentRequestData['a' + pay['expense.billId']].advanceDocuments.push({
                        advanceDocumentId: pay['billDetail.advanceDocumentMapping.advanceDocumentId'],
                        documentNumber: pay['billDetail.advanceDocumentMapping.advanceDocumentNumber'],
                        advancePayment: pay['billDetail.advanceDocumentMapping.advancePayment'],
                        fiscalYear: pay['billDetail.advanceDocumentMapping.fiscalYear'],
                        docType: pay['billDetail.advanceDocumentMapping.docType'],
                        docDate: pay['billDetail.advanceDocumentMapping.docDate'],
                        postDate: pay['billDetail.advanceDocumentMapping.postDate'],
                        profitCenter: pay['billDetail.advanceDocumentMapping.profitCenter'],
                        businessPlace: pay['billDetail.advanceDocumentMapping.businessPlace'],
                        advanceAmount: pay['billDetail.advanceDocumentMapping.advanceAmount']
                    })
                }
            }
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
            for (var o = 0; o < onholdBill.length; o++) {
                var bill = onholdBill[o]
                paymentRequestData['a' + bill.billId].accReason = bill.accReason;
                paymentRequestData['a' + bill.billId].taxReason = bill.taxReason;
                paymentRequestData['a' + bill.billId].onholdStatus = bill.onholdStatus;
            }
            res.status(200).send(apiResponse.successFormat(`success`, `Payment request for reject fectched successfully`, {
                paymentRequestData: _.toArray(paymentRequestData)

            }, []))
        } else {
            res.status(200).send(apiResponse.successFormat(`success`, `No data found`, {
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

module.exports.getPaymentRequestForReject = getPaymentRequestForReject