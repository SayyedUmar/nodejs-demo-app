module.exports = (sequelize, DataTypes) => {
    const glCodeModel = sequelize.define('glcode', {
        Gl_ID: {
            type: DataTypes.INTEGER,
            required: true,
            primaryKey: true
        },
        Gl_code: {
            type: DataTypes.STRING,
            required: true,
            allowNull: false
        },
        Gl_Name: {
            type: DataTypes.STRING,
            required: true,
            allowNull: false
        },
        Gl_Description: {
            type: DataTypes.STRING,
            required: true,
            allowNull: false
        },
        UpdatedOn: {
            type: DataTypes.DATE,
            required: true,
            allowNull: false
        },
        UpdatedBy: {
            type: DataTypes.INTEGER,
            required: true,
            allowNull: false
        },
        IsActive: {
            type: DataTypes.INTEGER,
            required: true
        }
    }, {
        tableName: 'glcode',
        timestamps: false,
        paranoid: true
    })
    return glCodeModel
}