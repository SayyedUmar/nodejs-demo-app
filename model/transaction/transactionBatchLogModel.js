module.exports = (sequelize, DataTypes) => {
    const transactionBatchLogModel = sequelize.define('transactionBatchLog', {
        transaction_batch_id: {
            type: DataTypes.INTEGER,
            required: true,
            primaryKey: true,
            autoIncrement: true
        },
        bill_id: {
            type: DataTypes.INTEGER
        },
        created_by: {
            type: DataTypes.STRING
        },
        created_on: {
            type: DataTypes.DATE
        },
        success_log: {
            type: DataTypes.STRING
        },
        error_log: {
            type: DataTypes.STRING
        },
        status: {
            type: DataTypes.STRING
        },
        updated_by: {
            type: DataTypes.STRING
        },
        updated_on: {
            type: DataTypes.DATE
        },
        AuditLogID: {
            type: DataTypes.INTEGER
        }
    }, {
        tableName: 'transaction_batch_log',
        timestamps: false,
        paranoid: true
    })
    return transactionBatchLogModel
}