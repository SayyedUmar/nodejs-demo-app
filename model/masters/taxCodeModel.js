module.exports = (sequelize, DataTypes) => {
    const taxCodeModel = sequelize.define('taxcode', {
        tax_id: {
            type: DataTypes.INTEGER,
            required: true,
            primaryKey: true
        },
        tax_code: {
            type: DataTypes.STRING,
            required: true,
            allowNull: false
        },
        Description: {
            type: DataTypes.STRING,
            required: true,
            allowNull: false
        },
        tax_percentage: {
            type: DataTypes.INTEGER,
            required: true
        }
    }, {
        tableName: 'taxcode',
        timestamps: false,
        paranoid: true
    })
    return taxCodeModel
}