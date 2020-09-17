module.exports = (sequelize, DataTypes) => {
  const locationModel = sequelize.define('location', {
    location_id: {
      type: DataTypes.INTEGER,
      required: true,
      primaryKey: true
    },
    location_code: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    location_name: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    updatedby: {
      type: DataTypes.INTEGER
    },
    updatedon: {
      type: DataTypes.DATE
    },
    isactive: {
      type: DataTypes.STRING,
      required: true
    },
    plant_code: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    isut: {
      type: DataTypes.STRING,
      required: true
    },
    state_code: {
      type: DataTypes.INTEGER,
      required: true
    }
  }, {
    tableName: 'location',
    timestamps: false,
    paranoid: true
  })
  return locationModel
}