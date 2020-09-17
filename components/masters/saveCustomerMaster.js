const saveCustomerMaster = async (req, res) => {
    try {
        var custData = req.body.Record
        if (custData) {
            var validation = []
            if (!custData.CUST_CODE) {
                validation.push({
                    "Key": "CUST_CODE",
                    "Message": "CUST_CODE field is required."
                })
            }
            if (!custData.NAME) {
                validation.push({
                    "Key": "NAME",
                    "Message": "NAME field is required."
                })
            }
            if (!custData.PAN) {
                validation.push({
                    "Key": "PAN",
                    "Message": "PAN field is required."
                })
            }
            if (!custData.TAX_NUM) {
                validation.push({
                    "Key": "TAX_NUM",
                    "Message": "TAX_NUM field is required."
                })
            }
            if (validation.length == 0) {
                var custObj = {
                    Customer_Code: custData.CUST_CODE,
                    Customer_Name: custData.NAME,
                    Credit_Period: 0,
                    Vertical: null,
                    UpdatedBy: 1,
                    UpdatedOn: moment().format('YYYY-MM-DD HH:mm:ss'),
                    IsActive: 1,
                    Pan_No: custData.PAN,
                    Tax_No: custData.TAX_NUM
                }
                var custRes = await db.customerModel
                    .findOne({
                        where: {
                            Customer_Code: custData.CUST_CODE,
                        }
                    })
                var resData = null
                try {
                    if (custRes) {
                        resData = await custRes.update(custObj)
                    } else {
                        resData = await db.customerModel.create(custObj);
                    }
                } catch (e) {
                    console.log("err", e.original)
                    if (e && e.original && e.original.sqlMessage) {
                        resData = {
                            "Key": e.original.sqlMessage.split('\'')[1],
                            "Message": e.original.sqlMessage.replace(/at row 1/g, '').replace(/\'/g, '')
                        }
                    } else {
                        resData = {
                            "Key": '',
                            "Message": `something went wrong`
                        }
                    }
                }
                if (resData && resData.dataValues) {
                    res.status(200).send({
                        "Record": {
                            "CUST_CODE": custData.CUST_CODE ? custData.CUST_CODE : "",
                            "MSG_SNO": "200",
                            "MSG_TYP": "S",
                            "MESSAGE": "Your request completed successfully."
                        }
                    })
                } else {
                    var response = {
                        "Record": {
                            "CUST_CODE": custData.CUST_CODE ? custData.CUST_CODE : "",
                            "MSG_SNO": "400",
                            "MSG_TYP": "E",
                            "MESSAGE": "Failed to process your request",
                            "Validation": []
                        }
                    }
                    response.Record.Validation.push(resData)
                    res.status(400).send(response)
                }
            } else {
                var response = {
                    "Record": {
                        "CUST_CODE": custData.CUST_CODE ? custData.CUST_CODE : "",
                        "MSG_SNO": "400",
                        "MSG_TYP": "E",
                        "MESSAGE": "Failed to process your request",
                        "Validation": validation
                    }
                }
                res.status(400).send(response)
            }
        } else {
            res.status(400).send({
                "Record": {
                    "CUST_CODE": "",
                    "MSG_SNO": "400",
                    "MSG_TYP": "E",
                    "MESSAGE": "Record is empty",
                    "Validation": "Record is empty"
                }
            })
        }
    } catch (error) {
        console.log(`error ${JSON.stringify(error)}`)
        var response = _.isEmpty(error) ? {
            "Record": {
                "CUST_CODE": custData.CUST_CODE ? custData.CUST_CODE : "",
                "MSG_SNO": "500",
                "MSG_TYP": "E",
                "MESSAGE": _.isEmpty(error) ? `something went wrong` : error,
            }
        } : error
        res.status(500).send(response)
    }
}

module.exports.saveCustomerMaster = saveCustomerMaster