var locationToExclude = ["AS IB/IUTN", "OTHERS", "MVML PRE OB", "AS OB", "AS PRE OB", "FES", "M&M (T&B) PRE OB", "MVML", "AS OVERSEAS OB", "M&M (T&B) OB", "FES SWARAJ SEC", "MFORGING", "PTL", "SBU", "POWEROL", "FES STOCKYARD", "AS STOCKYARD", "NETWORK"]
const saveInternalOrder = async (req, res) => {
    try {
        var internalOrderData = req.body.Record
        if (internalOrderData) {
            var validation = []
            if (!internalOrderData.INTRNL_ORDR) {
                validation.push({
                    "Key": "INTRNL_ORDR",
                    "Message": "INTRNL_ORDR field is required."
                })
            }
            if (!internalOrderData.PCG3_VERTICAL) {
                validation.push({
                    "Key": "PCG3_VERTICAL",
                    "Message": "PCG3_VERTICAL field is required."
                })
            }
            console.log("hiii", validation)
            var verticalData = null
            var custData = null
            if (internalOrderData.PCG3_VERTICAL) {
                verticalData = await db.verticalModel.findOne({
                    where: {
                        Vertical_Code: internalOrderData.PCG3_VERTICAL.substr(2, 2),
                        Active: 1
                    },
                    raw: true,
                    attributes: ['Vertical_Name']
                })
                if (_.isEmpty(verticalData)) {
                    validation.push({
                        "Key": "PCG3_VERTICAL",
                        "Message": "Invalid vertical"
                    })
                }
            }
            if (_.isEmpty(internalOrderData.CUSTOMER) && verticalData) {
                custData = await db.customerModel.findOne({
                    where: {
                        Vertical: verticalData.Vertical_Name,
                        IsActive: 1,
                        Customer_Code: {
                            [Op.between]: [1000001, 1000010]
                        }
                    },
                    raw: true,
                    attributes: ['Customer_Code']
                })
                internalOrderData.CUSTOMER = custData.Customer_Code
            }
            if (validation.length == 0) {
                var ioData = {
                    Internal_order_Number: internalOrderData.INTRNL_ORDR,
                    Profit_center: internalOrderData.PRFT_CNTR,
                    Cost_center: internalOrderData.PCG1_INDUSTRY,
                    Business_Area: locationToExclude.indexOf(internalOrderData.LOCATION) > -1 ? internalOrderData.BRANCH : internalOrderData.LOCATION,
                    Customer_Code: internalOrderData.CUSTOMER,
                    Active: 1,
                    Vertical_Name: verticalData.Vertical_Name,
                    Customer_Pan: internalOrderData.CUST_PAN
                }
                var ioRes = await db.internalOrderData
                    .findOne({
                        where: {
                            Internal_order_Number: internalOrderData.INTRNL_ORDR
                        }
                    })
                var resData = null
                try {
                    if (ioRes) {
                        resData = await ioRes.update(ioData)
                    } else {
                        resData = await db.internalOrderData.create(ioData);
                    }
                } catch (e) {
                    console.log("err", e)
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
                            "INTRNL_ORDR": internalOrderData.INTRNL_ORDR,
                            "MSG_SNO": "200",
                            "MSG_TYP": "S",
                            "MESSAGE": "Your request completed successfully."
                        }
                    })
                } else {
                    var response = {
                        "Record": {
                            "INTRNL_ORDR": internalOrderData.INTRNL_ORDR,
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
                        "INTRNL_ORDR": internalOrderData.INTRNL_ORDR ? internalOrderData.INTRNL_ORDR : '',
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
                    "INTRNL_ORDR": "null",
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
                "INTRNL_ORDR": internalOrderData.INTRNL_ORDR ? internalOrderData.INTRNL_ORDR : "",
                "MSG_SNO": "500",
                "MSG_TYP": "E",
                "MESSAGE": _.isEmpty(error) ? `something went wrong` : error,
            }
        } : error
        res.status(500).send(response)
    }
}

module.exports.saveInternalOrder = saveInternalOrder