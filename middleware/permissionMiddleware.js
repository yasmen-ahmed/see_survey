const PermissionService = require('../services/PermissionService');

/**
 * Middleware to check if user can create and assign sites
 */
const canCreateAndAssignSite = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const hasPermission = await PermissionService.canCreateAndAssignSite(userId);
    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions to create and assign sites' });
    }

    next();
  } catch (error) {
    console.error('Permission check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to check if user can change site status from Created to Submitted
 */
const canChangeStatusCreatedToSubmitted = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const hasPermission = await PermissionService.canChangeStatusCreatedToSubmitted(userId);
    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions to change status from Created to Submitted' });
    }

    next();
  } catch (error) {
    console.error('Permission check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to check if user can change site status from Submitted to Under Revision
 */
const canChangeStatusSubmittedToUnderRevision = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const hasPermission = await PermissionService.canChangeStatusSubmittedToUnderRevision(userId);
    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions to change status from Submitted to Under Revision' });
    }

    next();
  } catch (error) {
    console.error('Permission check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to check if user can change site status from Under Revision to Rework
 */
const canChangeStatusUnderRevisionToRework = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const hasPermission = await PermissionService.canChangeStatusUnderRevisionToRework(userId);
    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions to change status from Under Revision to Rework' });
    }

    next();
  } catch (error) {
    console.error('Permission check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to check if user can change site status from Under Revision to Approved
 */
const canChangeStatusUnderRevisionToApproved = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const hasPermission = await PermissionService.canChangeStatusUnderRevisionToApproved(userId);
    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions to change status from Under Revision to Approved' });
    }

    next();
  } catch (error) {
    console.error('Permission check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to check if user has edit access to sites in Created or Rework status
 */
const canEditCreatedOrReworkSites = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const accessLevel = await PermissionService.getSiteAccessForCreatedOrRework(userId);
    if (accessLevel !== 'edit') {
      return res.status(403).json({ error: 'Insufficient permissions to edit sites in Created or Rework status' });
    }

    next();
  } catch (error) {
    console.error('Permission check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to check if user has edit access to sites in Under Revision status
 */
const canEditUnderRevisionSites = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const accessLevel = await PermissionService.getSiteAccessForUnderRevision(userId);
    if (accessLevel !== 'edit') {
      return res.status(403).json({ error: 'Insufficient permissions to edit sites in Under Revision status' });
    }

    next();
  } catch (error) {
    console.error('Permission check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to check if user is super admin
 */
const isSuperAdmin = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const isSuperAdminUser = await PermissionService.isSuperAdmin(userId);
    if (!isSuperAdminUser) {
      return res.status(403).json({ error: 'Super admin access required' });
    }

    next();
  } catch (error) {
    console.error('Permission check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to check if user has any of the specified roles
 */
const hasAnyRole = (roleNames) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const hasRole = await PermissionService.hasAnyRole(userId, roleNames);
      if (!hasRole) {
        return res.status(403).json({ error: `Access denied. Required roles: ${roleNames.join(', ')}` });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

/**
 * Middleware to add user permissions to request object
 */
const addUserPermissions = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (userId) {
      const permissions = await PermissionService.getUserPermissions(userId);
      req.userPermissions = permissions;
    }
    next();
  } catch (error) {
    console.error('Error adding user permissions:', error);
    next(); // Continue without permissions if there's an error
  }
};

module.exports = {
  canCreateAndAssignSite,
  canChangeStatusCreatedToSubmitted,
  canChangeStatusSubmittedToUnderRevision,
  canChangeStatusUnderRevisionToRework,
  canChangeStatusUnderRevisionToApproved,
  canEditCreatedOrReworkSites,
  canEditUnderRevisionSites,
  isSuperAdmin,
  hasAnyRole,
  addUserPermissions
}; 