module.exports = (sequelize, DataTypes) => {
    const billActivityModel = sequelize.define('bill_activity', {
        Bill_Activity_ID: {
            type: DataTypes.INTEGER,
            required: true,
            allowNull: true,
            primaryKey: true
        },
        Bill_Details_ID: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        Activity_Code: {
            type: DataTypes.STRING,
            allowNull: true
        },
        Activity_Description: {
            type: DataTypes.STRING,
            allowNull: true
        },
        Activity_Time: {
            type: DataTypes.DATE,
            allowNull: true
        },
        Current_Status: {
            type: DataTypes.STRING,
            allowNull: true
        },
        Previous_Status: {
            type: DataTypes.STRING,
            allowNull: true
        },
        Updated_By: {
            type: DataTypes.INTEGER,
            allowNull: false,
        }
    }, {
        tableName: 'bill_activity',
        timestamps: false,
        paranoid: true
    })
    return billActivityModel
}