# Role-Based Notification System Summary

## Overview
The notification system has been updated to implement specific role-based notification logic as requested. Each role now receives notifications based on their specific responsibilities and permissions.

## Role-Based Notification Rules

### 1. Admin Role
**Notifications Received:**
- ✅ Every survey status change from other users
- ✅ Every new survey creation from other users
- ✅ Global oversight of all survey activities

**Logic:**
- Admin users are notified for ALL survey activities regardless of project assignment
- This provides complete system oversight

### 2. Coordinator Role
**Notifications Received:**
- ✅ New survey creation in their assigned projects
- ✅ Any status change on surveys in their assigned projects
- ✅ Project-level oversight and coordination

**Logic:**
- Only notified for activities within their assigned projects
- Responsible for project-level coordination and oversight

### 3. Site Engineer Role
**Notifications Received:**
- ✅ New survey assignments to them
- ✅ When their assigned surveys are marked for rework
- ✅ Task-specific notifications for their assigned work

**Logic:**
- Only notified when directly assigned to surveys
- Only notified for rework status changes on their assigned surveys
- Focused on their specific tasks and responsibilities

### 4. Approver Role
**Notifications Received:**
- ✅ When survey status changes to "submitted" in their assigned projects
- ✅ Approval workflow notifications
- ✅ Project-specific approval responsibilities

**Logic:**
- Only notified when surveys are submitted for approval
- Focused on approval workflow responsibilities

## Implementation Details

### Database Schema
- **Table**: `notifications`
- **Key Fields**: `user_id`, `type`, `related_survey_id`, `related_project_id`, `is_read`
- **Types**: `survey_created`, `status_change`, `assignment`, `rework`, `approval`

### API Endpoints
- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/mark-all-read` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

### Frontend Integration
- **Notification Bell**: Shows unread count badge
- **Dropdown**: Displays notifications with role-specific filtering
- **Real-time Updates**: Polling every 30 seconds
- **Mark as Read**: Click to mark notifications as read

## Notification Triggers

### Survey Creation
```javascript
// Triggers notification for coordinators in the project
await NotificationService.createSurveyCreatedNotification(
  surveyId, creatorId, projectId
);
```

### Status Changes
```javascript
// Triggers notifications based on role and status
await NotificationService.createStatusChangeNotification(
  surveyId, oldStatus, newStatus, changedByUserId, projectId, assignedUserId
);
```

### Survey Assignment
```javascript
// Triggers notification for assigned site engineer
await NotificationService.createAssignmentNotification(
  surveyId, assignedUserId, assignedByUserId, projectId
);
```

## Testing

### Test Scripts
1. `test-notification-system.js` - Basic API testing
2. `test-notification-service.js` - Service-level testing
3. `test-role-based-notifications.js` - Role-based logic testing

### Manual Testing Scenarios
1. **Admin Testing:**
   - Create survey as non-admin user
   - Change survey status as non-admin user
   - Verify admin receives notifications

2. **Coordinator Testing:**
   - Create survey in coordinator's project
   - Change status of survey in coordinator's project
   - Verify coordinator receives notifications

3. **Site Engineer Testing:**
   - Assign survey to site engineer
   - Mark site engineer's survey for rework
   - Verify site engineer receives notifications

4. **Approver Testing:**
   - Change survey status to "submitted"
   - Verify approver receives notification

## Configuration

### Environment Variables
- `VITE_API_URL` - Frontend API URL
- Database connection settings in `config/config.js`

### Polling Settings
- **Frontend Polling**: 30 seconds
- **Max Notifications**: 50 per page
- **Auto-cleanup**: 30 days

## Security Considerations

### Authentication
- All notification endpoints require valid JWT tokens
- User can only access their own notifications

### Authorization
- Role-based filtering ensures users only see relevant notifications
- Project-based filtering for coordinators and approvers

## Performance Considerations

### Database Indexing
- Indexes on `user_id`, `is_read`, `created_at`, `type`
- Optimized queries for role-based filtering

### Caching
- Frontend caches notifications locally
- Unread count cached and updated via polling

## Future Enhancements

### Planned Features
1. **Real-time Notifications**: WebSocket implementation
2. **Email Notifications**: Email alerts for important events
3. **Push Notifications**: Browser push notifications
4. **Notification Preferences**: User-customizable settings
5. **Bulk Operations**: Mark multiple notifications as read

### Scalability
- Database partitioning for large notification volumes
- Redis caching for high-traffic scenarios
- Message queue for notification processing

## Troubleshooting

### Common Issues
1. **Notifications not appearing**
   - Check user roles and project assignments
   - Verify notification service integration
   - Check database for notification records

2. **Wrong recipients**
   - Verify role assignments in database
   - Check project assignments
   - Review notification service logic

3. **Performance issues**
   - Monitor database query performance
   - Check notification table size
   - Verify indexing is working correctly

### Debug Mode
Enable debug logging in notification service:
```javascript
console.log('Notification debug:', notificationData);
```

## Support

For issues or questions about the notification system:
1. Check the logs for error messages
2. Verify database connectivity
3. Test with the provided test scripts
4. Review the implementation guide

---

**Last Updated**: January 2025
**Version**: 1.0
**Status**: Production Ready
