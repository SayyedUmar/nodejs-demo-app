module.exports = (sequelize, DataTypes) => {
  const draftBillsModel = sequelize.define('draft_bills', {
    Draft_Bill_ID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      required: true,
      primaryKey: true
    },
    MemoID: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    BillNo: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    Amount: {
      type: DataTypes.DOUBLE,
      required: true,
      allowNull: false
    },
    BillDate: {
      type: DataTypes.DATE,
      required: true
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false
    },
    IGST: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    CGST: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    SGST: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    OtherCharges: {
      type: DataTypes.INTEGER
    },
    TaxableAmount: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    Service_code: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    Reason: {
      type: DataTypes.STRING
    },
    Billing_To_code: {
      type: DataTypes.INTEGER,
      required: true,
      allowNull: false
    },
    Billing_From_code: {
      type: DataTypes.INTEGER,
      required: true,
      allowNull: false
    },
    Comments: {
      type: DataTypes.STRING
    },
    BA_Code: {
      type: DataTypes.INTEGER,
      required: true,
      allowNull: false
    },
    UpdatedBy: {
      type: DataTypes.INTEGER,
      required: true,
    },
    UpdatedOn: {
      type: DataTypes.DATE
    },
    File_Path: {
      type: DataTypes.STRING,
      required: true
    },
    HSN_Code: {
      type: DataTypes.STRING,
      required: true
    },
    Customer_Name: {
      type: DataTypes.STRING
    },
    Additional_Amount: {
      type: DataTypes.DOUBLE,
      required: true
    },
    Trade_Discount: {
      type: DataTypes.DOUBLE
    },
    CreatedOn: {
      type: DataTypes.DATE
    },
    Inv_Source: {
      type: DataTypes.STRING
    },
    IsPO: {
      type: DataTypes.INTEGER
    }
  }, {
    tableName: 'draft_bills',
    timestamps: false,
    paranoid: true
  })
  return draftBillsModel
}