module.exports = (sequelize, DataTypes) => {
  const seviceCategoryModel = sequelize.define('service_category', {
    Service_ID: {
      type: DataTypes.INTEGER,
      required: true,
      primaryKey: true
    },
    Service_code: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    Service_Name: {
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
      type: DataTypes.STRING,
      required: true
    },
    HSN_Code: {
      type: DataTypes.INTEGER,
      required: true,
      primaryKey: true
    },
    Parent_Service_Name: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    }
  }, {
    tableName: 'service_category',
    timestamps: false,
    paranoid: true
  })
  return seviceCategoryModel
}