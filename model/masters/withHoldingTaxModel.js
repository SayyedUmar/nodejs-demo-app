module.exports = (sequelize, DataTypes) => {
  const mstWithHoldingTaxModel = sequelize.define('withHoldingTax', {
    'w/h_id': {
      type: DataTypes.INTEGER,
      required: true,
      primaryKey: true
    },
    'w/h_tax_type': {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    'w/h_tax_code': {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    'tax_rate': {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    }
  }, {
    tableName: 'withholding_tax',
    timestamps: false,
    paranoid: true
  })
  return mstWithHoldingTaxModel
}