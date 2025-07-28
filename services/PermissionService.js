const UserRoleService = require('./UserRoleService');

class PermissionService {
  
  /**
   * Check if user can create and assign sites
   */
  static async canCreateAndAssignSite(userId) {
    const roles = await UserRoleService.getUserRoles(userId);
    return roles.some(role => {
      const permissions = role.permissions;
      return permissions && permissions.sites && permissions.sites.includes('create');
    });
  }

  /**
   * Check if user can change site status from Created to Submitted
   */
  static async canChangeStatusCreatedToSubmitted(userId) {
    const roles = await UserRoleService.getUserRoles(userId);
    return roles.some(role => {
      const permissions = role.permissions;
      return permissions && 
             permissions.site_status && 
             permissions.site_status.created_to_submitted === true;
    });
  }

  /**
   * Check if user can change site status from Submitted to Under Revision
   */
  static async canChangeStatusSubmittedToUnderRevision(userId) {
    const roles = await UserRoleService.getUserRoles(userId);
    return roles.some(role => {
      const permissions = role.permissions;
      return permissions && 
             permissions.site_status && 
             permissions.site_status.submitted_to_under_revision === true;
    });
  }

  /**
   * Check if user can change site status from Under Revision to Rework
   */
  static async canChangeStatusUnderRevisionToRework(userId) {
    const roles = await UserRoleService.getUserRoles(userId);
    return roles.some(role => {
      const permissions = role.permissions;
      return permissions && 
             permissions.site_status && 
             permissions.site_status.under_revision_to_rework === true;
    });
  }

  /**
   * Check if user can change site status from Under Revision to Approved
   */
  static async canChangeStatusUnderRevisionToApproved(userId) {
    const roles = await UserRoleService.getUserRoles(userId);
    return roles.some(role => {
      const permissions = role.permissions;
      return permissions && 
             permissions.site_status && 
             permissions.site_status.under_revision_to_approved === true;
    });
  }

  /**
   * Get user's access level for sites in Created or Rework status
   */
  static async getSiteAccessForCreatedOrRework(userId) {
    const roles = await UserRoleService.getUserRoles(userId);
    let maxAccess = 'none';
    
    for (const role of roles) {
      const permissions = role.permissions;
      if (permissions && permissions.site_access) {
        const access = permissions.site_access.created_status || permissions.site_access.rework_status;
        if (access === 'edit' && maxAccess !== 'edit') {
          maxAccess = 'edit';
        } else if (access === 'view' && maxAccess === 'none') {
          maxAccess = 'view';
        }
      }
    }
    
    return maxAccess;
  }

  /**
   * Get user's access level for sites in Submitted status
   */
  static async getSiteAccessForSubmitted(userId) {
    const roles = await UserRoleService.getUserRoles(userId);
    let maxAccess = 'none';
    
    for (const role of roles) {
      const permissions = role.permissions;
      if (permissions && permissions.site_access) {
        const access = permissions.site_access.submitted_status;
        if (access === 'edit' && maxAccess !== 'edit') {
          maxAccess = 'edit';
        } else if (access === 'view' && maxAccess === 'none') {
          maxAccess = 'view';
        }
      }
    }
    
    return maxAccess;
  }

  /**
   * Get user's access level for sites in Under Revision status
   */
  static async getSiteAccessForUnderRevision(userId) {
    const roles = await UserRoleService.getUserRoles(userId);
    let maxAccess = 'none';
    
    for (const role of roles) {
      const permissions = role.permissions;
      if (permissions && permissions.site_access) {
        const access = permissions.site_access.under_revision_status;
        if (access === 'edit' && maxAccess !== 'edit') {
          maxAccess = 'edit';
        } else if (access === 'view' && maxAccess === 'none') {
          maxAccess = 'view';
        }
      }
    }
    
    return maxAccess;
  }

  /**
   * Get user's access level for sites in Approved status
   */
  static async getSiteAccessForApproved(userId) {
    const roles = await UserRoleService.getUserRoles(userId);
    let maxAccess = 'none';
    
    for (const role of roles) {
      const permissions = role.permissions;
      if (permissions && permissions.site_access) {
        const access = permissions.site_access.approved_status;
        if (access === 'edit' && maxAccess !== 'edit') {
          maxAccess = 'edit';
        } else if (access === 'view' && maxAccess === 'none') {
          maxAccess = 'view';
        }
      }
    }
    
    return maxAccess;
  }

  /**
   * Check if user has any of the specified roles
   */
  static async hasAnyRole(userId, roleNames) {
    return await UserRoleService.userHasAnyRole(userId, roleNames);
  }

  /**
   * Check if user is super admin
   */
  static async isSuperAdmin(userId) {
    return await UserRoleService.userHasRole(userId, 'super_admin');
  }

  /**
   * Check if user is admin
   */
  static async isAdmin(userId) {
    return await UserRoleService.userHasRole(userId, 'admin');
  }

  /**
   * Check if user is coordinator
   */
  static async isCoordinator(userId) {
    return await UserRoleService.userHasRole(userId, 'coordinator');
  }

  /**
   * Check if user is survey engineer
   */
  static async isSurveyEngineer(userId) {
    return await UserRoleService.userHasRole(userId, 'survey_engineer');
  }

  /**
   * Check if user is approver
   */
  static async isApprover(userId) {
    return await UserRoleService.userHasRole(userId, 'approver');
  }

  /**
   * Get all permissions for a user
   */
  static async getUserPermissions(userId) {
    const roles = await UserRoleService.getUserRoles(userId);
    const permissions = {
      canCreateAndAssignSite: false,
      canChangeStatusCreatedToSubmitted: false,
      canChangeStatusSubmittedToUnderRevision: false,
      canChangeStatusUnderRevisionToRework: false,
      canChangeStatusUnderRevisionToApproved: false,
      siteAccessCreatedOrRework: 'none',
      siteAccessSubmitted: 'none',
      siteAccessUnderRevision: 'none',
      siteAccessApproved: 'none',
      roles: roles.map(role => role.name)
    };

    // Check each permission
    permissions.canCreateAndAssignSite = await this.canCreateAndAssignSite(userId);
    permissions.canChangeStatusCreatedToSubmitted = await this.canChangeStatusCreatedToSubmitted(userId);
    permissions.canChangeStatusSubmittedToUnderRevision = await this.canChangeStatusSubmittedToUnderRevision(userId);
    permissions.canChangeStatusUnderRevisionToRework = await this.canChangeStatusUnderRevisionToRework(userId);
    permissions.canChangeStatusUnderRevisionToApproved = await this.canChangeStatusUnderRevisionToApproved(userId);
    permissions.siteAccessCreatedOrRework = await this.getSiteAccessForCreatedOrRework(userId);
    permissions.siteAccessSubmitted = await this.getSiteAccessForSubmitted(userId);
    permissions.siteAccessUnderRevision = await this.getSiteAccessForUnderRevision(userId);
    permissions.siteAccessApproved = await this.getSiteAccessForApproved(userId);

    return permissions;
  }
}

module.exports = PermissionService; 