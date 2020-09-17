module.exports = (sequelize, DataTypes) => {
  const rejectionReasonModel = sequelize.define('reason', {
    Reason_ID: {
      type: DataTypes.INTEGER,
      required: true,
      primaryKey: true
    },
    Reason_code: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    Reason_Name: {
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
    },
    Type: {
      type: DataTypes.STRING
    },
  }, {
    tableName: 'reason',
    timestamps: false,
    paranoid: true
  })
  return rejectionReasonModel
}