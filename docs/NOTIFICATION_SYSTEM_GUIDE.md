# Notification System Implementation Guide

## Overview

The notification system provides real-time notifications to users based on their roles and project assignments. It automatically creates notifications for various events like survey creation, status changes, assignments, and rework requests.

## Features

### Role-Based Notifications

1. **Admin Role**
   - Notifications for every survey status change from other users
   - Notifications when new surveys are created by other users
   - Global oversight of all survey activities

2. **Coordinator Role**
   - Notifications when new surveys are created in their assigned projects
   - Notifications for any status change on surveys in their assigned projects
   - Project-level oversight and coordination

3. **Site Engineer Role**
   - Notifications when new surveys are assigned to them
   - Notifications when their assigned surveys are marked for rework
   - Task-specific notifications for their assigned work

4. **Approver Role**
   - Notifications when survey status changes to "submitted" in their assigned projects
   - Approval workflow notifications
   - Project-specific approval responsibilities

## Database Schema

### Notifications Table

```sql
CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('survey_created', 'status_change', 'assignment', 'rework', 'approval') NOT NULL,
  related_survey_id VARCHAR(255),
  related_project_id INT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  read_at DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (related_survey_id) REFERENCES survey(session_id) ON DELETE SET NULL,
  FOREIGN KEY (related_project_id) REFERENCES projects(id) ON DELETE SET NULL
);
```

## API Endpoints

### Get User Notifications
```
GET /api/notifications?limit=50&offset=0
Authorization: Bearer <token>
```

### Get Unread Count
```
GET /api/notifications/unread-count
Authorization: Bearer <token>
```

### Mark Notification as Read
```
PUT /api/notifications/:id/read
Authorization: Bearer <token>
```

### Mark All Notifications as Read
```
PUT /api/notifications/mark-all-read
Authorization: Bearer <token>
```

### Delete Notification
```
DELETE /api/notifications/:id
Authorization: Bearer <token>
```

### Delete All Notifications
```
DELETE /api/notifications
Authorization: Bearer <token>
```

## Notification Types

### 1. Survey Created (`survey_created`)
- **Trigger**: New survey is created
- **Recipients**: Coordinators assigned to the project
- **Message**: "A new survey has been created for project [ProjectName]"

### 2. Status Change (`status_change`)
- **Trigger**: Survey status is updated
- **Recipients**: 
  - **Admin**: For every status change from other users
  - **Coordinator**: For any status change in their assigned projects
  - **Site Engineer**: When their assigned survey status changes to "rework"
  - **Approver**: When survey status changes to "submitted" in their assigned projects
- **Message**: "Survey [SurveyID] status changed from [OldStatus] to [NewStatus]"

### 3. Assignment (`assignment`)
- **Trigger**: Survey is assigned to a site engineer
- **Recipients**: The assigned site engineer
- **Message**: "You have been assigned to survey [SurveyID]"

### 4. Rework (`rework`)
- **Trigger**: Survey is marked for rework
- **Recipients**: Site engineer assigned to the survey
- **Message**: "Your survey [SurveyID] has been marked for rework"

### 5. Approval (`approval`)
- **Trigger**: Survey is approved or rejected
- **Recipients**: All users involved in the survey workflow
- **Message**: "Survey [SurveyID] has been [approved/rejected]"

## Frontend Integration

### Notification Context

The frontend uses a React context (`NotificationContext`) to manage notification state:

```javascript
import { useNotifications } from '../context/NotificationContext';

const { 
  notifications, 
  unreadCount, 
  markAsRead, 
  markAllAsRead 
} = useNotifications();
```

### Notification Dropdown Component

The `NotificationDropdown` component provides:
- Bell icon with unread count badge
- Dropdown with notification list
- Mark as read functionality
- Delete notifications
- Real-time updates

## Backend Integration

### Notification Service

The `NotificationService` class handles:
- Creating notifications for different events
- Determining notification recipients based on roles
- Managing notification lifecycle

### Integration Points

1. **Survey Creation**: Automatically creates notifications when surveys are created
2. **Status Changes**: Creates notifications when survey status is updated
3. **User Assignment**: Creates notifications when surveys are assigned
4. **Rework Requests**: Creates notifications when surveys are marked for rework

## Setup Instructions

### 1. Database Migration

Run the migration to create the notifications table:

```bash
npx sequelize-cli db:migrate
```

### 2. Backend Setup

1. Ensure the notification routes are registered in `index.js`
2. Verify the Notification model is included in associations
3. Test the notification service integration

### 3. Frontend Setup

1. Install required dependencies:
   ```bash
   npm install date-fns
   ```

2. Wrap your app with NotificationProvider:
   ```javascript
   import { NotificationProvider } from './context/NotificationContext';
   
   function App() {
     return (
       <NotificationProvider>
         <SurveyProvider>
           <RoutesComponent />
         </SurveyProvider>
       </NotificationProvider>
     );
   }
   ```

3. Add NotificationDropdown to your header component

## Testing

### Manual Testing

1. Create a new survey and verify notifications are sent to coordinators/approvers
2. Change survey status and verify appropriate users receive notifications
3. Test the notification dropdown functionality
4. Verify unread count updates correctly

### Automated Testing

Run the test script:
```bash
node test-notification-system.js
```

## Configuration

### Notification Settings

- **Polling Interval**: 30 seconds (configurable in NotificationContext)
- **Max Notifications**: 50 per page (configurable in API)
- **Auto-cleanup**: Notifications older than 30 days are automatically deleted

### Role-Based Rules

The system automatically determines notification recipients based on:
- User roles (site_engineer, coordinator, approver)
- Project assignments
- Survey ownership
- Current survey status

## Troubleshooting

### Common Issues

1. **Notifications not appearing**
   - Check user roles and project assignments
   - Verify notification service is properly integrated
   - Check database for notification records

2. **Unread count not updating**
   - Verify frontend polling is working
   - Check API endpoints are responding correctly
   - Clear browser cache and reload

3. **Wrong recipients getting notifications**
   - Verify user role assignments
   - Check project assignments
   - Review notification service logic

### Debug Mode

Enable debug logging by setting:
```javascript
console.log('Notification debug:', notificationData);
```

## Future Enhancements

1. **Real-time Notifications**: Implement WebSocket connections for instant updates
2. **Email Notifications**: Send email notifications for important events
3. **Push Notifications**: Browser push notifications for desktop users
4. **Notification Preferences**: Allow users to customize notification settings
5. **Bulk Operations**: Mark multiple notifications as read/delete
6. **Notification Templates**: Customizable notification messages

## Security Considerations

1. **Authentication**: All notification endpoints require valid JWT tokens
2. **Authorization**: Users can only access their own notifications
3. **Data Validation**: All notification data is validated before storage
4. **Rate Limiting**: Consider implementing rate limiting for notification endpoints

## Performance Considerations

1. **Database Indexing**: Proper indexes on user_id, is_read, and created_at
2. **Pagination**: Implement pagination for large notification lists
3. **Caching**: Consider caching unread counts for better performance
4. **Cleanup**: Regular cleanup of old notifications to maintain performance
