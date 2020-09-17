module.exports = (sequelize, DataTypes) => {
    const auditLogExpenseModel = sequelize.define('audit_log_expense', {
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
        },
        Addinfo_Upload_Date: {
            type: DataTypes.DATE
        },
        AddInfo_File_Name: {
            type: DataTypes.STRING
        },
        AddInfo_File_Path: {
            type: DataTypes.STRING
        },
        AddInfo_Total_Records_Updated: {
            type: DataTypes.INTEGER
        },
    }, {
        tableName: 'audit_log_expense',
        timestamps: false,
        paranoid: true
    })
    return auditLogExpenseModel
}