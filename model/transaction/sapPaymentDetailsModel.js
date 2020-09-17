module.exports = (sequelize, DataTypes) => {
    const sapPaymentDetailsModel = sequelize.define('sapPaymentDetails', {
        sap_payment_details_id: {
            type: DataTypes.INTEGER,
            required: true,
            primaryKey: true,
            autoIncrement: true
        },
        CO_CODE: {
            type: DataTypes.INTEGER
        },
        FISC_YEAR: {
            type: DataTypes.INTEGER
        },
        GL_ID: {
            type: DataTypes.INTEGER
        },
        POST_DATE: {
            type: DataTypes.DATE
        },
        DOC_DATE: {
            type: DataTypes.DATE
        },
        REFERENCE: {
            type: DataTypes.STRING
        },
        HEADER_TEXT: {
            type: DataTypes.STRING
        },
        DOC_TYPE: {
            type: DataTypes.STRING
        },
        DOC_NO: {
            type: DataTypes.STRING
        },
        DOC_ITEM_NO: {
            type: DataTypes.INTEGER
        },
        VEN_CODE: {
            type: DataTypes.STRING
        },
        RECON_GL: {
            type: DataTypes.STRING
        },
        BASE_DATE: {
            type: DataTypes.DATE
        },
        PROFIT_CENTER: {
            type: DataTypes.STRING
        },
        AMT_TRANS: {
            type: DataTypes.DOUBLE
        },
        CURRENCY: {
            type: DataTypes.STRING
        },
        SPECIAL_GL: {
            type: DataTypes.STRING
        },
        BUPLA: {
            type: DataTypes.STRING
        },
        TEXT: {
            type: DataTypes.STRING
        },
        ASSIGNMENT: {
            type: DataTypes.STRING
        },
        ENTRY_DATE: {
            type: DataTypes.DATE
        },
        INV_REFERENCE: {
            type: DataTypes.STRING
        },
        INV_REF_FY: {
            type: DataTypes.STRING
        },
        CLEAR_DOC_NO: {
            type: DataTypes.STRING
        },
        CLEAR_FY: {
            type: DataTypes.STRING
        },
        CLEAR_DATE: {
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
        tableName: 'sap_payment_details',
        timestamps: false,
        paranoid: true
    })
    return sapPaymentDetailsModel
}