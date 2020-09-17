var json2xls = require('json2xls');
const emailService = require(`../../services/email/email`).emailServiceCls


const bookedInvMail = async (req, res) => {

    let result = [];
    try {
        var vUploadDate = moment().subtract(1, 'day').format('YYYY-MM-DD')
        console.log('vUploadDate', vUploadDate)
        var dummydate = moment('2020-07-23').format('YYYY-MM-DD')

        let resData = await db.sequelize.query(`CALL SP_GetAllBookedBills(:uploadFromDate,:uploadToDate)`, {
            replacements: {
                uploadFromDate: dummydate, //vUploadDate
                uploadToDate: dummydate //vUploadDate
            },
            type: db.Sequelize.QueryTypes.SELECT
        });

        if (!_.isEmpty(resData)) {
            var arrData = _.toArray(resData[0]);
            if (arrData.length <= 0) {
                res.status(200).send(apiResponse.successFormat(`fail`, `No data found`, [], []));
            } else {
                console.log(arrData)

                var xls = json2xls(arrData);
                var fileName = `public/uploads/allfiles/BookedInvoices${moment(vUploadDate).format('DDMMMYYYY')}.xlsx`;
                await fs.writeFileSync(fileName, xls, 'binary');

                var emailData = await db.mailformatModel.findOne({
                    where: {
                        Mail_Titile: 'Booked Invoices'
                    },
                    raw: true
                });
                let users = await db.users.findAll({
                    raw: true,
                    where: {
                        active: 1,
                        role_id: {
                            [Sequelize.Op.in]: [3, 4] //Accounts & Taxation
                        }
                    },
                    attributes: ['user_id', 'first_name', 'last_name', 'email_id']
                })
                var toEmailArr = _.map(users, function (l) {
                    return l.email_id
                })

                if (users.length > 0) {

                    if (toEmailArr.length > 0) {
                        var ccEmailArr = [];
                        ccEmailArr.push('rewale.megha@mahindra.com')

                        console.log('To-', toEmailArr)
                        console.log('CC-', ccEmailArr)
                    }
                }
                if (emailData) {
                    var verticalTable = '';
                    var verticalData = _.toArray(resData[1])
                    console.log('verticalData.length', verticalData.length)

                    if (verticalData.length > 0) {
                        verticalTable += '<table border=1><tr><th>Vertical</th><th>Location</th><th>Count</th></tr>';
                        _.forEach(verticalData, i => {
                            verticalTable += '<tr><td>' + i.Vertical + '</td><td>' + i.Location + '</td><td>' + i.Count + '</td></tr>'
                        })
                        verticalTable += '</table>'
                    }
                    var emailBody = emailData.Mail_Body.replace(/#N#/g, arrData.length)
                        .replace(/#date#/g, moment(vUploadDate).format('DD MMM, YYYY'))
                        .replace(/#Vertical_Location_Table#/g, verticalTable);

                    var emailSubject = emailData.Mail_Subject.replace(/#date#/g, moment(vUploadDate).format('DD MMM, YYYY'));

                    var resEmail = await emailService.sendEmailViaBH({
                        Mail_Subject: emailSubject,
                        Mail_Body: emailBody,
                        // Mail_Title: emailData.Mail_Titile,
                        Mail_Title: 'BAPortal',
                        ToMail_Ids: toEmailArr,
                        CcMail_Ids: ccEmailArr, //['rewale.Megha@mahindra.com'], 
                        Attachments: ["E:/APMS/APMS_TEST/HELP/BillHub BA UserManual.pdf"] //fileName need to add
                    })
                    //return resEmail
                }
                res.status(200).send(apiResponse.successFormat(`Success`, `OK.`, [], []));
            }
        } else
            res.status(200).send(apiResponse.successFormat(`fail`, `No data found.`, [], []));

    } catch (error) {
        console.log('error in bookedInvMail', error)
        throw error
    }
}
module.exports = {
    bookedInvMail
};