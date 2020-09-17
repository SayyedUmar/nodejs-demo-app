module.exports = (sequelize, DataTypes) => {
  const baWHTaxMappingModel = sequelize.define('baWHTaxMappingDetails', {
    ID: {
      type: DataTypes.INTEGER,
      required: true,
      primaryKey: true
    },
    Ba_Group_ID: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    WH_Tax_ID: {
      type: DataTypes.INTEGER,
      required: true,
      allowNull: false
    },
    Updated_By: {
      type: DataTypes.INTEGER,
      required: true,
      allowNull: false
    },
    Updated_On: {
      type: DataTypes.DATE
    },
    Is_Active: {
      type: DataTypes.INTEGER,
      required: true
    }
  }, {
    tableName: 'ba_w/h_mapping',
    timestamps: false,
    paranoid: true
  })
  return baWHTaxMappingModel
}