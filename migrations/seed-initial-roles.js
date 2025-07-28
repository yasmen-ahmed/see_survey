'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Insert initial roles based on the image permissions
    await queryInterface.bulkInsert('roles', [
      {
        name: 'super_admin',
        description: 'Super Administrator with full system access and all permissions',
        permissions: JSON.stringify({
          // Super Admin has all permissions
          sites: ['create', 'assign', 'view', 'edit', 'delete', 'change_status'],
          projects: ['create', 'read', 'update', 'delete', 'manage'],
          users: ['create', 'read', 'update', 'delete', 'manage_roles'],
          roles: ['create', 'read', 'update', 'delete'],
          surveys: ['create', 'read', 'update', 'delete'],
          reports: ['create', 'read', 'update', 'delete'],
          system: ['configure', 'manage', 'administer'],
          // Site status permissions
          site_status: {
            created_to_submitted: true,
            submitted_to_under_revision: true,
            under_revision_to_rework: true,
            under_revision_to_approved: true
          },
          // Site access permissions
          site_access: {
            created_status: 'edit',
            rework_status: 'edit',
            submitted_status: 'edit',
            under_revision_status: 'edit',
            approved_status: 'edit'
          }
        }),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'admin',
        description: 'Administrator with project management and site creation permissions',
        permissions: JSON.stringify({
          sites: ['create', 'assign', 'view'],
          projects: ['create', 'read', 'update'],
          users: ['read'],
          surveys: ['create', 'read', 'update'],
          reports: ['create', 'read'],
          // Site status permissions
          site_status: {
            created_to_submitted: true,
            submitted_to_under_revision: true,
            under_revision_to_rework: true,
            under_revision_to_approved: true
          },
          // Site access permissions
          site_access: {
            created_status: 'view',
            rework_status: 'view',
            submitted_status: 'view',
            under_revision_status: 'view',
            approved_status: 'view'
          }
        }),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'coordinator',
        description: 'Coordinator with site creation and viewing permissions',
        permissions: JSON.stringify({
          sites: ['create', 'assign', 'view'],
          projects: ['read'],
          surveys: ['read'],
          reports: ['read'],
          // Site status permissions
          site_status: {
            created_to_submitted: false,
            submitted_to_under_revision: false,
            under_revision_to_rework: false,
            under_revision_to_approved: false
          },
          // Site access permissions
          site_access: {
            created_status: 'view',
            rework_status: 'view',
            submitted_status: 'view',
            under_revision_status: 'view',
            approved_status: 'view'
          }
        }),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'survey_engineer',
        description: 'Survey Engineer with site editing and submission permissions',
        permissions: JSON.stringify({
          sites: ['view'],
          projects: ['read'],
          surveys: ['create', 'read', 'update'],
          reports: ['read'],
          // Site status permissions
          site_status: {
            created_to_submitted: true,
            submitted_to_under_revision: false,
            under_revision_to_rework: false,
            under_revision_to_approved: false
          },
          // Site access permissions
          site_access: {
            created_status: 'edit',
            rework_status: 'edit',
            submitted_status: 'view',
            under_revision_status: 'view',
            approved_status: 'view'
          }
        }),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'approver',
        description: 'Approver with site approval and revision permissions',
        permissions: JSON.stringify({
          sites: ['view'],
          projects: ['read'],
          surveys: ['read'],
          reports: ['read'],
          // Site status permissions
          site_status: {
            created_to_submitted: false,
            submitted_to_under_revision: true,
            under_revision_to_rework: true,
            under_revision_to_approved: true
          },
          // Site access permissions
          site_access: {
            created_status: 'none',
            rework_status: 'none',
            submitted_status: 'none',
            under_revision_status: 'edit',
            approved_status: 'view'
          }
        }),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the seeded roles
    await queryInterface.bulkDelete('roles', {
      name: {
        [Sequelize.Op.in]: ['super_admin', 'admin', 'coordinator', 'survey_engineer', 'approver']
      }
    }, {});
  }
}; 