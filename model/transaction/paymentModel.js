module.exports = (sequelize, DataTypes) => {
    const paymentsModel = sequelize.define('paymentsModel', {
        ID: {
            type: DataTypes.INTEGER,
            required: true,
            primaryKey: true,
            autoIncrement: true
        },
        AuditLogID: {
            type: DataTypes.INTEGER
        },
        Bill_Details_ID: {
            type: DataTypes.INTEGER
        },
        Profit_Ctr: {
            type: DataTypes.STRING
        },
        BA: {
            type: DataTypes.STRING
        },
        Invoice_No: {
            type: DataTypes.STRING
        },
        Bill_No: {
            type: DataTypes.STRING
        },
        Document_No: {
            type: DataTypes.STRING
        },
        'G/L': {
            type: DataTypes.STRING
        },
        BusArea: {
            type: DataTypes.STRING
        },
        'Posting _Date': {
            type: DataTypes.DATE
        },
        Doc_Date: {
            type: DataTypes.DATE
        },
        PK: {
            type: DataTypes.INTEGER
        },
        Amount: {
            type: DataTypes.DOUBLE
        },
        SAP_TEXT: {
            type: DataTypes.STRING
        },
        Doc_Type: {
            type: DataTypes.STRING
        },
        Item: {
            type: DataTypes.INTEGER
        },
        Clearing_Date: {
            type: DataTypes.DATE
        },
        Year: {
            type: DataTypes.STRING
        },
        Clearing_Doc: {
            type: DataTypes.STRING
        },
        Payment_Request_No: {
            type: DataTypes.STRING
        },
        Status: {
            type: DataTypes.STRING
        }
    }, {
        tableName: 'payment',
        timestamps: false,
        paranoid: true
    })
    return paymentsModel
}