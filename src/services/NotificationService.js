import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  static async requestPermissions() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted');
        return false;
      }

      // Get push token for remote notifications
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4CAF50',
        });
      }

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Push token:', token);
      
      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  // Schedule meal time notifications
  static async scheduleMealTimeNotifications(userId) {
    try {
      // Cancel existing meal notifications
      await this.cancelMealTimeNotifications();

      const mealTimes = [
        { hour: 8, minute: 0, title: 'Breakfast Time! 🌅', body: 'Good morning! What are you having for breakfast? Share your meal!' },
        { hour: 13, minute: 0, title: 'Lunch Time! 🍽️', body: "It's lunchtime! Don't forget to track your meal and share with the community!" },
        { hour: 19, minute: 0, title: 'Dinner Time! 🌙', body: "Time for dinner! What's on your plate tonight? Share your meal!" },
        { hour: 15, minute: 0, title: 'Snack Reminder 🍎', body: 'Feeling hungry? Have a healthy snack and log it!' },
      ];

      for (const meal of mealTimes) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: meal.title,
            body: meal.body,
            data: { type: 'meal_reminder', userId },
            sound: true,
          },
          trigger: {
            hour: meal.hour,
            minute: meal.minute,
            repeats: true,
          },
        });
      }

      console.log('Meal time notifications scheduled');
    } catch (error) {
      console.error('Error scheduling meal notifications:', error);
    }
  }

  static async cancelMealTimeNotifications() {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      if (notification.content.data?.type === 'meal_reminder') {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  }

  // Schedule diet plan ending notification
  static async scheduleDietPlanEndingNotification(dietPlan) {
    try {
      if (!dietPlan.meal_plan?.days || dietPlan.meal_plan.days.length === 0) {
        return;
      }

      const lastDay = dietPlan.meal_plan.days[dietPlan.meal_plan.days.length - 1];
      const endDate = new Date(lastDay.date);
      
      // Schedule notification 2 days before end
      const twoDaysBefore = new Date(endDate);
      twoDaysBefore.setDate(twoDaysBefore.getDate() - 2);
      
      if (twoDaysBefore > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '⏰ Diet Plan Ending Soon!',
            body: `Your "${dietPlan.plan_name}" is ending in 2 days. Generate a new plan to keep your momentum going!`,
            data: { type: 'diet_plan_ending', planId: dietPlan.id },
            sound: true,
          },
          trigger: {
            date: twoDaysBefore,
          },
        });
      }

      // Schedule notification on last day
      if (endDate > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🎯 Last Day of Your Diet Plan!',
            body: `Today is the last day of "${dietPlan.plan_name}". Ready to generate your next plan?`,
            data: { type: 'diet_plan_ended', planId: dietPlan.id },
            sound: true,
          },
          trigger: {
            date: endDate,
          },
        });
      }

      console.log('Diet plan ending notifications scheduled');
    } catch (error) {
      console.error('Error scheduling diet plan notifications:', error);
    }
  }

  // Send immediate notification for new comment
  static async sendCommentNotification(postOwnerId, commenterName, postContent) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💬 New Comment',
          body: `${commenterName} commented on your post: "${postContent.substring(0, 50)}${postContent.length > 50 ? '...' : ''}"`,
          data: { type: 'new_comment', postOwnerId },
          sound: true,
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending comment notification:', error);
    }
  }

  // Send notification for new like
  static async sendLikeNotification(postOwnerId, likerName, postContent) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '❤️ New Like',
          body: `${likerName} liked your post: "${postContent.substring(0, 50)}${postContent.length > 50 ? '...' : ''}"`,
          data: { type: 'new_like', postOwnerId },
          sound: true,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error sending like notification:', error);
    }
  }

  // Schedule daily motivation notification
  static async scheduleDailyMotivation() {
    try {
      const motivations = [
        "💪 You're doing great! Keep up with your nutrition goals today!",
        "🌟 Every healthy meal is a step toward your goal. You've got this!",
        "🎯 Stay focused on your goals. Track your meals and stay consistent!",
        "✨ Your health journey is unique. Celebrate every small victory!",
        "🔥 Consistency is key! Keep making those healthy choices!",
      ];

      const randomMotivation = motivations[Math.floor(Math.random() * motivations.length)];

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Daily Motivation 🌈',
          body: randomMotivation,
          data: { type: 'daily_motivation' },
          sound: true,
        },
        trigger: {
          hour: 9,
          minute: 0,
          repeats: true,
        },
      });

      console.log('Daily motivation scheduled');
    } catch (error) {
      console.error('Error scheduling daily motivation:', error);
    }
  }

  // Schedule water reminder
  static async scheduleWaterReminders() {
    try {
      const waterTimes = [10, 12, 14, 16, 18, 20]; // Every 2 hours from 10 AM to 8 PM

      for (const hour of waterTimes) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '💧 Hydration Reminder',
            body: 'Time to drink some water! Stay hydrated for better health.',
            data: { type: 'water_reminder' },
            sound: false,
          },
          trigger: {
            hour: hour,
            minute: 0,
            repeats: true,
          },
        });
      }

      console.log('Water reminders scheduled');
    } catch (error) {
      console.error('Error scheduling water reminders:', error);
    }
  }

  // Cancel all scheduled notifications
  static async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling notifications:', error);
    }
  }

  // Get all scheduled notifications (for debugging)
  static async getAllScheduledNotifications() {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log('Scheduled notifications:', notifications);
      return notifications;
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  // Setup notification listeners
  static setupNotificationListeners(navigation) {
    // Listener for when notification is received while app is in foreground
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Listener for when user taps on notification
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      // Navigate based on notification type
      switch (data.type) {
        case 'new_comment':
        case 'new_like':
          navigation.navigate('Community');
          break;
        case 'diet_plan_ending':
        case 'diet_plan_ended':
          navigation.navigate('DietPlan');
          break;
        case 'meal_reminder':
          navigation.navigate('Camera');
          break;
        default:
          break;
      }
    });

    return { notificationListener, responseListener };
  }

  // Remove listeners
  static removeNotificationListeners(listeners) {
    if (listeners.notificationListener) {
      Notifications.removeNotificationSubscription(listeners.notificationListener);
    }
    if (listeners.responseListener) {
      Notifications.removeNotificationSubscription(listeners.responseListener);
    }
  }

  // Initialize all notifications for a user
  static async initializeNotifications(userId, profile, activeDietPlan) {
    try {
      const hasPermission = await this.requestPermissions();
      
      if (!hasPermission) {
        console.log('Notifications disabled by user');
        return false;
      }

      // Schedule all notifications
      await this.scheduleMealTimeNotifications(userId);
      await this.scheduleDailyMotivation();
      
      // Only schedule water reminders if user wants them (you can add a setting for this)
      if (profile?.water_reminders !== false) {
        await this.scheduleWaterReminders();
      }

      // Schedule diet plan notifications if there's an active plan
      if (activeDietPlan) {
        await this.scheduleDietPlanEndingNotification(activeDietPlan);
      }

      console.log('All notifications initialized');
      return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  // Format and send a notification
  static async formatAndSendNotification(notificationData, targetUserId) {
    try {
      const { type, title, body, data, emoji } = notificationData;
      
      // Send push notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${emoji} ${title}`,
          body: body,
          data: {
            type,
            ...data,
            targetUserId,
          },
          sound: true,
        },
        trigger: null, // Send immediately
      });

      return notificationData;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  }

  // Get users who should be notified (users who have interacted with the user's posts)
  static async getUsersToNotifyForUser(userId) {
    try {
      // Get all posts by this user
      const { data: userPosts } = await supabase
        .from('posts')
        .select('id')
        .eq('user_id', userId);

      if (!userPosts || userPosts.length === 0) {
        return [];
      }

      const postIds = userPosts.map(p => p.id);

      // Get unique user IDs who have liked or commented on these posts
      const { data: likes } = await supabase
        .from('post_likes')
        .select('user_id')
        .in('post_id', postIds)
        .neq('user_id', userId);

      const { data: comments } = await supabase
        .from('post_comments')
        .select('user_id')
        .in('post_id', postIds)
        .neq('user_id', userId);

      // Combine and get unique user IDs
      const userIds = new Set();
      (likes || []).forEach(l => userIds.add(l.user_id));
      (comments || []).forEach(c => userIds.add(c.user_id));

      return Array.from(userIds);
    } catch (error) {
      console.error('Error getting users to notify:', error);
      return [];
    }
  }

  // Setup comprehensive realtime notifications
  static setupRealtimeNotifications(userId, onNotificationReceived) {
    const channels = {};

    // Subscribe to new comments on user's posts
    channels.commentsChannel = supabase
      .channel('comment_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'post_comments',
        },
        async (payload) => {
          try {
            // Get post details
            const { data: post } = await supabase
              .from('posts')
              .select('user_id, content, id')
              .eq('id', payload.new.post_id)
              .single();

            if (!post) return;

            // Don't notify if user commented on their own post
            if (post.user_id === userId && payload.new.user_id !== userId) {
              // Get commenter's profile
              const { data: commenter } = await supabase
                .from('profiles')
                .select('full_name, avatar_url, id')
                .eq('id', payload.new.user_id)
                .single();

              const postPreview = post.content?.substring(0, 50) || 'your post';
              const commentPreview = payload.new.content?.substring(0, 30) || '';

              const notification = {
                id: `comment-${payload.new.id}`,
                type: 'comment',
                emoji: '💬',
                title: 'New Comment',
                body: `${commenter?.full_name || 'Someone'} commented: "${commentPreview}${commentPreview.length >= 30 ? '...' : ''}"`,
                timestamp: payload.new.created_at || new Date().toISOString(),
                avatar: commenter?.avatar_url,
                user_name: commenter?.full_name,
                user_id: commenter?.id,
                post_id: post.id,
                post_content: postPreview,
                read: false,
                navigation: { screen: 'Community', params: { postId: post.id } },
              };

              // Send push notification
              await this.formatAndSendNotification(
                {
                  type: 'comment',
                  emoji: '💬',
                  title: 'New Comment',
                  body: `${commenter?.full_name || 'Someone'} commented on your post`,
                  data: { postId: post.id },
                },
                userId
              );

              // Callback for in-app notification
              if (onNotificationReceived) {
                onNotificationReceived(notification);
              }
            }
          } catch (error) {
            console.error('Error handling comment notification:', error);
          }
        }
      )
      .subscribe();

    // Subscribe to new likes on user's posts
    channels.likesChannel = supabase
      .channel('like_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'post_likes',
        },
        async (payload) => {
          try {
            const { data: post } = await supabase
              .from('posts')
              .select('user_id, content, id')
              .eq('id', payload.new.post_id)
              .single();

            if (!post) return;

            if (post.user_id === userId && payload.new.user_id !== userId) {
              const { data: liker } = await supabase
                .from('profiles')
                .select('full_name, avatar_url, id')
                .eq('id', payload.new.user_id)
                .single();

              const postPreview = post.content?.substring(0, 50) || 'your post';

              const notification = {
                id: `like-${payload.new.id}`,
                type: 'like',
                emoji: '❤️',
                title: 'New Like',
                body: `${liker?.full_name || 'Someone'} liked your post`,
                timestamp: payload.new.created_at || new Date().toISOString(),
                avatar: liker?.avatar_url,
                user_name: liker?.full_name,
                user_id: liker?.id,
                post_id: post.id,
                post_content: postPreview,
                read: false,
                navigation: { screen: 'Community', params: { postId: post.id } },
              };

              await this.formatAndSendNotification(
                {
                  type: 'like',
                  emoji: '❤️',
                  title: 'New Like',
                  body: `${liker?.full_name || 'Someone'} liked your post`,
                  data: { postId: post.id },
                },
                userId
              );

              if (onNotificationReceived) {
                onNotificationReceived(notification);
              }
            }
          } catch (error) {
            console.error('Error handling like notification:', error);
          }
        }
      )
      .subscribe();

    // Subscribe to new posts from users you follow/interact with
    channels.postsChannel = supabase
      .channel('post_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
        },
        async (payload) => {
          try {
            // Don't notify about own posts
            if (payload.new.user_id === userId) return;

            // Check if user has interacted with this user's posts before
            const { data: userPosts } = await supabase
              .from('posts')
              .select('id')
              .eq('user_id', payload.new.user_id)
              .limit(1);

            if (!userPosts || userPosts.length === 0) return;

            // Check if current user has liked/commented on this user's posts
            const { data: interactions } = await supabase
              .from('post_likes')
              .select('id')
              .in('post_id', userPosts.map(p => p.id))
              .eq('user_id', userId)
              .limit(1);

            const { data: comments } = await supabase
              .from('post_comments')
              .select('id')
              .in('post_id', userPosts.map(p => p.id))
              .eq('user_id', userId)
              .limit(1);

            // Only notify if user has interacted with this user before
            if ((interactions && interactions.length > 0) || (comments && comments.length > 0)) {
              const { data: poster } = await supabase
                .from('profiles')
                .select('full_name, avatar_url, id')
                .eq('id', payload.new.user_id)
                .single();

              const postPreview = payload.new.content?.substring(0, 50) || 'a new post';

              const notification = {
                id: `post-${payload.new.id}`,
                type: 'post',
                emoji: '📝',
                title: 'New Post',
                body: `${poster?.full_name || 'Someone'} shared: "${postPreview}${postPreview.length >= 50 ? '...' : ''}"`,
                timestamp: payload.new.created_at || new Date().toISOString(),
                avatar: poster?.avatar_url,
                user_name: poster?.full_name,
                user_id: poster?.id,
                post_id: payload.new.id,
                post_content: postPreview,
                read: false,
                navigation: { screen: 'Community', params: { postId: payload.new.id } },
              };

              await this.formatAndSendNotification(
                {
                  type: 'post',
                  emoji: '📝',
                  title: 'New Post',
                  body: `${poster?.full_name || 'Someone'} shared a new post`,
                  data: { postId: payload.new.id },
                },
                userId
              );

              if (onNotificationReceived) {
                onNotificationReceived(notification);
              }
            }
          } catch (error) {
            console.error('Error handling post notification:', error);
          }
        }
      )
      .subscribe();

    // Subscribe to new food entries from users you follow/interact with
    channels.foodEntriesChannel = supabase
      .channel('food_entry_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'food_entries',
        },
        async (payload) => {
          try {
            // Don't notify about own meals
            if (payload.new.user_id === userId) return;

            // Get users who should be notified (those who have interacted with this user's posts)
            const usersToNotify = await this.getUsersToNotifyForUser(payload.new.user_id);

            // Check if current user should be notified
            if (!usersToNotify.includes(userId)) return;

            const { data: mealLogger } = await supabase
              .from('profiles')
              .select('full_name, avatar_url, id')
              .eq('id', payload.new.user_id)
              .single();

            const mealName = payload.new.meal_name || 'a meal';
            const calories = payload.new.calories ? `${Math.round(payload.new.calories)} cal` : '';

            const notification = {
              id: `meal-${payload.new.id}`,
              type: 'meal',
              emoji: '🍽️',
              title: 'New Meal Logged',
              body: `${mealLogger?.full_name || 'Someone'} logged ${mealName}${calories ? ` (${calories})` : ''}`,
              timestamp: payload.new.created_at || payload.new.eaten_at || new Date().toISOString(),
              avatar: mealLogger?.avatar_url,
              user_name: mealLogger?.full_name,
              user_id: mealLogger?.id,
              food_entry_id: payload.new.id,
              meal_name: mealName,
              calories: payload.new.calories,
              read: false,
              navigation: { screen: 'Diary', params: { userId: payload.new.user_id } },
            };

            await this.formatAndSendNotification(
              {
                type: 'meal',
                emoji: '🍽️',
                title: 'New Meal Logged',
                body: `${mealLogger?.full_name || 'Someone'} logged ${mealName}`,
                data: { foodEntryId: payload.new.id, userId: payload.new.user_id },
              },
              userId
            );

            if (onNotificationReceived) {
              onNotificationReceived(notification);
            }
          } catch (error) {
            console.error('Error handling food entry notification:', error);
          }
        }
      )
      .subscribe();

    // Subscribe to diet plan updates (when user activates a new diet plan)
    channels.dietPlansChannel = supabase
      .channel('diet_plan_notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'diet_plans',
        },
        async (payload) => {
          try {
            // Only notify when a diet plan becomes active
            if (payload.new.is_active === true && payload.old.is_active === false) {
              // Don't notify about own diet plans
              if (payload.new.user_id === userId) return;

              // Get users who should be notified (those who have interacted with this user's posts)
              const usersToNotify = await this.getUsersToNotifyForUser(payload.new.user_id);

              // Check if current user should be notified
              if (!usersToNotify.includes(userId)) return;

              const { data: planCreator } = await supabase
                .from('profiles')
                .select('full_name, avatar_url, id')
                .eq('id', payload.new.user_id)
                .single();

              const planName = payload.new.plan_name || 'a new diet plan';

              const notification = {
                id: `diet-plan-${payload.new.id}`,
                type: 'diet_plan',
                emoji: '📅',
                title: 'New Diet Plan',
                body: `${planCreator?.full_name || 'Someone'} started a new diet plan: "${planName}"`,
                timestamp: payload.new.updated_at || payload.new.created_at || new Date().toISOString(),
                avatar: planCreator?.avatar_url,
                user_name: planCreator?.full_name,
                user_id: planCreator?.id,
                diet_plan_id: payload.new.id,
                plan_name: planName,
                read: false,
                navigation: { screen: 'DietPlan', params: { planId: payload.new.id } },
              };

              await this.formatAndSendNotification(
                {
                  type: 'diet_plan',
                  emoji: '📅',
                  title: 'New Diet Plan',
                  body: `${planCreator?.full_name || 'Someone'} started a new diet plan`,
                  data: { dietPlanId: payload.new.id, userId: payload.new.user_id },
                },
                userId
              );

              if (onNotificationReceived) {
                onNotificationReceived(notification);
              }
            }
          } catch (error) {
            console.error('Error handling diet plan notification:', error);
          }
        }
      )
      .subscribe();

    return channels;
  }

  // Unsubscribe from realtime notifications
  static unsubscribeRealtimeNotifications(channels) {
    if (channels.commentsChannel) {
      channels.commentsChannel.unsubscribe();
    }
    if (channels.likesChannel) {
      channels.likesChannel.unsubscribe();
    }
    if (channels.postsChannel) {
      channels.postsChannel.unsubscribe();
    }
    if (channels.foodEntriesChannel) {
      channels.foodEntriesChannel.unsubscribe();
    }
    if (channels.dietPlansChannel) {
      channels.dietPlansChannel.unsubscribe();
    }
  }

  // Legacy methods for backward compatibility
  static async sendCommentNotification(postOwnerId, commenterName, postContent) {
    return this.formatAndSendNotification(
      {
        type: 'comment',
        emoji: '💬',
        title: 'New Comment',
        body: `${commenterName} commented on your post: "${postContent.substring(0, 50)}${postContent.length > 50 ? '...' : ''}"`,
        data: { postOwnerId },
      },
      postOwnerId
    );
  }

  static async sendLikeNotification(postOwnerId, likerName, postContent) {
    return this.formatAndSendNotification(
      {
        type: 'like',
        emoji: '❤️',
        title: 'New Like',
        body: `${likerName} liked your post: "${postContent.substring(0, 50)}${postContent.length > 50 ? '...' : ''}"`,
        data: { postOwnerId },
      },
      postOwnerId
    );
  }
}

