module.exports = (sequelize, DataTypes) => {
  const stateModel = sequelize.define('state', {
    State_ID: {
      type: DataTypes.INTEGER,
      required: true,
      primaryKey: true
    },
    State_code: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    State_Name: {
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
    Plant_code: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    IsUT: {
      type: DataTypes.INTEGER,
      required: true
    },
    Region_Code: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'state',
    timestamps: false,
    paranoid: true
  })
  return stateModel
}