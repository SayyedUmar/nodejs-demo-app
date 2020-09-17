module.exports = (sequelize, DataTypes) => {
  const billDetailsModel = sequelize.define('billDetails', {
    BillDetails_ID: {
      type: DataTypes.INTEGER,
      required: true,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    MemoID: {
      type: DataTypes.INTEGER,
      required: true,
      allowNull: false
    },
    BillNo: {
      type: DataTypes.STRING
    },
    Amount: {
      type: DataTypes.DOUBLE,
    },
    BillDate: {
      type: DataTypes.DATE
    },
    status: {
      type: DataTypes.STRING
    },
    IGST: {
      type: DataTypes.DOUBLE
    },
    CGST: {
      type: DataTypes.DOUBLE
    },
    SGST: {
      type: DataTypes.DOUBLE
    },
    OtherCharges: {
      type: DataTypes.DOUBLE
    },
    TaxableAmount: {
      type: DataTypes.DOUBLE
    },
    Service_code: {
      type: DataTypes.INTEGER
    },
    Reason: {
      type: DataTypes.STRING
    },
    Billing_To_code: {
      type: DataTypes.INTEGER
    },
    Billing_From_code: {
      type: DataTypes.INTEGER
    },
    Comments: {
      type: DataTypes.STRING
    },
    BA_Code: {
      type: DataTypes.INTEGER
    },
    UpdatedBy: {
      type: DataTypes.INTEGER
    },
    UpdatedOn: {
      type: DataTypes.DATE
    },
    ApprovedBy: {
      type: DataTypes.INTEGER
    },
    ApprovedOn: {
      type: DataTypes.DATE
    },
    SAPUploadOn: {
      type: DataTypes.DATE
    },
    PaymentRequestedOn: {
      type: DataTypes.DATE
    },
    PaymentReleasedOn: {
      type: DataTypes.DATE
    },
    HSN_Code: {
      type: DataTypes.STRING
    },
    AcknowledgedOn: {
      type: DataTypes.DATE
    },
    AcknowledgedBy: {
      type: DataTypes.INTEGER
    },
    TotalPayment_Released: {
      type: DataTypes.INTEGER
    },
    Edited_On: {
      type: DataTypes.DATE
    },
    Edited_By: {
      type: DataTypes.INTEGER
    },
    Customer_Name: {
      type: DataTypes.STRING
    },
    File_Path: {
      type: DataTypes.STRING
    },
    TotalPayment_Requested: {
      type: DataTypes.INTEGER
    },
    DueDate: {
      type: DataTypes.DATE
    },
    Advance_Payment: {
      type: DataTypes.INTEGER
    },
    Advance_Document: {
      type: DataTypes.STRING
    },
    Advance_TDS: {
      type: DataTypes.INTEGER
    },
    Additional_Amount: {
      type: DataTypes.DOUBLE,
      required: true,
      allowNull: false
    },
    Trade_Discount: {
      type: DataTypes.DOUBLE,
      required: true,
      allowNull: false
    },
    ReversedOn: {
      type: DataTypes.DATE
    },
    Inv_Source: {
      type: DataTypes.STRING
    },
    IsPO: {
      type: DataTypes.STRING
    }
  }, {
    tableName: 'billdetails',
    timestamps: false,
    paranoid: true
  })
  return billDetailsModel
}