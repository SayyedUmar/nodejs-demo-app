module.exports = (sequelize, DataTypes) => {
    const userActivityLogModel = sequelize.define('user_activity_log', {
        ID: {
            type: DataTypes.INTEGER,
            required: true,
            allowNull: true,
            primaryKey: true
        },
        Activity_Name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        Time: {
            type: DataTypes.DATE,
            allowNull: true
        },
        Details: {
            type: DataTypes.STRING,
            allowNull: true
        },
        Old_Value: {
            type: DataTypes.STRING,
            allowNull: true
        },
        New_Value: {
            type: DataTypes.STRING,
            allowNull: true
        },
        User_ID: {
            type: DataTypes.INTEGER,
            allowNull: false,
        }
    }, {
        tableName: 'user_activity_log',
        timestamps: false,
        paranoid: true
    })
    return userActivityLogModel
}