module.exports = (sequelize, DataTypes) => {
  const baConcessionDetailsModel = sequelize.define('concession_details', {
    Concession_ID: {
      type: DataTypes.INTEGER,
      required: true,
      primaryKey: true
    },
    BA_GROUP_ID: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    From_Date: {
      type: DataTypes.DATE
    },
    To_Date: {
      type: DataTypes.DATE
    },
    Concession_Rate: {
      type: DataTypes.INTEGER,
      required: true,
      allowNull: false
    },
    Limit: {
      type: DataTypes.INTEGER,
      required: true,
      allowNull: false
    },
    Withholding_Tax_ID: {
      type: DataTypes.INTEGER,
      required: true,
      allowNull: false
    },
    Current_Value: {
      type: DataTypes.INTEGER,
      required: true,
      allowNull: false,
      defaultValue: 0
    },
    Updated_By: {
      type: DataTypes.INTEGER,
      required: true,
      allowNull: false
    },
    Updated_On: {
      type: DataTypes.DATE
    },
    Certificate_No: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    Is_Expired: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false,
      defaultValue: '0'
    }
  }, {
    tableName: 'ba_concession_Details',
    timestamps: false,
    paranoid: true
  })
  return baConcessionDetailsModel
}