const Sequelize = require('sequelize')

const opts = {
  define: {
    // prevent sequelize from pluralizing table names
    freezeTableName: true,
    timestamps: false
  }
}

const sequelize = new Sequelize(`mysql://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.BA_DB_NAME}`, opts)

sequelize
  .authenticate()
  .then(() => {
    console.log('BA database Connection has been established successfully.')
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err)
  })

const db = {}

db.sequelize = sequelize
db.Sequelize = Sequelize

// Models/tables
db.users = require(`../../model/baPortal/usersModel`)(sequelize, Sequelize)
db.baDetails = require(`../../model/baPortal/baDetailsModel`)(sequelize, Sequelize)
db.baServiceMapping = require(`../../model/baPortal/baServiceMappingModel`)(sequelize, Sequelize)
db.baAccountMapping = require(`../../model/baPortal/baAccountMappingModel`)(sequelize, Sequelize)
db.baDocsMapping = require(`../../model/baPortal/baDocsMappingModel`)(sequelize, Sequelize)
db.baGstDocMapping = require(`../../model/baPortal/baGstDocMappingModel`)(sequelize, Sequelize)
db.mstCity = require(`../../model/baPortal/masterCityModel`)(sequelize, Sequelize)
db.mstState = require(`../../model/baPortal/masterStateModel`)(sequelize, Sequelize)
db.mstService = require(`../../model/baPortal/masterServiceModel`)(sequelize, Sequelize)
db.mstDocument = require(`../../model/baPortal/masterDocumentsModel`)(sequelize, Sequelize)
db.userOtp = require(`../../model/baPortal/usersOtp`)(sequelize, Sequelize)
db.reasons = require('../../model/baPortal/rejectReasonsModel')(sequelize, Sequelize)
db.emailTemplate = require('../../model/baPortal/emailTemplateModel')(sequelize, Sequelize)
db.performance = require('../../model/baPortal/baPerformanceModel')(sequelize, Sequelize)
db.baUsers = require('../../model/baPortal/baUsersModel')(sequelize, Sequelize)
db.mstBaDepartments = require('../../model/masterBaDepartmentsModel')(sequelize, Sequelize)
db.baConcessionDetails = require(`../../model/baPortal/baConcessionDetailsModel`)(sequelize, Sequelize)
db.mstWithHoldingTaxCodes = require(`../../model/baPortal/mstWithHoldingTaxCodesModel`)(sequelize, Sequelize)
db.baSapcodeGenaration = require(`../../model/baPortal/baSapCodeGenarationModel`)(sequelize, Sequelize)

// Relations
db.baServiceMapping.belongsTo(db.baDetails, {
  foreignKey: 'ba_id',
  targetKey: 'id'
})
db.baAccountMapping.belongsTo(db.baDetails, {
  foreignKey: 'ba_id',
  as: 'baAccountDetails',
  targetKey: 'id'
})
db.baDocsMapping.belongsTo(db.baDetails, {
  foreignKey: 'ba_id',
  targetKey: 'id'
})
db.baGstDocMapping.belongsTo(db.baDetails, {
  foreignKey: 'ba_id',
  targetKey: 'id'
})
db.baDocsMapping.belongsTo(db.mstDocument, {
  foreignKey: 'doc_id',
  targetKey: 'id'
})
db.mstCity.belongsTo(db.mstState, {
  foreignKey: 'state_id',
  targetKey: 'id'
})

module.exports = db