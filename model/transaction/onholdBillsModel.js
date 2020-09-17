module.exports = (sequelize, DataTypes) => {
    const onholdBillsModel = sequelize.define('onholdBills', {
        OnHold_Bill_ID: {
            type: DataTypes.INTEGER,
            required: true,
            primaryKey: true,
            autoIncrement: true
        },
        BillDetails_ID: {
            type: DataTypes.INTEGER
        },
        OnHold_Date: {
            type: DataTypes.DATE
        },
        Acc_Reason: {
            type: DataTypes.STRING
        },
        Tax_Reason: {
            type: DataTypes.STRING
        },
        Status: {
            type: DataTypes.STRING
        },
        Resolved_Date: {
            type: DataTypes.DATE
        },
        Tax_User_ID: {
            type: DataTypes.INTEGER
        },
        Acc_User_ID: {
            type: DataTypes.INTEGER
        },
        Comm_User_ID: {
            type: DataTypes.INTEGER
        },
        IsBlanketApproved: {
            type: DataTypes.STRING
        },
        IsBlanketApproved_Tax: {
            type: DataTypes.STRING
        },
        expense_id: {
            type: DataTypes.INTEGER
        }
    }, {
        tableName: 'onhold_bills',
        timestamps: false,
        paranoid: true
    })
    return onholdBillsModel
}