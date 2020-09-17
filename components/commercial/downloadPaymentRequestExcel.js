const billLog = require('../../utils/logs/addBillActivity')
const moment = require('moment')
const db = require('../../config/db/billHubdbConn')
var workbook = new Excel.Workbook()

class PaymentRequestExcel {}
const paymentRequestExcel = new PaymentRequestExcel()
const downloadPaymentRequest = async (req, res) => {
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
            attributes: ['Process_ID', 'Payment_Req_No', 'Amount', 'AB_Doc_No', 'AB_Doc_Date', 'Created_On'],
            include: [{
                    model: db.expenseModel,
                    required: true,
                    raw: true,
                    order: [
                        ['Posting _Date', 'DESC']
                    ],
                    where: {
                        IsReversal: 0
                    },
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
                        attributes: ['Customer_Code'],
                        include: [{
                            model: db.customerModel,
                            required: false
                        }]
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
                        ['TotalPayment_Requested', 'totalPaymentRequested'],
                        ['TaxableAmount', 'taxableAmount'],

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
                        },
                        {
                            model: db.onholdBills,
                            required: false
                        }
                    ]
                }
            ]
        })
        if (paymentData.length > 0) {
            var payData = {}
            for (p = 0; p < paymentData.length; p++) {
                var pay = paymentData[p]
                //added a in key to keep element sorted
                if (!payData['a' + pay.Process_ID]) {
                    payData['a' + pay.Process_ID] = {
                        baCode: pay['expense.baCode'],
                        baName: pay['billDetail.ba_detail.ba_name'],
                        billNo: pay['expense.billNo'],
                        krNo: pay.AB_Doc_No ? pay.AB_Doc_No : pay['expense.krNo'],
                        postDate: moment(pay['expense.postingDate']).format('DD-MMM-YYYY'),
                        busArea: pay['expense.businessArea'],
                        costCenter: pay['expense.costCenter'],
                        billAmt: pay['billDetail.invoiceAmount'],
                        tdPercent: (pay['expense.tdAmount'] * 100) / pay['billDetail.taxableAmount'],
                        tdAmt: pay['expense.tdAmount'],
                        tds: pay['expense.tdsAmount'],
                        netpayble: pay['expense.paymentAmount'] ? pay['expense.paymentAmount'] : pay['billDetail.invoiceAmount'],
                        paymentMade: pay['billDetail.totalPaymentRequested'],
                        paymentToBeMade: pay.Amount,
                        refNo: pay.AB_Doc_No ? pay['expense.krNo'] : '',
                        customerName: pay['expense.internal_order.customer.Customer_Name'] ? pay['expense.internal_order.customer.Customer_Name'] : '',
                        vertical: pay['expense.internal_order.Vertical_Name'] ? pay['expense.internal_order.Vertical_Name'] : '',
                        accReason: pay['billDetail.onholdBills.Acc_Reason'],
                        taxReason: pay['billDetail.onholdBills.Tax_Reason'],
                        commercialReason: pay['billDetail.onholdBills.Status'],
                        generatedFrom: "Billhub"
                    }
                }
                if (pay['billDetail.advanceDocumentMapping.advanceDocumentId']) {
                    payData['a' + pay['billDetail.advanceDocumentMapping.advanceDocumentId']] = {
                        baCode: pay['expense.baCode'],
                        baName: pay['billDetail.ba_detail.ba_name'],
                        billNo: pay['expense.billNo'],
                        krNo: pay['billDetail.advanceDocumentMapping.advanceDocumentNumber'],
                        postDate: pay['billDetail.advanceDocumentMapping.postDate'],
                        busArea: pay['billDetail.advanceDocumentMapping.businessPlace'],
                        costCenter: '',
                        billAmt: 0,
                        tdPercent: 0,
                        tdAmt: 0,
                        tds: 0,
                        netpayble: -1 * pay['billDetail.advanceDocumentMapping.advancePayment'],
                        paymentMade: 0,
                        paymentToBeMade: -1 * pay['billDetail.advanceDocumentMapping.advancePayment'],
                        refNo: pay['expense.krNo'],
                        customerName: '',
                        vertical: '',
                        accReason: '',
                        taxReason: '',
                        commercialReason: '',
                        generatedFrom: "Billhub"
                    }

                }
            }
            var excelData = _.toArray(payData)
            if (!_.isEmpty(excelData)) {
                workbook.xlsx.readFile('public/uploads/templates/paymentRequestExcel.xlsx')
                    .then(function () {
                        var payReqSheet = workbook.getWorksheet(1);
                        payReqSheet.getRow(1).getCell(2).value = paymentData[0] && paymentData[0].Payment_Req_No ? paymentData[0].Payment_Req_No : ''
                        payReqSheet.getRow(2).getCell(2).value = paymentData[0] ? moment(paymentData[0].Created_On).format('DD-MMM-YYYY') : moment().format('DD-MMM-YYYY')
                        _.forEach(excelData, function (b, i) {
                            var row = payReqSheet.getRow(i + 5);
                            row.getCell(1).value = b.baCode;
                            row.getCell(2).value = b.baName;
                            row.getCell(3).value = b.billNo;
                            row.getCell(4).value = b.krNo;
                            row.getCell(5).value = b.postDate;
                            row.getCell(6).value = b.busArea;
                            row.getCell(7).value = b.costCenter;
                            row.getCell(8).value = b.billAmt;
                            row.getCell(9).value = b.tdPercent;
                            row.getCell(10).value = b.tdAmt;
                            row.getCell(11).value = b.tds;
                            row.getCell(12).value = b.netpayble;
                            row.getCell(13).value = b.paymentMade;
                            row.getCell(14).value = b.paymentToBeMade;
                            row.getCell(15).value = b.refNo;
                            row.getCell(16).value = b.customerName;
                            row.getCell(17).value = b.vertical;
                            row.getCell(18).value = b.accReason;
                            row.getCell(19).value = b.taxReason;
                            row.getCell(20).value = b.commercialReason;
                            row.getCell(21).value = b.generatedFrom;
                            row.commit();
                        })
                        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                        res.setHeader("Content-Disposition", "attachment; filename=" + 'paymentRequest.xlsx');
                        workbook.xlsx.write(res).then(function () {
                            res.end();
                        });
                    }).catch((errr) => {
                        res.status(200).send(apiResponse.errorFormat(`fail`, `error occurred while downloading excel`, {}, []))
                    })
            } else {
                res.status(200).send(apiResponse.errorFormat(`fail`, `error occurred while downloading excel`, {}, []))
            }
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

module.exports.downloadPaymentRequest = downloadPaymentRequest