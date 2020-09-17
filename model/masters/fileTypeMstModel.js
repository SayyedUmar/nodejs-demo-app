module.exports = (sequelize, DataTypes) => {
  const filetypemstModel = sequelize.define('fileTypeMst', {
    file_type_id: {
      type: DataTypes.INTEGER,
      required: true,
      allowNull: false
    },
    file_type: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    is_required: {
      type: DataTypes.INTEGER,
      required: true,
      allowNull: false
    },
    files_limit: {
      type: DataTypes.INTEGER,
      required: true,
      allowNull: false
    },
    userid: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    is_active: {
      type: DataTypes.INTEGER,
      required: true
    },
    created_date: {
      type: DataTypes.DATE,
      required: true
    }
  }, {
    tableName: 'filetypemst',
    timestamps: false,
    paranoid: true
  })
  return filetypemstModel
}