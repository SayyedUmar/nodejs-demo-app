module.exports = (sequelize, DataTypes) => {
  const memoDetailModel = sequelize.define('memoDetails', {
    Memo_ID: {
      type: DataTypes.INTEGER,
      required: true,
      primaryKey: true,
      autoIncrement: true
    },
    Memo_Date: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    Memo_Number: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    Submit_To_ID: {
      type: DataTypes.INTEGER,
      required: true,
      primaryKey: true
    },
    BA_Code: {
      type: DataTypes.INTEGER,
      required: true,
      primaryKey: true
    },
    Submittion_Location_Code: {
      type: DataTypes.INTEGER,
      required: true,
      primaryKey: true
    },
    CreatedBy: {
      type: DataTypes.INTEGER
    },
    CreatedOn: {
      type: DataTypes.DATE
    },
    FiscalYear: {
      type: DataTypes.STRING,
      required: true
    }
  }, {
    tableName: 'memodetails',
    timestamps: false,
    paranoid: true
  })
  return memoDetailModel
}