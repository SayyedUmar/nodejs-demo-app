module.exports = (sequelize, DataTypes) => {
  const Users = sequelize.define('users', {

    user_id: {
      type: DataTypes.STRING,
      required: true,
      allowNull: true,
      primaryKey: true
    },
    user_name: {
      type: DataTypes.STRING,
      required: true,
      allowNull: true
    },

    password: {
      type: DataTypes.STRING,
      required: true,
      allowNull: true
    },
    token_id: {
      type: DataTypes.INTEGER,
      required: true,
      allowNull: true
    },
    first_name: {
      type: DataTypes.STRING,
      required: true,
      allowNull: true
    },
    last_name: {
      type: DataTypes.STRING,
      required: true,
      allowNull: true
    },
    role_id: {
      type: DataTypes.INTEGER,
      required: true,
      allowNull: true
    },
    updated_by: {
      type: DataTypes.INTEGER
    },
    updated_on: {
      type: DataTypes.DATE
    },
    created_by: {
      type: DataTypes.INTEGER
    },
    created_on: {
      type: DataTypes.DATE,
      required: true,
      allowNull: true
    },
    active: {
      type: DataTypes.INTEGER,
      required: true
    },
    authToken: {
      type: DataTypes.STRING,
      required: true,
      allowNull: true
    },
    email_id: {
      type: DataTypes.STRING,
      required: true,
      allowNull: true
    },
    emailToken: {
      type: DataTypes.STRING,
      required: true,
      allowNull: true
    },
    alternate_emailIDs: {
      type: DataTypes.STRING,
      required: true,
      allowNull: true
    },
    contact_name: {
      type: DataTypes.STRING,
      required: true,
      allowNull: true
    },
    contact_number: {
      type: DataTypes.INTEGER,
      required: true,
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: false,
    paranoid: true
  })
  return Users
}