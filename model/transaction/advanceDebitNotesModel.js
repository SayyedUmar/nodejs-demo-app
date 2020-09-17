module.exports = (sequelize, DataTypes) => {
    const advanceDebitNotesModel = sequelize.define('advanceDebitNotes', {
        advance_debit_notes_id: {
            type: DataTypes.INTEGER,
            required: true,
            primaryKey: true,
            autoIncrement: true
        },
        co_code: {
            type: DataTypes.INTEGER
        },
        fiscal_year: {
            type: DataTypes.INTEGER
        },
        gl_id: {
            type: DataTypes.INTEGER
        },
        post_date: {
            type: DataTypes.DATE
        },
        doc_date: {
            type: DataTypes.DATE
        },
        reference: {
            type: DataTypes.STRING
        },
        header_text: {
            type: DataTypes.STRING
        },
        doc_type: {
            type: DataTypes.STRING
        },
        doc_no: {
            type: DataTypes.STRING
        },
        doc_item_no: {
            type: DataTypes.INTEGER
        },
        ven_code: {
            type: DataTypes.STRING
        },
        recon_gl: {
            type: DataTypes.STRING
        },
        base_date: {
            type: DataTypes.DATE
        },
        profit_center: {
            type: DataTypes.STRING
        },
        amt_transaction: {
            type: DataTypes.DOUBLE
        },
        currency: {
            type: DataTypes.STRING
        },
        special_gl: {
            type: DataTypes.STRING
        },
        business_place: {
            type: DataTypes.STRING
        },
        item_text: {
            type: DataTypes.STRING
        },
        assignment: {
            type: DataTypes.STRING
        },
        entry_date: {
            type: DataTypes.DATE
        },
        inv_reference: {
            type: DataTypes.STRING
        },
        inv_ref_fy: {
            type: DataTypes.STRING
        },
        clear_doc_no: {
            type: DataTypes.STRING
        },
        clear_fy: {
            type: DataTypes.STRING
        },
        clear_date: {
            type: DataTypes.DATE
        },
        audit_log_id: {
            type: DataTypes.INTEGER
        },
        created_by: {
            type: DataTypes.INTEGER
        },
        created_on: {
            type: DataTypes.DATE
        },
        updated_by: {
            type: DataTypes.INTEGER
        },
        updated_on: {
            type: DataTypes.DATE
        }
    }, {
        tableName: 'advance_debit_notes',
        timestamps: false,
        paranoid: true
    })
    return advanceDebitNotesModel
}