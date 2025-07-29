const User = require('../models/User');
const Project = require('../models/Project');
const UserProject = require('../models/UserProject');

class UserProjectService {
  
  /**
   * Assign a user to a project
   */
  static async assignUserToProject(userId, projectId, assignedBy = null, roleInProject = null, permissions = null) {
    try {
      // Check if user exists
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if project exists
      const project = await Project.findByPk(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      // Check if project is active
      if (!project.is_active) {
        throw new Error('Project is not active');
      }

      // Check if user is already assigned to this project
      const existingUserProject = await UserProject.findOne({
        where: {
          user_id: userId,
          project_id: projectId,
          is_active: true
        }
      });

      if (existingUserProject) {
        throw new Error('User is already assigned to this project');
      }

      // Assign the user to the project
      const userProject = await UserProject.create({
        user_id: userId,
        project_id: projectId,
        assigned_by: assignedBy,
        assigned_at: new Date(),
        role_in_project: roleInProject,
        permissions: permissions,
        is_active: true
      });

      return userProject;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove a user from a project
   */
  static async removeUserFromProject(userId, projectId) {
    try {
      const userProject = await UserProject.findOne({
        where: {
          user_id: userId,
          project_id: projectId,
          is_active: true
        }
      });

      if (!userProject) {
        throw new Error('User is not assigned to this project');
      }

      // Soft delete by setting is_active to false
      await userProject.update({
        is_active: false
      });

      return { message: 'User removed from project successfully' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all projects for a user
   */
  static async getUserProjects(userId) {
    try {
      const userProjects = await UserProject.findAll({
        where: {
          user_id: userId,
          is_active: true
        },
        include: [{
          model: Project,
          where: { is_active: true },
          required: true
        }]
      });

      return userProjects.map(up => ({
        id: up.Project.id,
        name: up.Project.name,
        description: up.Project.description,
        status: up.Project.status,
        client: up.Project.client,
        role_in_project: up.role_in_project,
        permissions: up.permissions,
        assigned_at: up.assigned_at,
        assigned_by: up.assigned_by
      }));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all users for a project
   */
  static async getProjectUsers(projectId) {
    try {
      const userProjects = await UserProject.findAll({
        where: {
          project_id: projectId,
          is_active: true
        },
        include: [{
          model: User,
          attributes: ['id', 'username', 'email', 'firstName', 'lastName']
        }]
      });

      return userProjects.map(up => ({
        user: up.User,
        role_in_project: up.role_in_project,
        permissions: up.permissions,
        assigned_at: up.assigned_at,
        assigned_by: up.assigned_by
      }));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if user is assigned to a project
   */
  static async userIsAssignedToProject(userId, projectId) {
    try {
      const userProject = await UserProject.findOne({
        where: {
          user_id: userId,
          project_id: projectId,
          is_active: true
        },
        include: [{
          model: Project,
          where: { is_active: true },
          required: true
        }]
      });

      return !!userProject;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user's role in a project
   */
  static async updateUserProjectRole(userId, projectId, roleInProject) {
    try {
      const userProject = await UserProject.findOne({
        where: {
          user_id: userId,
          project_id: projectId,
          is_active: true
        }
      });

      if (!userProject) {
        throw new Error('User is not assigned to this project');
      }

      await userProject.update({
        role_in_project: roleInProject
      });

      return userProject;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user's permissions in a project
   */
  static async updateUserProjectPermissions(userId, projectId, permissions) {
    try {
      const userProject = await UserProject.findOne({
        where: {
          user_id: userId,
          project_id: projectId,
          is_active: true
        }
      });

      if (!userProject) {
        throw new Error('User is not assigned to this project');
      }

      await userProject.update({
        permissions: permissions
      });

      return userProject;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UserProjectService; 