module.exports = (sequelize, DataTypes) => {
  const baDetailsModel = sequelize.define('ba_details', {
    ba_id: {
      type: DataTypes.INTEGER,
      required: true,
      primaryKey: true,
      autoIncrement: true
    },
    ba_code: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    ba_name: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    state_code: {
      type: DataTypes.INTEGER,
      required: true,
      allowNull: false
    },
    updatedBy: {
      type: DataTypes.INTEGER
    },
    updatedOn: {
      type: DataTypes.DATE
    },
    isActive: {
      type: DataTypes.INTEGER,
      required: true
    },
    tradeDiscount: {
      type: DataTypes.INTEGER,
      required: true,
      allowNull: false,
      defaultValue: 0
    },
    credit_Period: {
      type: DataTypes.INTEGER,
      required: true,
      allowNull: false,
      defaultValue: 30
    },
    td_Credit_Period: {
      type: DataTypes.INTEGER,
      required: true,
      allowNull: false,
      defaultValue: 10
    },
    ba_group_id: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    is_msmed: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false,
      defaultValue: 'NO'
    },
    bank_acc_no: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    ifsc_code: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    bank_name: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    }

  }, {
    tableName: 'ba',
    timestamps: false,
    paranoid: true
  })
  return baDetailsModel
}