const reverseBaseTransMappings = async (req, res) => {
    let reqBody = req.body;
    try {
        console.log('reverseBaseTransMappings data', reqBody)

        if (reqBody.length > 0) {
            _.forEach(reqBody, async d => {
                let baseTransDate = moment((d.base_transaction_date).toString()).format('YYYY-MM-DD');

                let draftMapping = await db.draftbaseTransMapping.findAll({
                    raw: true,
                    where: {
                        Provision_Document_Number: d.provision_document_number,
                        Fiscal_year: d.fiscal_year,
                        Provision_Document_Item: d.provision_document_item,
                        Internal_order: d.internal_order,
                        Base_Transaction_Type: d.base_transaction_type,
                        Base_Transaction_Date: new Date(baseTransDate), // d.base_transaction_date,
                        Base_Transaction_Number: d.base_transaction_number,
                        gl_number: d.gl_number,
                        Customer_Code: d.vendor_code,
                        is_tagged_to_invoice: 1
                    },
                    attributes: ["ID"]
                });
                if (draftMapping.length > 0) {
                    await db.draftbaseTransMapping.update({
                        is_reversed: 1,
                        reversed_date: moment().format('YYYY-MM-DD HH:mm:ss')
                    }, {
                        where: {
                            Provision_Document_Number: d.provision_document_number,
                            Fiscal_year: d.fiscal_year,
                            Provision_Document_Item: d.provision_document_item,
                            Internal_order: d.internal_order,
                            Base_Transaction_Type: d.base_transaction_type,
                            Base_Transaction_Date: new Date(baseTransDate), // d.base_transaction_date,
                            Base_Transaction_Number: d.base_transaction_number,
                            gl_number: d.gl_number,
                            Customer_Code: d.vendor_code,
                            is_tagged_to_invoice: 1
                        }
                    });
                }
                let billMapping = await db.billBaseTransMapping.findAll({
                    raw: true,
                    where: {
                        Provision_Document_Number: d.provision_document_number,
                        Fiscal_year: d.fiscal_year,
                        Provision_Document_Item: d.provision_document_item,
                        Internal_order: d.internal_order,
                        Base_Transaction_Type: d.base_transaction_type,
                        Base_Transaction_Date: new Date(baseTransDate), //d.base_transaction_date,
                        Base_Transaction_Number: d.base_transaction_number,
                        gl_number: d.gl_number,
                        Customer_Code: d.vendor_code,
                        is_tagged_to_invoice: 1
                    },
                    attributes: ["ID"]
                });
                if (billMapping.length > 0) {
                    await db.billBaseTransMapping.update({
                        is_reversed: 1,
                        reversed_date: moment().format('YYYY-MM-DD HH:mm:ss')
                    }, {
                        where: {
                            Provision_Document_Number: d.provision_document_number,
                            Fiscal_year: d.fiscal_year,
                            Provision_Document_Item: d.provision_document_item,
                            Internal_order: d.internal_order,
                            Base_Transaction_Type: d.base_transaction_type,
                            Base_Transaction_Date: new Date(baseTransDate), //d.base_transaction_date,
                            Base_Transaction_Number: d.base_transaction_number,
                            gl_number: d.gl_number,
                            Customer_Code: d.vendor_code,
                            is_tagged_to_invoice: 1
                        }
                    })
                }
            });
        }
        console.log('Done Updation')
        res.status(200).send('OK');
    } catch (error) {
        console.log('Error in reverseBaseTransMappings', error)
        let code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
        let response = errorResponse(error)
        res.status(code).send(response)
    }
}
module.exports = reverseBaseTransMappings