const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Role = require('../models/Role');
const Project = require('../models/Project');
const UserRole = require('../models/UserRole');
const UserProject = require('../models/UserProject');
const UserRoleService = require('../services/UserRoleService');
const UserProjectService = require('../services/UserProjectService');

// Get all users with their roles and projects
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll({
      include: [
        {
          model: Role,
          as: 'roles',
          through: { attributes: [] }
        },
        {
          model: Project,
          as: 'assignedProjects',
          through: { attributes: [] }
        }
      ]
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

// Get user by ID with roles and projects
router.get('/users/:userId', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId, {
      include: [
        {
          model: Role,
          as: 'roles',
          through: { attributes: [] }
        },
        {
          model: Project,
          as: 'assignedProjects',
          through: { attributes: [] }
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user'
    });
  }
});

// Assign role to user
router.post('/users/:userId/roles', async (req, res) => {
  try {
    const { roleId, assignedBy } = req.body;
    const userId = req.params.userId;

    const result = await UserRoleService.assignRoleToUser(userId, roleId, assignedBy);

    res.json({
      success: true,
      message: 'Role assigned successfully',
      data: result
    });
  } catch (error) {
    console.error('Error assigning role:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Remove role from user
router.delete('/users/:userId/roles/:roleId', async (req, res) => {
  try {
    const { userId, roleId } = req.params;

    await UserRoleService.removeRoleFromUser(userId, roleId);

    res.json({
      success: true,
      message: 'Role removed successfully'
    });
  } catch (error) {
    console.error('Error removing role:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user roles
router.get('/users/:userId/roles', async (req, res) => {
  try {
    const userId = req.params.userId;
    const roles = await UserRoleService.getUserRoles(userId);

    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('Error fetching user roles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user roles'
    });
  }
});

// Assign user to project
router.post('/users/:userId/projects', async (req, res) => {
  try {
    const { projectId, assignedBy, roleInProject, permissions } = req.body;
    const userId = req.params.userId;

    const result = await UserProjectService.assignUserToProject(
      userId, 
      projectId, 
      assignedBy, 
      roleInProject, 
      permissions
    );

    res.json({
      success: true,
      message: 'User assigned to project successfully',
      data: result
    });
  } catch (error) {
    console.error('Error assigning user to project:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Remove user from project
router.delete('/users/:userId/projects/:projectId', async (req, res) => {
  try {
    const { userId, projectId } = req.params;

    await UserProjectService.removeUserFromProject(userId, projectId);

    res.json({
      success: true,
      message: 'User removed from project successfully'
    });
  } catch (error) {
    console.error('Error removing user from project:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user projects
router.get('/users/:userId/projects', async (req, res) => {
  try {
    const userId = req.params.userId;
    const projects = await UserProjectService.getUserProjects(userId);

    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    console.error('Error fetching user projects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user projects'
    });
  }
});

// Get all roles
router.get('/roles', async (req, res) => {
  try {
    const roles = await Role.findAll({
      where: { is_active: true }
    });

    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch roles'
    });
  }
});

// Get users by project
router.get('/projects/:projectId/users', async (req, res) => {
  const projectId = req.params.projectId;

  try {
    const projectUsers = await UserProjectService.getProjectUsers(projectId);

    // Safely extract user objects, filter out nulls if any
    const users = (projectUsers || [])
      .filter(item => item && item.user)
      .map(item => item.user);

    res.json({
      success: true,
      data: users // this will be [] if no users found
    });
  } catch (error) {
    console.error('Error fetching project users:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch project users'
    });
  }
});


// Get all projects
router.get('/projects', async (req, res) => {
  try {
    const projects = await Project.findAll({
      where: { is_active: true },
      include: [
        {
          model: User,
          as: 'assignedUsers',
          through: { attributes: [] }
        }
      ]
    });

    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch projects'
    });
  }
});

module.exports = router; 