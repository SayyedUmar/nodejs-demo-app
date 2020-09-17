module.exports = (sequelize, DataTypes) => {
  const draftFileDetailsModel = sequelize.define('draft_bills_file_details', {
    Draft_Bill_File_Id: {
      type: DataTypes.INTEGER,
      required: true,
      primaryKey: true,
      autoIncrement: true
    },
    Draft_Bill_Details_ID: {
      type: DataTypes.INTEGER,
      required: true,
      allowNull: false
    },
    FilePath: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    File_Name: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    Created_By: {
      type: DataTypes.INTEGER
    },
    Created_On: {
      type: DataTypes.DATE
    },
    File_Type: {
      type: DataTypes.STRING,
    }
  }, {
    tableName: 'draft_bills_file_details',
    timestamps: false,
    paranoid: true
  })
  return draftFileDetailsModel
}