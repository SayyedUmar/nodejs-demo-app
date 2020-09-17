module.exports = (sequelize, DataTypes) => {
  const onHoldReasonsModel = sequelize.define('onhold_reasons', {
    OnHold_Reason_ID: {
      type: DataTypes.INTEGER,
      required: true,
      primaryKey: true
    },
    OnHold_Reason_code: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    OnHold_Reason_Name: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    OnHold_Reason_Type: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    UpdatedBy: {
      type: DataTypes.INTEGER
    },
    UpdatedOn: {
      type: DataTypes.DATE
    },
    IsActive: {
      type: DataTypes.INTEGER,
      required: true
    }
  }, {
    tableName: 'onhold_reasons',
    timestamps: false,
    paranoid: true
  })
  return onHoldReasonsModel
}