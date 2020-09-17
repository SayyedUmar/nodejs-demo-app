var json2xls = require('json2xls');
const moment = require('moment');
const emailService = require(`../../services/email/email`).emailServiceCls


const reverseKRMail = async (req, res) => {
    try {
        var allBills = await db.billDetails.findAll({
            where: {
                status: "A",
                ReversedOn: {
                    [Op.gte]: moment().subtract(1, 'day').startOf('day').format('YYYY-MM-DD HH:mm:ss'),
                    [Op.lte]: moment().subtract(1, 'day').endOf('day').format('YYYY-MM-DD HH:mm:ss')
                }
            },
            raw: true,
            include: [{
                model: db.expenseModel,
                required: true
            }, {
                model: db.users,
                required: true
            }]
        })
        var emailData = await db.mailformatModel.findOne({
            where: {
                Mail_Titile: 'Reversal_mail'
            },
            raw: true
        });
        if (emailData && allBills.length) {
            var emailArr = []
            emailArr = _.map(allBills, 'user.email_id')
            var invoiceTable = `<table border=1><tr><th>Invoice No</th><th>KR No</th><th>Reversal Document</th><th>Reversal Date</th></tr>`
            _.forEach(allBills, inv => {
                invoiceTable += `<tr><td>${inv.BillNo}</td><td>${inv['expense.Document_No']}</td><td>${inv['expense.Reversal_Document']}</td><td>${inv['expense.Clearing_Date']}</td></tr>`
            })
            invoiceTable += '</table>'
            var emailBody = emailData.Mail_Body.replace(/#Exception_table#/g, invoiceTable)
            var emailSubject = emailData.Mail_Subject.replace(/#date#/g, moment().subtract(1, 'day').format('DD-MMM-YYYY'))

            var resEmail = await emailService.sendEmailViaBH({
                Mail_Subject: emailSubject,
                Mail_Body: emailBody,
                // Mail_Title: emailData.Mail_Titile,
                Mail_Title: 'BAPortal',
                ToMail_Ids: emailArr,
                // CcMail_Ids: null
            })
            res.status(200).send(apiResponse.successFormat(`success`, `emaill sent successfully`, {}, []))
        } else {
            res.status(200).send(apiResponse.successFormat(`success`, `no data found`, {}, []))
        }

    } catch (error) {
        console.log(`error ${JSON.stringify(error)}`)
        const code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
        const response = errorResponse(error)
        res.status(code).send(response)
    }
}
module.exports = {
    reverseKRMail
};