const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING(50),
    unique: {
      name: 'unique_username',
      msg: 'Username already exists'
    },
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    unique: {
      name: 'unique_email',
      msg: 'Email already exists'
    },
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  firstName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  NID: {
    type: DataTypes.STRING(20),
    unique: {
      name: 'unique_nid',
      msg: 'NID already exists'
    },
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(100)
  }
}, {
  tableName: 'users',
  timestamps: true
});

// Hash password before saving
User.beforeCreate(async (user) => {
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
});

// Instance method to compare password
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get user roles
User.prototype.getRoles = async function() {
  try {
    // Use Sequelize association to get roles
    const userWithRoles = await User.findByPk(this.id, {
      include: [{
        model: require('./Role'),
        as: 'roles',
        through: {
          model: require('./UserRole'),
          where: { is_active: true }
        },
        where: { is_active: true }
      }]
    });
    
    return userWithRoles ? userWithRoles.roles : [];
  } catch (error) {
    console.error('Error getting user roles:', error);
    return [];
  }
};

// Instance method to get user projects
User.prototype.getAssignedProjects = async function() {
  try {
    // Use Sequelize association to get projects
    const userWithProjects = await User.findByPk(this.id, {
      include: [{
        model: require('./Project'),
        as: 'assignedProjects',
        through: {
          model: require('./UserProject'),
          where: { is_active: true }
        },
        where: { is_active: true }
      }]
    });
    
    return userWithProjects ? userWithProjects.assignedProjects : [];
  } catch (error) {
    console.error('Error getting user projects:', error);
    return [];
  }
};

// Instance method to check if user has a specific role
User.prototype.hasRole = async function(roleName) {
  const roles = await this.getRoles();
  return roles.some(role => role.name === roleName);
};

// Instance method to check if user has any of the specified roles
User.prototype.hasAnyRole = async function(roleNames) {
  const roles = await this.getRoles();
  return roles.some(role => roleNames.includes(role.name));
};

module.exports = User; 