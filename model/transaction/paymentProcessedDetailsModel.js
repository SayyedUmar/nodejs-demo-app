module.exports = (sequelize, DataTypes) => {
    const paymentProcessedDetailsModel = sequelize.define('paymentProcessedDetails', {
        Process_ID: {
            type: DataTypes.INTEGER,
            required: true,
            primaryKey: true,
            autoIncrement: true
        },
        BillDetails_ID: {
            type: DataTypes.INTEGER
        },
        Payment_Req_No: {
            type: DataTypes.STRING
        },
        Amount: {
            type: DataTypes.DOUBLE
        },
        Created_By: {
            type: DataTypes.INTEGER
        },
        Created_On: {
            type: DataTypes.DATE
        },
        AB_Doc_No: {
            type: DataTypes.STRING
        },
        Status: {
            type: DataTypes.STRING
        },
        AB_Doc_Date: {
            type: DataTypes.DATE
        },
        Customer_Code: {
            type: DataTypes.STRING
        },
        Reject_Reason: {
            type: DataTypes.STRING
        }
    }, {
        tableName: 'payment_processed_details',
        timestamps: false,
        paranoid: true
    })
    return paymentProcessedDetailsModel
}