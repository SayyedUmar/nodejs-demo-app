module.exports = (sequelize, DataTypes) => {
  const billInternalOrderMappingModel = sequelize.define('billInternalOrderMapping', {
    ID: {
      type: DataTypes.INTEGER,
      required: true,
      primaryKey: true,
      autoIncrement: true
    },
    BillDetails_Id: {
      type: DataTypes.INTEGER
    },
    Internal_order_id: {
      type: DataTypes.INTEGER
    },
    Amount: {
      type: DataTypes.INTEGER
    },
    Taxcode_id: {
      type: DataTypes.INTEGER
    },
    RefKey1: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'null'
    },
    RefKey3: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'null'
    },
    'W/H_ID': {
      type: DataTypes.INTEGER
    },
    TD: {
      type: DataTypes.INTEGER
    },
    VD: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    Tax: {
      type: DataTypes.INTEGER
    },
    HSN_Code: {
      type: DataTypes.INTEGER
    },
    RefKey2: {
      type: DataTypes.STRING,
      allowNull: true
    },
    TDS: {
      type: DataTypes.INTEGER
    },
    Header_Text: {
      type: DataTypes.STRING
    },
    Assignment: {
      type: DataTypes.STRING
    },
    Item_Text: {
      type: DataTypes.STRING
    },
    GL_Number: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'bill_internal_order_mapping',
    timestamps: false,
    paranoid: true
  })
  return billInternalOrderMappingModel
}