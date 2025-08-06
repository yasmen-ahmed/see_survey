const User = require('../models/User');
const Role = require('../models/Role');
const UserRole = require('../models/UserRole');

// Import associations to ensure they are loaded
require('../models/associations');

class UserRoleService {
  
  /**
   * Assign a role to a user
   */
  static async assignRoleToUser(userId, roleId, assignedBy = null) {
    try {
      // Check if user exists
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if role exists
      const role = await Role.findByPk(roleId);
      if (!role) {
        throw new Error('Role not found');
      }

      // Check if role is active
      if (!role.is_active) {
        throw new Error('Role is not active');
      }

      // Check if user already has this role
      const existingUserRole = await UserRole.findOne({
        where: {
          user_id: userId,
          role_id: roleId,
          is_active: true
        }
      });

      if (existingUserRole) {
        throw new Error('User already has this role');
      }

      // Assign the role
      const userRole = await UserRole.create({
        user_id: userId,
        role_id: roleId,
        assigned_by: assignedBy,
        assigned_at: new Date(),
        is_active: true
      });

      return userRole;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove a role from a user
   */
  static async removeRoleFromUser(userId, roleId) {
    try {
      const userRole = await UserRole.findOne({
        where: {
          user_id: userId,
          role_id: roleId,
          is_active: true
        }
      });

      if (!userRole) {
        throw new Error('User does not have this role');
      }

      // Soft delete by setting is_active to false
      await userRole.update({
        is_active: false
      });

      return { message: 'Role removed successfully' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all roles for a user
   */
  static async getUserRoles(userId) {
    try {
      const userRoles = await UserRole.findAll({
        where: {
          user_id: userId,
          is_active: true
        },
        include: [{
          model: Role,
          as: 'role',
          where: { is_active: true },
          required: true
        }]
      });

      return userRoles.map(ur => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
        permissions: ur.role.permissions,
        assigned_at: ur.assigned_at,
        assigned_by: ur.assigned_by
      }));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all users for a role
   */
  static async getRoleUsers(roleId) {
    try {
      const userRoles = await UserRole.findAll({
        where: {
          role_id: roleId,
          is_active: true
        },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'firstName', 'lastName']
        }]
      });

      return userRoles.map(ur => ({
        user: ur.user,
        assigned_at: ur.assigned_at,
        assigned_by: ur.assigned_by
      }));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if user has a specific role
   */
  static async userHasRole(userId, roleName) {
    try {
      const userRole = await UserRole.findOne({
        where: {
          user_id: userId,
          is_active: true
        },
        include: [{
          model: Role,
          as: 'role',
          where: { 
            name: roleName,
            is_active: true 
          },
          required: true
        }]
      });

      return !!userRole;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if user has any of the specified roles
   */
  static async userHasAnyRole(userId, roleNames) {
    try {
      const userRoles = await UserRole.findAll({
        where: {
          user_id: userId,
          is_active: true
        },
        include: [{
          model: Role,
          as: 'role',
          where: { 
            name: roleNames,
            is_active: true 
          },
          required: true
        }]
      });

      return userRoles.length > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UserRoleService; 