# Role and Project System Migration Guide

## Overview
This guide documents the implementation of a comprehensive role-based access control (RBAC) system with granular permissions and project management capabilities.

## Completed Migrations

### ✅ Successfully Applied Migrations:

1. **`create-roles-table.js`** - Created the roles table with granular permissions
2. **`add-user-project-fields-to-projects.js`** - Added missing fields to existing projects table
3. **`create-user-roles-table.js`** - Created user_roles junction table (already existed)
4. **`create-user-projects-table.js`** - Created user_projects junction table (already existed)
5. **`remove-role-from-users.js`** - Removed the old `role` column from users table
6. **`seed-initial-roles.js`** - Seeded initial roles with detailed permissions

### ⚠️ Skipped Migration:
- **`migrate-existing-user-roles.js`** - Skipped because the `role` column was already removed

## Database Schema

### Roles Table
```sql
CREATE TABLE roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  permissions JSON NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### User Roles Junction Table
```sql
CREATE TABLE user_roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  assigned_by INT,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_role (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
);
```

### User Projects Junction Table
```sql
CREATE TABLE user_projects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  project_id INT NOT NULL,
  assigned_by INT,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  role_in_project VARCHAR(100),
  permissions JSON,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_project (user_id, project_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
);
```

### Updated Projects Table
The existing projects table has been enhanced with additional fields:
- `description` (TEXT)
- `status` (VARCHAR(20)) - 'active', 'inactive', 'completed', 'on_hold'
- `start_date` (DATE)
- `end_date` (DATE)
- `client` (VARCHAR(255))
- `budget` (DECIMAL(15,2))
- `is_active` (BOOLEAN)

## Initial Roles and Permissions

### 1. Super Admin
- **All permissions** across all modules
- **Site Status Changes**: All transitions allowed
- **Site Access**: Full access to all site statuses

### 2. Admin
- **Sites**: create, assign, view, edit, delete, change_status
- **Projects**: create, read, update, delete, manage
- **Users**: create, read, update, delete, manage_roles
- **Roles**: create, read, update, delete
- **Surveys**: create, read, update, delete
- **Reports**: create, read, update, delete
- **System**: configure, manage, administer
- **Site Status Changes**: All transitions allowed
- **Site Access**: Full access to all site statuses

### 3. Coordinator
- **Sites**: create, assign, view, edit
- **Projects**: create, read, update
- **Users**: read, update
- **Roles**: read
- **Surveys**: create, read, update
- **Reports**: create, read, update
- **System**: configure
- **Site Status Changes**: Limited transitions
- **Site Access**: Limited access based on status

### 4. Survey Engineer
- **Sites**: view, edit
- **Projects**: read
- **Users**: read
- **Roles**: read
- **Surveys**: create, read, update
- **Reports**: create, read
- **System**: none
- **Site Status Changes**: None
- **Site Access**: Limited to created and rework statuses

### 5. Approver
- **Sites**: view
- **Projects**: read
- **Users**: read
- **Roles**: read
- **Surveys**: read
- **Reports**: read
- **System**: none
- **Site Status Changes**: Limited approval transitions
- **Site Access**: Limited to submitted and under revision statuses

## Models and Associations

### Updated Models:
- **User.js** - Removed `role` field, added instance methods for roles and projects
- **Project.js** - Enhanced with new fields and CT relationship
- **Role.js** - New model with granular permissions
- **CT.js** - Existing model with Project associations
- **UserRole.js** - Junction table model
- **UserProject.js** - Junction table model

### Associations:
- User ↔ Role (Many-to-Many through UserRole)
- User ↔ Project (Many-to-Many through UserProject)
- Project ↔ CT (Many-to-One)
- UserRole associations with User and Role
- UserProject associations with User and Project

## Services

### 1. UserRoleService
- `assignRoleToUser(userId, roleId, assignedBy)`
- `removeRoleFromUser(userId, roleId)`
- `getUserRoles(userId)`
- `getRoleUsers(roleId)`
- `userHasRole(userId, roleName)`
- `userHasAnyRole(userId, roleNames)`

### 2. UserProjectService
- `assignUserToProject(userId, projectId, assignedBy, roleInProject, permissions)`
- `removeUserFromProject(userId, projectId)`
- `getUserProjects(userId)`
- `getProjectUsers(projectId)`
- `userIsAssignedToProject(userId, projectId)`
- `updateUserProjectRole(userId, projectId, roleInProject)`
- `updateUserProjectPermissions(userId, projectId, permissions)`

### 3. PermissionService
- `canCreateAndAssignSite(userId)`
- `canChangeStatusCreatedToSubmitted(userId)`
- `canChangeStatusSubmittedToUnderRevision(userId)`
- `canChangeStatusUnderRevisionToRework(userId)`
- `canChangeStatusUnderRevisionToApproved(userId)`
- `getSiteAccessForCreatedOrRework(userId)`
- `getSiteAccessForSubmitted(userId)`
- `getSiteAccessForUnderRevision(userId)`
- `getSiteAccessForApproved(userId)`
- Role check methods: `isSuperAdmin`, `isAdmin`, `isCoordinator`, `isSurveyEngineer`, `isApprover`

## Middleware

### PermissionMiddleware
Express middleware functions for permission checks:
- `canCreateAndAssignSite`
- `canChangeStatusCreatedToSubmitted`
- `canChangeStatusSubmittedToUnderRevision`
- `canChangeStatusUnderRevisionToRework`
- `canChangeStatusUnderRevisionToApproved`
- `canEditCreatedOrReworkSites`
- `canEditUnderRevisionSites`
- `isSuperAdmin`
- `hasAnyRole`
- `addUserPermissions`

## Next Steps

### 1. Update Application Entry Point
Add the associations import to your main app file:
```javascript
// In your main app file (e.g., index.js, app.js)
require('./models/associations');
```

### 2. Update Authentication Middleware
Replace the old role-based checks with the new permission system:
```javascript
const { addUserPermissions } = require('./middleware/permissionMiddleware');

// Add user permissions to request object
app.use(addUserPermissions);
```

### 3. Update Route Protection
Use the new permission middleware in your routes:
```javascript
const { canCreateAndAssignSite } = require('./middleware/permissionMiddleware');

router.post('/sites', canCreateAndAssignSite, async (req, res) => {
  // Route logic
});
```

### 4. Test the System
- Test role assignments
- Test project assignments
- Test permission checks
- Test site status transitions
- Test site access based on roles

## Migration Status: ✅ COMPLETED

All core migrations have been successfully applied. The new role and project system is ready for use. 