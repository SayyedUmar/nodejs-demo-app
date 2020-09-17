module.exports = (sequelize, DataTypes) => {
    const internalOrderModel = sequelize.define('internal_order', {
        Internal_order_id: {
            type: DataTypes.INTEGER,
            required: true,
            primaryKey: true,
            autoIncrement: true
        },
        Internal_order_Number: {
            type: DataTypes.STRING,
            allowNull: true
        },
        Profit_center: {
            type: DataTypes.STRING,
            allowNull: true
        },
        Cost_center: {
            type: DataTypes.STRING,
            allowNull: true
        },
        Business_Area: {
            type: DataTypes.STRING,
            allowNull: true
        },
        Customer_Code: {
            type: DataTypes.STRING,
            allowNull: true
        },
        Active: {
            type: DataTypes.STRING,
            allowNull: true
        },
        Vertical_Name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        Customer_Pan: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        tableName: 'internal_order',
        timestamps: false,
        paranoid: true
    })
    return internalOrderModel
}