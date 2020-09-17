module.exports = (sequelize, DataTypes) => {
    const mailformatModel = sequelize.define('mailformat', {
        Mail_id: {
            type: DataTypes.INTEGER,
            required: true,
            primaryKey: true,
            autoIncrement: true
        },
        Mail_Subject: {
            type: DataTypes.STRING
        },
        Mail_Body: {
            type: DataTypes.STRING
        },
        Mail_Titile: {
            type: DataTypes.STRING
        },
        Update_by: {
            type: DataTypes.INTEGER
        },
        Updated_on: {
            type: DataTypes.DATE
        }
    }, {
        tableName: 'mailformat',
        timestamps: false,
        paranoid: true
    })
    return mailformatModel
}