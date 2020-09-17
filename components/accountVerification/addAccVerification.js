const emailService = require(`../../services/email/email`).emailServiceCls
const billActivity = require('../../utils/logs/addBillActivity')
const userActivity = require('../../utils/logs/addUserActivityLog')

class SendMail {
    async sendMail(mailType, userId, roleId, billId) {
        try {
            var emailData = await db.mailformatModel.findOne({
                where: {
                    Mail_Titile: mailType
                },
                raw: true
            });
            if (mailType == 'On Hold') {

                var billdata = await db.billDetails.findOne({
                    attributes: ['BillNo', 'ApprovedBy'],
                    include: [{
                        model: db.onholdBills,
                        attributes: ['Acc_Reason', 'Tax_Reason']
                    }],
                    where: {
                        BillDetails_ID: billId
                    },
                    raw: true
                });

                console.log('emailData', emailData)
                console.log('billdata', billdata)
                if (billdata != null) {
                    console.log('IN-----')
                    var toEmailID = await db.users.findOne({
                        attributes: ['email_id'],
                        where: {
                            user_id: billdata.ApprovedBy
                        },
                        raw: true
                    });
                    var userData = await db.users.findOne({
                        attributes: ['email_id', 'first_name', 'last_name'],
                        where: {
                            user_id: userId
                        },
                        raw: true
                    });
                    console.log(userData)
                    //console.log(billdata['user.first_name'])
                    if (emailData) {
                        var OnHoldReason = roleId == 3 ? billdata['onholdBill.Acc_Reason'] : billdata['onholdBill.Tax_Reason']

                        var emailBody = emailData.Mail_Body.replace(/#Invoice Number#/g, (billdata['BillNo']))
                            .replace(/#On Hold Reason#/g, OnHoldReason)
                            .replace(/#Raised By#/g, (userData['first_name'] + ' ' + userData['last_name']));

                        var emailSubject = emailData.Mail_Subject;
                        var toEmailArr = []
                        var ccEmailArr = []

                        toEmailArr.push(toEmailID['email_id'])
                        ccEmailArr.push(userData['email_id'])
                        ccEmailArr.push('rewale.megha@mahindra.com')

                        console.log('To-', toEmailArr)
                        console.log('CC-', ccEmailArr)

                        var resEmail = await emailService.sendEmailViaBH({
                            Mail_Subject: emailSubject,
                            Mail_Body: emailBody,
                            // Mail_Title: emailData.Mail_Titile,
                            Mail_Title: 'BAPortal',
                            ToMail_Ids: toEmailArr,
                            CcMail_Ids: ccEmailArr
                        })
                        return resEmail
                    }
                }
            } else {
                db.billDetails.belongsTo(db.expenseModel, {
                    foreignKey: 'BillDetails_ID',
                    targetKey: 'Bill_Details_ID'
                })
                var billdata = await db.billDetails.findOne({
                    attributes: ['BillNo'],
                    include: [{
                        model: db.onholdBills,
                        attributes: ['Acc_User_ID', 'Acc_Reason', 'Tax_User_ID', 'Tax_Reason']
                    }, {
                        model: db.expenseModel,
                        attributes: ['Document_No'],
                        where: {
                            IsPaymentDetailsUpdated: '1',
                            IsReversal: '0'
                        }
                    }],
                    where: {
                        BillDetails_ID: billId
                    },
                    raw: true
                });

                console.log('emailData', emailData)
                console.log('billdata', billdata)
                if (billdata != null) {
                    console.log('IN-----')
                    var accUserData = await db.users.findOne({
                        attributes: ['email_id', 'first_name', 'last_name'],
                        where: {
                            user_id: billdata['onholdBill.Acc_User_ID']
                        },
                        raw: true
                    });
                    var taxUserData = await db.users.findOne({
                        attributes: ['email_id', 'first_name', 'last_name'],
                        where: {
                            user_id: billdata['onholdBill.Tax_User_ID']
                        },
                        raw: true
                    });
                    var commUserData = await db.users.findOne({
                        attributes: ['email_id', 'first_name', 'last_name'],
                        where: {
                            user_id: userId
                        },
                        raw: true
                    });
                    console.log(commUserData)
                    //console.log(billdata['user.first_name'])
                    if (emailData) {
                        var toEmailArr = []
                        var ccEmailArr = []
                        if (accUserData != null) {
                            if (!(accUserData['email_id'] == '' || accUserData['email_id'] == undefined))
                                toEmailArr.push(accUserData['email_id']);
                        }
                        if (taxUserData != null) {
                            if (!(taxUserData['email_id'] == '' || taxUserData['email_id'] == undefined))
                                toEmailArr.push(taxUserData['email_id']);
                        }
                        ccEmailArr.push(commUserData['email_id'])

                        console.log('To-', toEmailArr)
                        console.log('CC-', ccEmailArr)

                        /*   var emailBody = emailData.Mail_Body.replace(/#Invoice Number#/g, (billdata['BillNo']))
                            .replace(/#Resolved By#/g, commUserData['first_name'] + ' ' + commUserData['last_name'])
                            .replace(/#Document Number#/g, billdata['expense.Document_No'])
                            .replace(/#Accounts:#/g, (billdata['onholdBill.Acc_Reason'] != 'OK' ? (billdata['onholdBill.Acc_Reason'] != null ? 'Accounts:' : '') : ''))
                            .replace(/#Acc_Reason#/g, (billdata['onholdBill.Acc_Reason'] != 'OK' ? (billdata['onholdBill.Acc_Reason'] != null ? "Query : " + billdata['onholdBill.Acc_Reason'] : '') : ''))
                            .replace(/#Raised_By_Acc#/g, (billdata['onholdBill.Acc_Reason'] != 'OK' ? (billdata['onholdBill.Acc_Reason'] != null ? "Raised By : " + accUserData['first_name'] + ' ' + accUserData['last_name'] : '') : ''))
                            .replace(/#Tax:#/g, (billdata['onholdBill.Tax_Reason'] != 'OK' ? (billdata['onholdBill.Tax_Reason'] != null ? 'Tax:' : '') : ''))
                            .replace(/#Tax_Reason#/g, (billdata['onholdBill.Tax_Reason'] != 'OK' ? (billdata['onholdBill.Tax_Reason'] != null ? "Query : " + billdata['onholdBill.Tax_Reason'] : '') : ''))
                            .replace(/#Raised_By_Tax#/g, (billdata['onholdBill.Tax_Reason'] != 'OK' ? (billdata['onholdBill.Tax_Reason'] != null ? "Raised By : " + taxUserData['first_name'] + ' ' + taxUserData['last_name'] : '') : ''))
*/
                        var onholdReason = '';
                        var raisedByUser = '';
                        if (billdata['onholdBill.Acc_Reason'] != 'OK' && billdata['onholdBill.Acc_Reason'] != null && billdata['onholdBill.Acc_Reason']) {
                            onholdReason += '<b>Accounts</b>: ' + billdata['onholdBill.Acc_Reason']
                            raisedByUser += '<b>Accounts</b>: ' + accUserData['first_name'] + ' ' + accUserData['last_name']
                        }
                        if (billdata['onholdBill.Tax_Reason'] != 'OK' && billdata['onholdBill.Tax_Reason'] != null && billdata['onholdBill.Tax_Reason'] != '') {
                            onholdReason += " <b>Tax:</b> : " + billdata['onholdBill.Tax_Reason']
                            raisedByUser += ' <b>Tax:</b> ' + taxUserData['first_name'] + ' ' + taxUserData['last_name']
                        }
                        var emailBody = emailData.Mail_Body.replace(/#Invoice Number#/g, (billdata['BillNo']))
                            .replace(/#On Hold Reason#/g, onholdReason)
                            .replace(/#Raised By#/g, raisedByUser)

                        var emailSubject = emailData.Mail_Subject.replace(/#number#/g, (billdata['BillNo']));

                        var resEmail = await emailService.sendEmailViaBH({
                            Mail_Subject: emailSubject,
                            Mail_Body: emailBody,
                            // Mail_Title: emailData.Mail_Titile,
                            Mail_Title: 'BAPortal',
                            ToMail_Ids: toEmailArr,
                            CcMail_Ids: ccEmailArr
                        })
                        return resEmail
                    }
                }
            }
        } catch (ex) {
            console.log(ex)
        }
    }
}
const addAccVerification = async (req, res) => {
    let reqQuery = req.query;
    let reqBody = req.body;
    try {
        if (reqBody.length <= 0) {
            res.status(400).send(apiResponse.errorFormat(`fail`, `No data to update`, errorObj, []));
            return;
        } else {
            let userCnt = await db.users.count({
                where: {
                    user_id: reqQuery.userId,
                    role_id: reqQuery.roleId,
                    active: 1
                }
            });
            console.log('updcnt', userCnt)

            if (userCnt <= 0) {
                res.status(400).send(apiResponse.errorFormat(`fail`, `Invalid User`, [], []));
                return;
            }
            console.log(' reqBody', reqBody)
            _.forEach(reqBody, async accData => {
                console.log(' accData', accData)
                console.log(' accData.billDetailsId', accData.billDetailsId)
                let onholdBillCnt = await db.onholdBills.count({
                    where: {
                        BillDetails_ID: accData.billDetailsId
                    }
                });
                let isExists = (onholdBillCnt > 0) ? true : false;
                let IsOnHoldStatus = false;

                if (reqQuery.roleId == 3)
                    IsOnHoldStatus = accData.accReason == "OK" ? false : true;
                else if (reqQuery.roleId == 4)
                    IsOnHoldStatus = accData.taxReason == "OK" ? false : true;

                if (isExists) {
                    console.log('Update Accounts')
                    if (IsOnHoldStatus) { // ----if query--->onhold status

                        if (reqQuery.roleId == 3) {
                            console.log('roleId', '3');
                            await db.onholdBills.update({
                                Acc_Reason: accData.accReason,
                                OnHold_Date: moment().format('YYYY-MM-DD HH:mm:ss'),
                                Status: "OnHold",
                                Acc_User_ID: (accData.accUserId == null || accData.accUserId == '') ? 0 : accData.accUserId,
                                Tax_User_ID: (accData.taxUserId == null || accData.taxUserId == '') ? 0 : accData.taxUserId,
                                Comm_User_ID: (accData.commUserId == null || accData.commUserId == '') ? 0 : accData.commUserId,
                                IsBlanketApproved: (accData.isBlanketApproved) ? 1 : 0,
                                expense_id: (accData.expenseId == null || accData.expenseId == '') ? 0 : accData.expenseId,
                            }, {
                                where: {
                                    BillDetails_ID: accData.billDetailsId
                                }
                            });
                        } else {
                            console.log('roleId', '4');
                            await db.onholdBills.update({
                                Tax_Reason: accData.taxReason,
                                OnHold_Date: moment().format('YYYY-MM-DD HH:mm:ss'),
                                Status: "OnHold",
                                Acc_User_ID: (accData.accUserId == null || accData.accUserId == '') ? 0 : accData.accUserId,
                                Tax_User_ID: (accData.taxUserId == null || accData.taxUserId == '') ? 0 : accData.taxUserId,
                                Comm_User_ID: (accData.commUserId == null || accData.commUserId == '') ? 0 : accData.commUserId,
                                IsBlanketApproved_Tax: (accData.isBlanketApprovedTax) ? 1 : 0,
                                expense_id: (accData.expenseId == null || accData.expenseId == '') ? 0 : accData.expenseId,
                            }, {
                                where: {
                                    BillDetails_ID: accData.billDetailsId
                                }
                            });
                        }
                    } else {

                        if (reqQuery.roleId == 3) {
                            console.log('roleId', '3');
                            await db.onholdBills.update({
                                Acc_Reason: accData.accReason,
                                OnHold_Date: moment().format('YYYY-MM-DD HH:mm:ss'),
                                Acc_User_ID: (accData.accUserId == null || accData.accUserId == '') ? 0 : accData.accUserId,
                                Tax_User_ID: (accData.taxUserId == null || accData.taxUserId == '') ? 0 : accData.taxUserId,
                                Comm_User_ID: (accData.commUserId == null || accData.commUserId == '') ? 0 : accData.commUserId,
                                IsBlanketApproved: (accData.isBlanketApproved) ? 1 : 0,
                                expense_id: (accData.expenseId == null || accData.expenseId == '') ? 0 : accData.expenseId,
                            }, {
                                where: {
                                    BillDetails_ID: accData.billDetailsId
                                }
                            });
                        } else {
                            console.log('roleId', '4');
                            await db.onholdBills.update({
                                Tax_Reason: accData.taxReason,
                                OnHold_Date: moment().format('YYYY-MM-DD HH:mm:ss'),
                                Acc_User_ID: (accData.accUserId == null || accData.accUserId == '') ? 0 : accData.accUserId,
                                Tax_User_ID: (accData.taxUserId == null || accData.taxUserId == '') ? 0 : accData.taxUserId,
                                Comm_User_ID: (accData.commUserId == null || accData.commUserId == '') ? 0 : accData.commUserId,
                                IsBlanketApproved_Tax: (accData.isBlanketApprovedTax) ? 1 : 0,
                                expense_id: (accData.expenseId == null || accData.expenseId == '') ? 0 : accData.expenseId,
                            }, {
                                where: {
                                    BillDetails_ID: accData.billDetailsId
                                }
                            });
                        }
                    }
                } else {
                    console.log('Add Accounts')
                    await db.onholdBills
                        .create({
                            BillDetails_ID: accData.billDetailsId,
                            Acc_Reason: accData.accReason,
                            Tax_Reason: accData.taxReason,
                            OnHold_Date: moment().format('YYYY-MM-DD HH:mm:ss'),
                            Status: IsOnHoldStatus ? "OnHold" : null,
                            Acc_User_ID: (accData.accUserId == null || accData.accUserId == '') ? 0 : accData.accUserId,
                            Tax_User_ID: (accData.taxUserId == null || accData.taxUserId == '') ? 0 : accData.taxUserId,
                            //Comm_User_ID: accData.commUserId,
                            IsBlanketApproved: (accData.isBlanketApproved) ? 1 : 0,
                            IsBlanketApproved_Tax: (accData.isBlanketApprovedTax) ? 1 : 0,
                            expense_id: (accData.expenseId == null || accData.expenseId == '') ? 0 : accData.expenseId,
                        })
                }
                if (IsOnHoldStatus) {
                    var objSendMail = new SendMail();
                    objSendMail.sendMail('On Hold', reqQuery.userId, reqQuery.roleId, accData.billDetailsId);

                    billActivity.billActivity.addLog({
                        billDetailsId: accData.billDetailsId,
                        activityCode: "On_Hold",
                        activityDes: "Invoice On Hold : " + accData.invNumber + " Reason: " + (reqQuery.roleId == 3 ? accData.accReason : accData.taxReason),
                        currStatus: "",
                        preStatus: "",
                        updatedBy: reqQuery.userId
                    });
                    userActivity.userActivityLog.addLog({
                        activityName: "On_Hold",
                        details: "Invoice On Hold : " + accData.invNumber + " Reason: " + (reqQuery.roleId == 3 ? accData.accReason : accData.taxReason),
                        oldValue: "",
                        newValue: "",
                        userId: reqQuery.userId
                    });
                }
            });
            res.status(200).send(apiResponse.successFormat(`success`, `Invoice updated successfully`, [], []))
        }
    } catch (error) {
        console.log('Error getPendingBillAccounts ', error);
        const errorObj = {
            code: `err_001`,
            message: errorCode.err_001
        }
        res.status(400).send(apiResponse.errorFormat(`fail`, `Failed to fetching account data`, errorObj, []));
    }
}
const resolveInvoice = async (req, res) => {

    let reqBody = req.body[0];

    if (reqBody.length <= 0) {
        res.status(400).send(apiResponse.errorFormat(`fail`, `No data to update`, errorObj, []));
    } else {
        let onholdBillCnt = await db.onholdBills.count({
            where: {
                BillDetails_ID: reqBody.billDetailsId
            }
        });
        let isExists = (onholdBillCnt > 0) ? true : false;

        if (isExists == true) {
            if (req.query.roleId == 2) {
                await db.onholdBills.update({
                    Status: "OK",
                    Resolved_Date: moment().format('YYYY-MM-DD HH:mm:ss'),
                    Acc_User_ID: reqBody.accUserId,
                    Tax_User_ID: reqBody.taxUserId,
                    Comm_User_ID: req.query.userId
                }, {
                    where: {
                        BillDetails_ID: reqBody.billDetailsId
                    }
                });

                billActivity.billActivity.addLog({
                    billDetailsId: reqBody.billDetailsId,
                    activityCode: "Invoice_Resolved",
                    activityDes: "Invoice query resolved by commercial Invoice Number " + reqBody.invNumber,
                    currStatus: "",
                    preStatus: "",
                    updatedBy: req.query.userId
                });
                userActivity.userActivityLog.addLog({
                    activityName: "Invoice_Resolved",
                    details: "Invoice query resolved by commercial Invoice Number " + reqBody.invNumber,
                    oldValue: "",
                    newValue: "",
                    userId: req.query.userId
                });

                var objSendMail = new SendMail();
                objSendMail.sendMail('Commercial OK', req.query.userId, req.query.roleId, reqBody.billDetailsId);

            }
            res.status(200).send(apiResponse.successFormat(`success`, `Invoice updated successfully`, [], []))
        } else
            res.status(200).send(apiResponse.successFormat(`fail`, `No bills found`, [], []))
    }
}
module.exports = {
    addAccVerification,
    resolveInvoice
};