const { Notification, User, UserProject, Survey, Role, UserRole, Project } = require('../models/associations');
const { Op } = require('sequelize');

class NotificationService {
  // Create notification for survey creation
  static async createSurveyCreatedNotification(surveyId, creatorId, projectName) {
    try {
      // Get all users who should be notified about new surveys
      const usersToNotify = await this.getUsersToNotifyForSurveyCreation(projectName);
      
      const notifications = [];
      for (const userId of usersToNotify) {
        if (userId !== creatorId) { // Don't notify the creator
          notifications.push({
            user_id: userId,
            title: 'New Survey Created',
            message: `A new survey has been created for project ${projectName}`,
            type: 'survey_created',
            related_survey_id: surveyId,
            related_project_id: null // Set to null since we're using project name as string
          });
        }
      }
      
      if (notifications.length > 0) {
        await Notification.bulkCreate(notifications);
      }
      
      return notifications.length;
    } catch (error) {
      console.error('Error creating survey created notification:', error);
      throw error;
    }
  }

  // Create notification for status changes
  static async createStatusChangeNotification(surveyId, oldStatus, newStatus, changedByUserId, projectName, assignedUserId) {
    try {
      // Get all users who should be notified about status changes
      const usersToNotify = await this.getUsersToNotifyForStatusChange(projectName, newStatus, surveyId, assignedUserId);
      
      const notifications = [];
      for (const userId of usersToNotify) {
        if (userId !== changedByUserId) { // Don't notify the user who made the change
          const title = this.getStatusChangeTitle(newStatus);
          const message = this.getStatusChangeMessage(surveyId, oldStatus, newStatus);
          
          notifications.push({
            user_id: userId,
            title,
            message,
            type: 'status_change',
            related_survey_id: surveyId,
            related_project_id: null // Set to null since we're using project name as string
          });
        }
      }
      
      if (notifications.length > 0) {
        await Notification.bulkCreate(notifications);
      }
      
      return notifications.length;
    } catch (error) {
      console.error('Error creating status change notification:', error);
      throw error;
    }
  }

  // Create notification for survey assignment (for site engineers)
  static async createAssignmentNotification(surveyId, assignedUserId, assignedByUserId, projectName) {
    try {
      // Check if assigned user is a site engineer
      const assignedUser = await User.findByPk(assignedUserId, {
        include: [{
          model: Role,
          as: 'roles',
          through: {
            model: UserRole,
            where: { is_active: true }
          },
          where: { is_active: true }
        }]
      });

      if (!assignedUser) {
        console.log('Assigned user not found, skipping assignment notification');
        return 0;
      }

      const roles = assignedUser.roles.map(role => role.name);
      
      // Only notify site engineers when assigned to surveys
      if (roles.includes('site_engineer')) {
        const notification = {
          user_id: assignedUserId,
          title: 'New Survey Assignment',
          message: `You have been assigned to survey ${surveyId}`,
          type: 'assignment',
          related_survey_id: surveyId,
          related_project_id: null // Set to null since we're using project name as string
        };
        
        await Notification.create(notification);
        return 1;
      }
      
      return 0;
    } catch (error) {
      console.error('Error creating assignment notification:', error);
      throw error;
    }
  }

  // Create notification for rework requests
  static async createReworkNotification(surveyId, requestedByUserId, projectName) {
    try {
      // Get all coordinators and approvers for the project
      const usersToNotify = await this.getUsersToNotifyForRework(projectName);
      
      const notifications = [];
      for (const userId of usersToNotify) {
        if (userId !== requestedByUserId) {
          notifications.push({
            user_id: userId,
            title: 'Rework Request',
            message: `A rework has been requested for survey ${surveyId}`,
            type: 'rework',
            related_survey_id: surveyId,
            related_project_id: projectName
          });
        }
      }
      
      if (notifications.length > 0) {
        await Notification.bulkCreate(notifications);
      }
      
      return notifications.length;
    } catch (error) {
      console.error('Error creating rework notification:', error);
      throw error;
    }
  }

  // Helper method to get project ID from project name
  static async getProjectIdFromName(projectName) {
    try {
      const project = await Project.findOne({
        where: { name: projectName }
      });
      return project ? project.id : null;
    } catch (error) {
      console.error('Error getting project ID from name:', error);
      return null;
    }
  }

  // Get users to notify for survey creation (coordinators only) - filtered by project
  static async getUsersToNotifyForSurveyCreation(projectName) {
    try {
      // First, get the project ID from the project name
      const projectId = await this.getProjectIdFromName(projectName);
      if (!projectId) {
        console.log(`Project not found for name: ${projectName}`);
        return [];
      }

      // Get users associated with this specific project who have coordinator role
      const userProjects = await UserProject.findAll({
        where: { 
          project_id: projectId,
          is_active: true
        },
        include: [{
          model: User,
          as: 'user',
          include: [{
            model: Role,
            as: 'roles',
            through: {
              model: UserRole,
              where: { is_active: true }
            },
            where: { 
              is_active: true,
              name: 'coordinator'
            }
          }]
        }]
      });

      const usersToNotify = [];
      userProjects.forEach(userProject => {
        if (userProject.user && userProject.user.roles.length > 0) {
          usersToNotify.push(userProject.user.id);
        }
      });
      
      return usersToNotify;
    } catch (error) {
      console.error('Error getting users to notify for survey creation:', error);
      return [];
    }
  }

  // Get users to notify for status changes based on role requirements - filtered by project
  static async getUsersToNotifyForStatusChange(projectName, newStatus, surveyId, assignedUserId) {
    try {
      // First, get the project ID from the project name
      const projectId = await this.getProjectIdFromName(projectName);
      if (!projectId) {
        console.log(`Project not found for name: ${projectName}`);
        return [];
      }

      const usersToNotify = new Set(); // Use Set to prevent duplicates
      
      // Get all users associated with this specific project
      const userProjects = await UserProject.findAll({
        where: { 
          project_id: projectId,
          is_active: true
        },
        include: [{
          model: User,
          as: 'user',
          include: [{
            model: Role,
            as: 'roles',
            through: {
              model: UserRole,
              where: { is_active: true }
            },
            where: { is_active: true }
          }]
        }]
      });

      // Filter users by role requirements
      for (const userProject of userProjects) {
        if (!userProject.user || userProject.user.roles.length === 0) continue;
        
        const roles = userProject.user.roles.map(role => role.name);
        const userId = userProject.user.id;
        
        // 1. Admin: Notify for every status change from other users
        if (roles.includes('admin')) {
          usersToNotify.add(userId);
        }
        
        // 2. Coordinator: Notify for any status change
        if (roles.includes('coordinator')) {
          usersToNotify.add(userId);
        }
        
        // 3. Site Engineer: Notify if assigned to survey and status changes to rework
        if (newStatus === 'rework' && assignedUserId && userId === assignedUserId && roles.includes('survey_engineer')) {
          usersToNotify.add(userId);
        }
        
        // 4. Approver: Notify if status changes to submitted
        if (newStatus === 'submitted' && roles.includes('approver')) {
          usersToNotify.add(userId);
        }
      }
      
      return Array.from(usersToNotify); // Convert Set back to array
    } catch (error) {
      console.error('Error getting users to notify for status change:', error);
      return [];
    }
  }

  // Get users to notify for rework - filtered by project
  static async getUsersToNotifyForRework(projectName) {
    try {
      // First, get the project ID from the project name
      const projectId = await this.getProjectIdFromName(projectName);
      if (!projectId) {
        console.log(`Project not found for name: ${projectName}`);
        return [];
      }

      const userProjects = await UserProject.findAll({
        where: { 
          project_id: projectId,
          is_active: true
        },
        include: [{
          model: User,
          as: 'user',
          include: [{
            model: Role,
            as: 'roles',
            through: {
              model: UserRole,
              where: { is_active: true }
            },
            where: { is_active: true }
          }]
        }]
      });

      const usersToNotify = [];
      for (const userProject of userProjects) {
        if (!userProject.user || userProject.user.roles.length === 0) continue;
        
        const roles = userProject.user.roles.map(role => role.name);
        if (roles.includes('coordinator') || roles.includes('approver')) {
          usersToNotify.push(userProject.user.id);
        }
      }
      
      return usersToNotify;
    } catch (error) {
      console.error('Error getting users to notify for rework:', error);
      return [];
    }
  }

  // Get status change title
  static getStatusChangeTitle(newStatus) {
    switch (newStatus) {
      case 'submitted':
        return 'Survey Submitted';
      case 'approved':
        return 'Survey Approved';
      case 'rejected':
        return 'Survey Rejected';
      case 'rework':
        return 'Survey Rework Requested';
      default:
        return 'Survey Status Changed';
    }
  }

  // Get status change message
  static getStatusChangeMessage(surveyId, oldStatus, newStatus) {
    return `Survey ${surveyId} status changed from ${oldStatus} to ${newStatus}`;
  }

  // Get user notifications
  static async getUserNotifications(userId, limit = 50, offset = 0) {
    try {
      const notifications = await Notification.findAll({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
        limit,
        offset
      });
      
      return notifications;
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        where: { 
          id: notificationId,
          user_id: userId
        }
      });
      
      if (notification) {
        notification.is_read = true;
        notification.read_at = new Date();
        await notification.save();
      }
      
      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for user
  static async markAllAsRead(userId) {
    try {
      await Notification.update(
        { 
          is_read: true,
          read_at: new Date()
        },
        { 
          where: { 
            user_id: userId,
            is_read: false
          }
        }
      );
      
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Get unread count for user
  static async getUnreadCount(userId) {
    try {
      const count = await Notification.count({
        where: { 
          user_id: userId,
          is_read: false
        }
      });
      
      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  // Delete old notifications (older than 30 days)
  static async deleteOldNotifications() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      await Notification.destroy({
        where: {
          created_at: {
            [Op.lt]: thirtyDaysAgo
          }
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting old notifications:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;
