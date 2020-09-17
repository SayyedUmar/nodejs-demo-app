module.exports = (sequelize, DataTypes) => {
    const errorLogModel = sequelize.define('error_log', {
        ID: {
            type: DataTypes.INTEGER,
            required: true,
            allowNull: true,
            primaryKey: true
        },
        Error_Code: {
            type: DataTypes.STRING,
            allowNull: true
        },
        Error_Message: {
            type: DataTypes.STRING,
            allowNull: true
        },
        Time_Of_Error: {
            type: DataTypes.DATE,
            allowNull: true
        },
        InnerException: {
            type: DataTypes.STRING,
            allowNull: true
        },
        Stack_Trace: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        tableName: 'error_log',
        timestamps: false,
        paranoid: true
    })
    return errorLogModel
}