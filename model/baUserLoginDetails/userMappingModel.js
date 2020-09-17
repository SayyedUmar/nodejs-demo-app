module.exports = (sequelize, DataTypes) => {
    const UserMapping = sequelize.define('user_mapping', {
        EMP_TRANID: {
            type: DataTypes.INTEGER,
            required: true,
            primaryKey: true
        },
        User_ID: {
            type: DataTypes.INTEGER,
            required: true,
        },
        Location_ID: {
            type: DataTypes.INTEGER,
            required: true,
        },
        UPDATED_BY: {
            type: DataTypes.INTEGER
        },
        UPDATED_ON: {
            type: DataTypes.DATE
        }
    }, {
        tableName: 'user_mapping',
        timestamps: false,
        paranoid: true
    })
    return UserMapping
}