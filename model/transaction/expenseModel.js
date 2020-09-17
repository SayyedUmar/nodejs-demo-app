module.exports = (sequelize, DataTypes) => {
    const expenseModel = sequelize.define('expense', {
        ID: {
            type: DataTypes.INTEGER,
            required: true,
            primaryKey: true,
            autoIncrement: true
        },
        AuditLogID: {
            type: DataTypes.INTEGER
        },
        Bill_Details_ID: {
            type: DataTypes.INTEGER
        },
        Profit_Ctr: {
            type: DataTypes.STRING,
        },
        Cost_Ctr: {
            type: DataTypes.STRING,
        },
        Order_no: {
            type: DataTypes.STRING,
        },
        Assignment: {
            type: DataTypes.STRING,
        },
        Invoice_No: {
            type: DataTypes.STRING,
        },
        Bill_No: {
            type: DataTypes.STRING,
        },
        Document_No: {
            type: DataTypes.STRING,
        },
        BusArea: {
            type: DataTypes.STRING,
        },
        'Posting _Date': {
            type: DataTypes.DATE
        },
        Doc_Date: {
            type: DataTypes.DATE
        },
        Amount: {
            type: DataTypes.DOUBLE
        },
        SAP_TEXT: {
            type: DataTypes.STRING,
        },
        Doc_Type: {
            type: DataTypes.STRING,
        },
        Ref_Key_3: {
            type: DataTypes.STRING,
        },
        Ref_Key_2: {
            type: DataTypes.STRING,
        },
        Ref_Key_1: {
            type: DataTypes.STRING,
        },
        With_tax_base_amount: {
            type: DataTypes.DOUBLE
        },
        Withholding_tax_amnt: {
            type: DataTypes.DOUBLE
        },
        Payment_date: {
            type: DataTypes.DATE
        },
        Clearing_Date: {
            type: DataTypes.DATE
        },
        Clearing_Doc: {
            type: DataTypes.STRING,
        },
        Itm: {
            type: DataTypes.INTEGER
        },
        Year_Month: {
            type: DataTypes.STRING,
        },
        Tax: {
            type: DataTypes.STRING,
        },
        Doc_Header_Text: {
            type: DataTypes.STRING,
        },
        Vendor: {
            type: DataTypes.STRING,
        },
        Reference_Key: {
            type: DataTypes.STRING,
        },
        Segment: {
            type: DataTypes.STRING,
        },
        CGST: {
            type: DataTypes.DOUBLE
        },
        SGST: {
            type: DataTypes.DOUBLE
        },
        IGST: {
            type: DataTypes.DOUBLE
        },
        TDS: {
            type: DataTypes.DOUBLE
        },
        'Payment Amount': {
            type: DataTypes.DOUBLE
        },
        IsPaymentDetailsUpdated: {
            type: DataTypes.STRING,
        },
        GST: {
            type: DataTypes.DOUBLE
        },
        TD: {
            type: DataTypes.DOUBLE
        },
        VD: {
            type: DataTypes.DOUBLE
        },
        Expense_Amount: {
            type: DataTypes.DOUBLE
        },
        IsReversal: {
            type: DataTypes.STRING,
        },
        Reversal_Document: {
            type: DataTypes.STRING,
        },
        Deviation_Reason: {
            type: DataTypes.STRING,
        }
    }, {
        tableName: 'expense',
        timestamps: false,
        paranoid: true
    })
    return expenseModel
}