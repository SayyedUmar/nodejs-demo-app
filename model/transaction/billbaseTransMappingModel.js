module.exports = (sequelize, DataTypes) => {
  const billbaseTransMappingModel = sequelize.define('baseTransMapping', {
    ID: {
      type: DataTypes.INTEGER,
      required: true,
      primaryKey: true
    },
    Bill_details_id: {
      type: DataTypes.INTEGER,
      required: true
    },
    Doc_Date: {
      type: DataTypes.DATE
    },
    Posting_Date: {
      type: DataTypes.DATE
    },
    Provision_Document_Number: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    Fiscal_year: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    Provision_Document_Item: {
      type: DataTypes.INTEGER,
      required: true,
      allowNull: false
    },
    Internal_order: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    Base_Transaction_Type: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    Base_Transaction_Date: {
      type: DataTypes.DATE,
      required: true,
      allowNull: false
    },
    Base_Transaction_Number: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    Customer_Code: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    Amount_Provisional: {
      type: DataTypes.DOUBLE,
      required: true,
      allowNull: false
    },
    Amount: {
      type: DataTypes.DOUBLE,
      required: true,
      allowNull: false
    },
    Created_On: {
      type: DataTypes.DATE,
      required: true,
      allowNull: false
    },
    Created_By: {
      type: DataTypes.INTEGER,
      required: true,
      allowNull: false
    },
    is_tagged_to_invoice: {
      type: DataTypes.INTEGER
    },
    gl_number: {
      type: DataTypes.STRING
    },
    is_reversed: {
      type: DataTypes.INTEGER
    },
    reversed_date: {
      type: DataTypes.DATE
    },
    bill_internal_order_id: {
      type: DataTypes.INTEGER
    }
  }, {
    tableName: 'bill_base_transaction_mapping',
    timestamps: false,
    paranoid: true
  })
  return billbaseTransMappingModel
}