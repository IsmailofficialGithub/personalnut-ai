# Comprehensive Notification System Implementation

## Overview
A complete real-time notification system has been implemented for GRAM AI that handles multiple event types with formatted, contextual notifications.

## Features Implemented

### 1. **New Meal Logged Notifications** 🍽️
- When a user logs a new food entry, users who have previously interacted with their posts (liked/commented) receive notifications
- Notification includes:
  - User's name and avatar
  - Meal name
  - Calorie count (if available)
  - Navigation to Diary screen

### 2. **New Comment Notifications** 💬
- Enhanced existing comment notifications
- Shows commenter's name and avatar
- Includes comment preview
- Links to the specific post

### 3. **New Like Notifications** ❤️
- Enhanced existing like notifications
- Shows liker's name and avatar
- Links to the specific post

### 4. **New Post Notifications** 📝
- When a user creates a new post, users who have previously interacted with their posts receive notifications
- Shows poster's name and avatar
- Includes post content preview
- Links to the specific post

## Technical Implementation

### Files Modified

1. **`src/services/NotificationService.js`**
   - Added `formatAndSendNotification()` - Formats and sends push notifications with emojis
   - Added `getUsersToNotifyForUser()` - Gets users who should receive notifications (based on previous interactions)
   - Enhanced `setupRealtimeNotifications()` - Comprehensive real-time listeners for:
     - `post_comments` table
     - `post_likes` table
     - `posts` table
     - `food_entries` table
   - Smart filtering to prevent self-notifications
   - Callback system for in-app notification updates

2. **`src/screens/NotificationScreen.js`**
   - Enhanced to display all notification types
   - Real-time updates via NotificationService callbacks
   - Rich notification display with:
     - Emojis for each notification type
     - User avatars
     - Content previews
     - Timestamps
     - Navigation handling
   - Supports meal, post, comment, and like notifications

3. **`complete_database_schema.sql`**
   - Added real-time publication setup for `posts` and `food_entries` tables

4. **`enable_realtime_notifications.sql`** (New)
   - SQL script to enable real-time for notification tables
   - Can be run separately if needed

## Setup Instructions

### 1. Enable Real-time in Supabase

Run the SQL script in your Supabase SQL Editor:

```sql
-- Option 1: Run the standalone script
-- Copy and paste enable_realtime_notifications.sql

-- Option 2: The schema has been updated in complete_database_schema.sql
-- If you've already run that, real-time should be enabled
```

### 2. Verify Real-time is Enabled

Run this query in Supabase SQL Editor:

```sql
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('posts', 'food_entries', 'post_comments', 'post_likes')
ORDER BY tablename;
```

You should see all four tables listed.

### 3. Notification Permissions

The app will automatically request notification permissions when:
- User logs in
- NotificationService.initializeNotifications() is called

## How It Works

### Real-time Flow

1. **Event Occurs** (e.g., new comment, like, post, meal)
   - Database change triggers Supabase real-time

2. **NotificationService Listens**
   - Real-time subscription catches the event
   - Fetches necessary data (user profiles, post content, etc.)

3. **Notification Created**
   - Formatted notification object with:
     - Emoji
     - Title and body
     - User info (avatar, name)
     - Content preview
     - Navigation data
     - Timestamp

4. **Dual Delivery**
   - **Push Notification**: Sent via Expo Notifications (if permissions granted)
   - **In-App Notification**: Added to NotificationScreen state via callback

5. **Display**
   - NotificationScreen shows the notification in real-time
   - User can tap to navigate to relevant content

### Smart Filtering

- **Self-Notifications**: Users never receive notifications about their own actions
- **Interaction-Based**: Meal and post notifications only go to users who have previously interacted with the user's content
- **Deduplication**: Notifications are checked for duplicates before adding to state

## Notification Types

| Type | Emoji | Trigger | Recipients |
|------|-------|---------|------------|
| Comment | 💬 | Someone comments on your post | Post owner |
| Like | ❤️ | Someone likes your post | Post owner |
| Post | 📝 | User you follow creates a post | Users who interacted with their posts |
| Meal | 🍽️ | User you follow logs a meal | Users who interacted with their posts |

## Notification Object Structure

```javascript
{
  id: 'comment-123',
  type: 'comment',
  emoji: '💬',
  title: 'New Comment',
  body: 'John commented: "Great post!"',
  timestamp: '2024-01-15T10:30:00Z',
  avatar: 'https://...',
  user_name: 'John Doe',
  user_id: 'uuid',
  post_id: 'uuid',
  post_content: 'Preview of post...',
  read: false,
  navigation: {
    screen: 'Community',
    params: { postId: 'uuid' }
  }
}
```

## Usage in Code

### Setting Up Notifications

The NotificationScreen automatically sets up real-time notifications when mounted:

```javascript
// In NotificationScreen.js
useEffect(() => {
  if (user) {
    const channels = NotificationService.setupRealtimeNotifications(
      user.id,
      (notification) => {
        // Callback receives new notifications
        setNotifications(prev => [notification, ...prev]);
      }
    );
  }
}, [user]);
```

### Manual Notification Sending

```javascript
import { NotificationService } from '../services/NotificationService';

// Send a formatted notification
await NotificationService.formatAndSendNotification(
  {
    type: 'custom',
    emoji: '🎉',
    title: 'Achievement Unlocked',
    body: 'You reached your daily goal!',
    data: { achievementId: '123' }
  },
  userId
);
```

## Testing

1. **Test Comment Notifications**:
   - User A creates a post
   - User B comments on the post
   - User A should receive a notification

2. **Test Like Notifications**:
   - User A creates a post
   - User B likes the post
   - User A should receive a notification

3. **Test Post Notifications**:
   - User A likes/comments on User B's post
   - User B creates a new post
   - User A should receive a notification

4. **Test Meal Notifications**:
   - User A likes/comments on User B's post
   - User B logs a new meal
   - User A should receive a notification

## Troubleshooting

### Notifications Not Appearing

1. **Check Real-time Setup**:
   - Verify tables are in `supabase_realtime` publication
   - Run the SQL verification query

2. **Check Permissions**:
   - Ensure notification permissions are granted
   - Check `NotificationService.requestPermissions()`

3. **Check Console Logs**:
   - Look for errors in NotificationService
   - Check Supabase real-time connection status

4. **Verify User Interactions**:
   - Meal/post notifications only go to users who have interacted before
   - Make sure there's interaction history

### Performance Considerations

- Notifications are limited to recent events (last 7 days for posts)
- Queries are limited (50 items) to prevent performance issues
- Real-time subscriptions are properly cleaned up on unmount

## Future Enhancements

Potential improvements:
- Notification preferences/settings
- Notification grouping (e.g., "3 people liked your post")
- Notification history persistence in database
- Push notification badges
- Notification categories/filtering
- Mute/unfollow functionality

## Notes

- The system uses interaction history (likes/comments) to determine who should receive meal/post notifications
- This is a lightweight alternative to a full followers system
- If you want to implement a proper followers system, you can add a `follows` table and update the notification logic

