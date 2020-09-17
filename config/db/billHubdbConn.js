const opts = {
  define: {
    // prevent sequelize from pluralizing table names
    freezeTableName: true,
    timestamps: false
  }
}

const sequelize = new Sequelize(`mysql://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`, opts)

sequelize
  .authenticate()
  .then(() => {
    console.log('BillHub database Connection has been established successfully.')
  })
  .catch(err => {
    console.error('Unable to connect to Billhub database:', err)
  })

const db = {}

db.sequelize = sequelize
db.Sequelize = Sequelize

// Models/tables

db.ba = require('../../model/baUserLoginDetails/baDetailsModel')(sequelize, Sequelize)
db.users = require('../../model/baUserLoginDetails/usersModel')(sequelize, Sequelize)
db.baConcessionDetails = require('../../model/baUserLoginDetails/baConcessionDetailsModel')(sequelize, Sequelize)
db.baWHTaxMapping = require('../../model/baUserLoginDetails/baWHTaxMappingModel')(sequelize, Sequelize)
db.userMapping = require('../../model/baUserLoginDetails/userMappingModel')(sequelize, Sequelize)

//log table
db.userActivityLog = require('../../model/userActivityLogModel')(sequelize, Sequelize)
db.errorLog = require('../../model/errorLogModel')(sequelize, Sequelize)
db.billActivity = require('../../model/billActivityModel')(sequelize, Sequelize)

//Master Tables
db.state = require('../../model/masters/stateModel')(sequelize, Sequelize)
db.rejectionReasons = require('../../model/masters/rejectionReasonModel')(sequelize, Sequelize)
db.serviceCategory = require('../../model/masters/serviceCategoryModel')(sequelize, Sequelize)
db.fileTypeMst = require('../../model/masters/fileTypeMstModel')(sequelize, Sequelize)
db.internalOrderData = require('../../model/internalOrderModel')(sequelize, Sequelize)
db.location = require('../../model/masters/locationModel')(sequelize, Sequelize)
db.withholding_tax = require('../../model/masters/withHoldingTaxModel')(sequelize, Sequelize)
db.taxCode = require('../../model/masters/taxCodeModel')(sequelize, Sequelize)
db.glCode = require('../../model/masters/glCodeModel')(sequelize, Sequelize)
db.onHoldReasons = require('../../model/masters/onHoldReasons')(sequelize, Sequelize)
db.customerModel = require('../../model/masters/customerModel')(sequelize, Sequelize)
db.verticalModel = require('../../model/masters/verticalModel')(sequelize, Sequelize)
db.roleModel = require('../../model/masters/roleModel')(sequelize, Sequelize)
db.mailformatModel = require('../../model/masters/mailformatModel')(sequelize, Sequelize)

db.memoDetails = require('../../model/transaction/memoModel')(sequelize, Sequelize)
db.draftfildetails = require('../../model/transaction/draftBillsFileDetailsModel')(sequelize, Sequelize)
db.billDetails = require('../../model/transaction/billDetailsModel')(sequelize, Sequelize)
db.billFileDetails = require('../../model/transaction/billFileDetailsModel')(sequelize, Sequelize)

db.draftBills = require('../../model/transaction/draftBillsModel')(sequelize, Sequelize)
db.draftbaseTransMapping = require('../../model/transaction/draftbillbaseTransMappingModel')(sequelize, Sequelize)
db.billBaseTransMapping = require('../../model/transaction/billbaseTransMappingModel')(sequelize, Sequelize)
db.billInternalOrderMapping = require('../../model/transaction/billInternalOrderMappingModel')(sequelize, Sequelize)

db.vendorInvoice = require('../../model/transaction/vendorInvoiceModel')(sequelize, Sequelize)
db.advanceDocumentMapping = require('../../model/transaction/advanceDocumentMappingModel')(sequelize, Sequelize)

db.transactionBatchLog = require('../../model/transaction/transactionBatchLogModel')(sequelize, Sequelize)
db.auditLogExpense = require('../../model/transaction/auditLogExpenseModel')(sequelize, Sequelize)
db.expenseModel = require('../../model/transaction/expenseModel')(sequelize, Sequelize)
db.advanceDebitNotes = require('../../model/transaction/advanceDebitNotesModel')(sequelize, Sequelize)
db.auditLogPayment = require('../../model/transaction/auditLogPaymentModel')(sequelize, Sequelize)
db.sapPaymentDetais = require('../../model/transaction/sapPaymentDetailsModel')(sequelize, Sequelize)
db.onholdBills = require('../../model/transaction/onholdBillsModel')(sequelize, Sequelize)
db.paymentProcessedDetails = require('../../model/transaction/paymentProcessedDetailsModel')(sequelize, Sequelize)
db.openPayments = require('../../model/transaction/openPaymentsModel')(sequelize, Sequelize)
db.paymentModel = require('../../model/transaction/paymentModel')(sequelize, Sequelize)

db.memoDetails.belongsTo(db.users, {
  foreignKey: 'Submit_To_ID',
  targetKey: 'user_id'
})
db.billDetails.belongsTo(db.memoDetails, {
  foreignKey: 'MemoID',
  targetKey: 'Memo_ID'
})
db.billDetails.belongsTo(db.users, {
  foreignKey: 'ApprovedBy',
  targetKey: 'user_id'
})
db.billDetails.hasOne(db.billFileDetails, {
  foreignKey: 'Bill_Details_ID',
  targetKey: 'BillDetails_ID'
})

db.memoDetails.belongsTo(db.ba, {
  foreignKey: 'ba_code',
  targetKey: 'ba_id'
})
db.billDetails.belongsTo(db.ba, {
  foreignKey: 'ba_code',
  targetKey: 'ba_id'
})
db.memoDetails.belongsTo(db.location, {
  foreignKey: 'Submittion_Location_Code',
  targetKey: 'location_id'
})
db.ba.belongsTo(db.users, {
  foreignKey: 'ba_group_id',
  targetKey: 'token_id'
})
db.draftBills.belongsTo(db.ba, {
  foreignKey: 'BA_Code',
  targetKey: 'ba_id'
})
db.transactionBatchLog.belongsTo(db.billDetails, {
  foreignKey: 'bill_id',
  targetKey: 'BillDetails_ID'
})
db.expenseModel.belongsTo(db.billDetails, {
  foreignKey: 'Bill_Details_ID',
  targetKey: 'BillDetails_ID'
})
db.billDetails.hasOne(db.expenseModel, {
  foreignKey: 'Bill_Details_ID',
  targetKey: 'BillDetails_ID'
})
db.billDetails.hasOne(db.advanceDocumentMapping, {
  foreignKey: 'bill_detail_id',
  targetKey: 'BillDetails_ID'
})
db.billDetails.hasOne(db.onholdBills, {
  foreignKey: 'BillDetails_ID',
  targetKey: 'BillDetails_ID'
})
db.expenseModel.belongsTo(db.internalOrderData, {
  foreignKey: 'Order_no',
  targetKey: 'Internal_order_Number'
})
db.expenseModel.belongsTo(db.ba, {
  foreignKey: 'Vendor',
  targetKey: 'ba_code'
})
db.paymentProcessedDetails.belongsTo(db.billDetails, {
  foreignKey: 'BillDetails_ID',
  targetKey: 'BillDetails_ID'
})
db.paymentProcessedDetails.belongsTo(db.expenseModel, {
  foreignKey: 'BillDetails_ID',
  targetKey: 'Bill_Details_ID'
})
db.paymentModel.belongsTo(db.expenseModel, {
  foreignKey: 'Document_No',
  targetKey: 'Document_No'
})
db.internalOrderData.belongsTo(db.customerModel, {
  foreignKey: 'Customer_Code',
  targetKey: 'Customer_Code'
})
db.users.belongsTo(db.roleModel, {
  foreignKey: 'role_id',
  targetKey: 'Role_Id'
})
module.exports = db