module.exports = (sequelize, DataTypes) => {
    const roleModel = sequelize.define('role', {
        Role_Id: {
            type: DataTypes.INTEGER,
            required: true,
            primaryKey: true,
            autoIncrement: true
        },
        Role_Name: {
            type: DataTypes.STRING
        },
        Role_Code: {
            type: DataTypes.STRING
        },
        Active: {
            type: DataTypes.STRING
        },
        Created_By: {
            type: DataTypes.INTEGER
        },
        Created_On: {
            type: DataTypes.DATE
        },
        Updated_By: {
            type: DataTypes.INTEGER
        },
        Updated_On: {
            type: DataTypes.DATE
        }
    }, {
        tableName: 'role',
        timestamps: false,
        paranoid: true
    })
    return roleModel
}