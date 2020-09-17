class AdvanceDebitNotesClass {
    covertAmount(amt) {
        return amt.indexOf("-") > -1 ? parseFloat(amt) * -1 : parseFloat(amt)
    }
}

const advanceDebitNotesCls = new AdvanceDebitNotesClass()
const fetchAdvanceDebitNotes = async (req, res) => {
    try {
        var reqQuery = req.query
        var userDetails = await db.users.findOne({
            where: {
                user_id: reqQuery.userId
            },
            raw: true
        })
        var baDetails = await db.ba.findOne({
            where: {
                BA_ID: reqQuery.baCode
            },
            raw: true
        })
        var reqBody = {
            "Record": [{
                "VENDOR_CODE": baDetails.ba_code.toString(),
                "VARIANT": "ADV_DN"
            }]
        }
        var auditLogDetails = await db.auditLogPayment.create({
            File_Name: 'T-' + userDetails.token_id + '-' + moment().format("DDMMMYYYY@hh:mm:ss"),
            Upload_Date: moment().format('YYYY-MM-DD HH:mm:ss'),
            User: reqQuery.userId
        })
        var allRecords = []
        let sapUrl = `${process.env.SAP_URL}OpenClearedItem`
        var username = 'POAPIUSER'
        const password = 'Mahindra@123'
        const auth = Buffer.from(username + ':' + password).toString('base64')
        request.post({
            headers: {
                'content-type': `application/json`,
                'Authorization': 'Basic ' + auth
            },
            url: sapUrl,
            json: true,
            body: reqBody
        }, async (err, response, body) => {
            var allAdvances = []
            if (err) {
                //perform error task
                res.status(200).send(apiResponse.errorFormat(`fail`, `error while fetching advance document and debit notes `, {}, []))
            } else {
                if (body != '') {
                    allRecords = body.Record
                    _.forEach(allRecords, record => {
                        if (record.DOC_NO) {
                            allAdvances.push({
                                co_code: record.CO_CODE,
                                fiscal_year: record.FISC_YEAR,
                                gl_id: record.GL_ID,
                                post_date: record.POST_DATE == '9999-12-31' ? null : moment(record.POST_DATE).format('YYYY-MM-DD'),
                                doc_date: record.DOC_DATE == '9999-12-31' ? null : moment(record.DOC_DATE).format('YYYY-MM-DD'),
                                reference: record.REFERENCE,
                                header_text: record.HEADER_TEXT,
                                doc_type: record.DOC_TYPE,
                                doc_no: record.DOC_NO,
                                doc_item_no: record.DOC_ITEM_NO,
                                ven_code: parseInt(record.VEN_CODE),
                                recon_gl: record.RECON_GL,
                                base_date: record.BASE_DATE == '9999-12-31' ? null : moment(record.BASE_DATE).format('YYYY-MM-DD'),
                                profit_center: record.PROFIT_CENTER,
                                amt_transaction: advanceDebitNotesCls.covertAmount(record.AMT_TRANS),
                                currency: record.CURRENCY,
                                special_gl: record.SPECIAL_GL,
                                business_place: record.BUPLA,
                                item_text: record.TEXT,
                                assignment: record.ASSIGNMENT,
                                entry_date: record.ENTRY_DATE == '9999-12-31' ? null : moment(record.ENTRY_DATE).format('YYYY-MM-DD'),
                                inv_reference: record.INV_REFERENCE,
                                inv_ref_fy: record.INV_REF_FY,
                                clear_doc_no: record.CLEAR_DOC_NO,
                                clear_fy: record.CLEAR_FY == '0000' ? null : record.CLEAR_FY,
                                clear_date: record.CLEAR_DATE == '9999-12-31' ? null : moment(record.CLEAR_DATE).format('YYYY-MM-DD'),
                                audit_log_id: auditLogDetails.dataValues.AuditLogID,
                                created_by: reqBody.userId,
                                created_on: moment().format('YYYY-MM-DD HH:mm:ss')
                            })
                        }
                    })
                    if (allAdvances.length > 0) {
                        var deleteAdvanceDoc = await db.advanceDebitNotes.destroy({
                            where: {
                                ven_code: baDetails.ba_code
                            }
                        })
                        var addAdvanceDoc = await db.advanceDebitNotes.bulkCreate(allAdvances, {
                            // updateOnDuplicate: []
                        })
                        res.status(200).send(apiResponse.successFormat(`success`, `Advance document and debit notes fetched successfully`, {}, []))
                    } else {
                        res.status(200).send(apiResponse.errorFormat(`fail`, `advance document and debit notes not found`, {}, []))
                    }
                } else {
                    res.status(200).send(apiResponse.errorFormat(`fail`, `error while fetching advance document and debit notes `, {}, []))
                }
            }
            await db.auditLogPayment.update({
                No_of_Records_added: body.Record && body.Record.length ? body.Record.length : 0,
                Total_No_of_Records: allAdvances.length,
                No_of_Exceptions: body.Record && body.Record.length && allAdvances.length ? body.Record.length - allAdvances.length : 0
            }, {
                where: {
                    AuditLogID: auditLogDetails.dataValues.AuditLogID
                }
            })
        })
    } catch (error) {
        console.log(`error ${JSON.stringify(error)}`)
        const code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
        const response = errorResponse(error)
        res.status(code).send(response)
    }
}
const getAdvanceDebitNotes = async (req, res) => {
    try {
        var reqQuery = req.query
        var baDetails = await db.ba.findOne({
            where: {
                BA_ID: reqQuery.baCode
            },
            raw: true
        })
        // var advWhere = {
        //     doc_no: {
        //         [Op.like]: `%${reqQuery.docNo}%`
        //     },
        //     ven_code: baDetails.ba_code
        // }
        if (reqQuery.type == 'V') {
            var advWhere = {
                ven_code: baDetails.ba_code,
                doc_type: 'KZ',
                doc_no: {
                    [Op.like]: `${reqQuery.docNo}%`,
                    [Op.eq]: Sequelize.col('inv_reference')
                }
            }
        }
        if (reqQuery.type == 'PR') {
            var advWhere = {
                doc_no: {
                    [Op.like]: `${reqQuery.docNo}%`
                },
                ven_code: baDetails.ba_code,
                [Op.or]: [{
                    doc_type: {
                        [Op.not]: 'KG'
                    },
                    doc_no: {
                        [Op.eq]: Sequelize.col('inv_reference')
                    },
                }, {
                    doc_type: 'KG',
                    [Op.or]: [{
                        inv_reference: {
                            [Op.like]: `${reqQuery.krNo}%`
                        }
                    }, {
                        inv_reference: reqQuery.krNo ? reqQuery.krNo : null
                    }]
                }]
            }
        }
        if (reqQuery.type == 'KG') {
            var advWhere = {
                ven_code: baDetails.ba_code,
                doc_type: 'KG',
                [Op.or]: [{
                    inv_reference: {
                        [Op.like]: `${reqQuery.krNo}%`
                    }
                }, {
                    inv_reference: reqQuery.krNo ? reqQuery.krNo : null
                }]
            }
        }
        var advanceDocumentList = await db.advanceDebitNotes.findAll({
            where: advWhere,
            attributes: [
                [db.sequelize.fn('max', db.sequelize.col('advance_debit_notes_id')), 'advance_debit_notes_id'],
                [db.sequelize.fn('max', db.sequelize.col('doc_no')), 'doc_no'],
                [db.sequelize.fn('max', db.sequelize.col('amt_transaction')), 'amt_transaction'],
                [db.sequelize.fn('max', db.sequelize.col('fiscal_year')), 'fiscal_year'],
                [db.sequelize.fn('max', db.sequelize.col('profit_center')), 'profit_center'],
                [db.sequelize.fn('max', db.sequelize.col('doc_type')), 'doc_type'],
                [db.sequelize.fn('max', db.sequelize.col('business_place')), 'business_place'],
                [db.sequelize.fn('max', db.sequelize.col('post_date')), 'post_date'],
                // 'doc_no',
                // 'amt_transaction', 'fiscal_year',
                // 'profit_center', 'doc_date', 'doc_type', 'business_place', 'post_date'
            ],
            group: ['doc_no', 'fiscal_year'],
            raw: true
        })
        var advanceDocumentMapping = await db.advanceDocumentMapping.findAll({
            where: {
                advance_document_number: {
                    [Op.like]: `${reqQuery.docNo}%`
                }
            },
            raw: true
        })
        var advDocObj = _.groupBy(advanceDocumentMapping, 'advance_document_number')
        var allAdvanceDocuments = []
        _.forEach(advanceDocumentList, doc => {
            if (advDocObj[doc.doc_no]) {
                _.forEach(advDocObj[doc.doc_no], adv => {
                    if (adv.fiscal_year == doc.fiscal_year) {
                        doc.amt_transaction -= adv.advance_payment
                    }
                })
            }
            if (doc.amt_transaction > 0) {
                allAdvanceDocuments.push({
                    documentNumber: doc.doc_no,
                    // advanceDebitNotesId: doc.advance_debit_notes_id,
                    advanceAmount: doc.amt_transaction,
                    fiscalYear: doc.fiscal_year,
                    docType: doc.doc_type,
                    businessPlace: doc.business_place,
                    profitCenter: doc.profit_center,
                    postDate: doc.post_date,
                    docDate: doc.doc_date
                })
            }
        })
        res.status(200).send(apiResponse.successFormat(`success`, `List of advance documents and debit notes`, allAdvanceDocuments, []))
    } catch (error) {
        console.log(`error ${JSON.stringify(error)}`)
        const code = (Object.prototype.hasOwnProperty.call(error, 'status')) ? error.code : 500
        const response = errorResponse(error)
        res.status(code).send(response)
    }
}

module.exports = {
    getAdvanceDebitNotes,
    fetchAdvanceDebitNotes
}