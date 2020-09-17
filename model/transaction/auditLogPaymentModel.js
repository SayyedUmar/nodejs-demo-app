module.exports = (sequelize, DataTypes) => {
    const auditLogPaymentModel = sequelize.define('auditLogPayment', {
        AuditLogID: {
            type: DataTypes.INTEGER,
            required: true,
            primaryKey: true,
            autoIncrement: true
        },
        Upload_Date: {
            type: DataTypes.DATE
        },
        Total_No_of_Records: {
            type: DataTypes.INTEGER
        },
        No_of_Records_added: {
            type: DataTypes.INTEGER
        },
        No_of_Exceptions: {
            type: DataTypes.INTEGER
        },
        User: {
            type: DataTypes.INTEGER
        },
        File_Name: {
            type: DataTypes.STRING
        },
        File_Path: {
            type: DataTypes.STRING
        }
    }, {
        tableName: 'audit_log_payment',
        timestamps: false,
        paranoid: true
    })
    return auditLogPaymentModel
}