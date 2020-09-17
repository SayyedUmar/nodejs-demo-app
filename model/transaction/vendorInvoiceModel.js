module.exports = (sequelize, DataTypes) => {
  const vendorInvoiceModel = sequelize.define('vendor_invoice', {
    vendor_invoice_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      required: true,
      primaryKey: true
    },
    event: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    src_sys: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    trn_batchid: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    co_code: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    doc_date: {
      type: DataTypes.DATE
    },
    reference: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    post_date: {
      type: DataTypes.DATE
    },
    currency: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    invoice_amount: {
      type: DataTypes.DOUBLE,
      required: true,
      allowNull: false
    },
    vendor_code: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    alternate_recon_gl: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    business_place: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    base_date: {
      type: DataTypes.DATE
    },
    withholding_type: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    withholding_code: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    withholding_tax_base: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    exchange_rate: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    line_item: {
      type: DataTypes.INTEGER,
      required: true,
      allowNull: false
    },
    gl_id: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    item_text: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    internal_order: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    cost_center: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    basetrans_type: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    base_transaction: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    base_transaction_date: {
      type: DataTypes.DATE
    },
    quantity: {
      type: DataTypes.INTEGER,
      required: true,
      allowNull: false
    },
    unit_of_measurement: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    tax_code: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    assignment: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    hsn_code: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    payment_method: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    transaction_amount: {
      type: DataTypes.DOUBLE,
      required: true,
      allowNull: false
    },
    purchase_order: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    po_line_item: {
      type: DataTypes.INTEGER,
      required: true,
      allowNull: false
    },
    vendor_code2: {
      type: DataTypes.STRING,
      required: true,
      allowNull: false
    },
    created_by: {
      type: DataTypes.INTEGER,
      required: true,
    },
    updated_by: {
      type: DataTypes.INTEGER,
      required: true,
    },
    created_on: {
      type: DataTypes.DATE
    },
    updated_on: {
      type: DataTypes.DATE
    },
    doc_type: {
      type: DataTypes.STRING
    },
    payment_term: {
      type: DataTypes.STRING
    },
    bill_details_id: {
      type: DataTypes.STRING
    },
    bill_internal_order_id: {
      type: DataTypes.STRING
    },
    status: {
      type: DataTypes.STRING
    }
  }, {
    tableName: 'vendor_invoice',
    timestamps: false,
    paranoid: true
  })
  return vendorInvoiceModel
}