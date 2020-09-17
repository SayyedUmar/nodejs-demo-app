module.exports = (sequelize, DataTypes) => {
    const customerModel = sequelize.define('customer', {
        Customer_ID: {
            type: DataTypes.INTEGER,
            required: true,
            primaryKey: true,
            autoIncrement: true
        },
        Customer_Code: {
            type: DataTypes.STRING
        },
        Customer_Name: {
            type: DataTypes.STRING
        },
        Credit_Period: {
            type: DataTypes.INTEGER
        },
        Vertical: {
            type: DataTypes.STRING
        },
        UpdatedBy: {
            type: DataTypes.INTEGER
        },
        UpdatedOn: {
            type: DataTypes.DATE
        },
        IsActive: {
            type: DataTypes.STRING
        },
        Pan_No: {
            type: DataTypes.STRING
        },
        Tax_No: {
            type: DataTypes.STRING
        }
    }, {
        tableName: 'customer',
        timestamps: false,
        paranoid: true
    })
    return customerModel
}