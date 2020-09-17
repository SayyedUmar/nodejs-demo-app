module.exports = (sequelize, DataTypes) => {
    const advanceDocumentMappingModel = sequelize.define('advanceDocumentMapping', {
        advance_document_id: {
            type: DataTypes.INTEGER,
            required: true,
            primaryKey: true,
            autoIncrement: true
        },
        bill_detail_id: {
            type: DataTypes.INTEGER,
            required: true
        },
        advance_document_number: {
            type: DataTypes.STRING,
            required: true,
            allowNull: false
        },
        advance_payment: {
            type: DataTypes.DOUBLE,
            required: true,
            allowNull: false
        },
        advance_tds: {
            type: DataTypes.DOUBLE,
            required: true,
            allowNull: false
        },
        fiscal_year: {
            type: DataTypes.STRING,
            required: true,
            allowNull: false
        },
        created_on: {
            type: DataTypes.DATE,
            required: true,
        },
        created_by: {
            type: DataTypes.INTEGER,
            required: true,
        },
        updated_on: {
            type: DataTypes.DATE,
            required: true,
            allowNull: false
        },
        updated_by: {
            type: DataTypes.INTEGER,
            required: true,
            allowNull: false
        },
        doc_type: {
            type: DataTypes.STRING
        },
        doc_date: {
            type: DataTypes.DATE
        },
        post_date: {
            type: DataTypes.DATE
        },
        profit_center: {
            type: DataTypes.STRING
        },
        bussiness_place: {
            type: DataTypes.STRING
        },
        payment_req_no: {
            type: DataTypes.STRING
        },
        document_amount: {
            type: DataTypes.DOUBLE
        }
    }, {
        tableName: 'advance_document_mapping',
        timestamps: false,
        paranoid: true
    })
    return advanceDocumentMappingModel
}