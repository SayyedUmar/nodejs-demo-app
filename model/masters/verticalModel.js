module.exports = (sequelize, DataTypes) => {
    const verticalModel = sequelize.define('vertical', {
        Vertical_Id: {
            type: DataTypes.INTEGER,
            required: true,
            primaryKey: true,
            autoIncrement: true
        },
        Vertical_Name: {
            type: DataTypes.STRING
        },
        Vertical_Code: {
            type: DataTypes.STRING
        },
        Active: {
            type: DataTypes.STRING
        },
        Updated_By: {
            type: DataTypes.INTEGER
        },
        Updated_On: {
            type: DataTypes.DATE
        },
        Vertical_ShortName: {
            type: DataTypes.STRING
        },
        Vertical_Head_Email: {
            type: DataTypes.STRING
        }
    }, {
        tableName: 'vertical',
        timestamps: false,
        paranoid: true
    })
    return verticalModel
}