import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNotificationCount } from '../contexts/NotificationContext';
import { Avatar } from '../components/Avatar';
import { supabase } from '../services/supabase';
import { NotificationService } from '../services/NotificationService';
import { Theme } from '../constants/Theme';
import { formatDistanceToNow } from 'date-fns';
import { PageContainer } from '../components/PageContainer';
import { IconCircle } from '../components/IconCircle';

const FILTER_OPTIONS = {
  ALL: 'all',
  UNREAD: 'unread',
  READ: 'read',
};

export const NotificationScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { updateUnreadCount } = useNotificationCount();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState(FILTER_OPTIONS.ALL);

  const [realtimeChannels, setRealtimeChannels] = useState(null);

  useEffect(() => {
    if (user) {
      loadNotifications();
      const channels = setupRealtimeNotifications();
      setRealtimeChannels(channels);
    }

    return () => {
      if (realtimeChannels) {
        NotificationService.unsubscribeRealtimeNotifications(realtimeChannels);
      }
    };
  }, [user]);

  const setupRealtimeNotifications = () => {
    if (!user) return null;

    // Setup realtime notifications with callback
    const channels = NotificationService.setupRealtimeNotifications(
      user.id,
      (notification) => {
        // Add new notification to state
            setNotifications(prev => {
              // Check if notification already exists and preserve read status
              const exists = prev.find(n => n.id === notification.id);
              if (exists) {
                // Preserve read status if notification already exists
                return prev.map(n => 
                  n.id === notification.id 
                    ? { ...notification, read: n.read } 
                    : n
                );
              }
              const updated = [notification, ...prev];
              // Update unread count
              const unreadCount = updated.filter(n => !n.read).length;
              updateUnreadCount(unreadCount);
              return updated;
            });
      }
    );
    
    return channels;
  };

  const loadNotifications = async () => {
    try {
      if (!user) return;

      console.log('Loading notifications for user:', user.id);
      
      // Preserve read status from current notifications
      const readStatusMap = {};
      notifications.forEach(n => {
        readStatusMap[n.id] = n.read;
      });
      
      // Get all user's posts
      const { data: userPosts, error: postsError } = await supabase
        .from('posts')
        .select('id, content')
        .eq('user_id', user.id);

      if (postsError) {
        console.error('Error fetching user posts:', postsError);
        throw postsError;
      }

      const postIds = userPosts?.map(p => p.id) || [];
      const allNotifications = [];

      // Get all comments on user's posts
      if (postIds.length > 0) {
        const { data: comments, error: commentsError } = await supabase
          .from('post_comments')
          .select('id, created_at, post_id, user_id, content')
          .in('post_id', postIds)
          .neq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (!commentsError && comments) {
          const userIds = [...new Set(comments.map(c => c.user_id))];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', userIds);

          const profilesMap = {};
          (profiles || []).forEach(p => {
            profilesMap[p.id] = p;
          });

          comments.forEach(c => {
            const profile = profilesMap[c.user_id];
            const post = userPosts.find(p => p.id === c.post_id);
            const commentPreview = c.content?.substring(0, 30) || '';
            
            const notificationId = `comment-${c.id}`;
            allNotifications.push({
              id: notificationId,
              type: 'comment',
              emoji: '💬',
              title: 'New Comment',
              body: `${profile?.full_name || 'Someone'} commented: "${commentPreview}${commentPreview.length >= 30 ? '...' : ''}"`,
              timestamp: c.created_at,
              avatar: profile?.avatar_url,
              user_name: profile?.full_name,
              user_id: profile?.id,
              post_id: c.post_id,
              post_content: post?.content?.substring(0, 50),
              read: readStatusMap[notificationId] ?? false,
              navigation: { screen: 'Community', params: { postId: c.post_id } },
            });
          });
        }
      }

      // Get all likes on user's posts
      if (postIds.length > 0) {
        const { data: likes, error: likesError } = await supabase
          .from('post_likes')
          .select('id, created_at, post_id, user_id')
          .in('post_id', postIds)
          .neq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (!likesError && likes) {
          const userIds = [...new Set(likes.map(l => l.user_id))];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', userIds);

          const profilesMap = {};
          (profiles || []).forEach(p => {
            profilesMap[p.id] = p;
          });

          likes.forEach(l => {
            const profile = profilesMap[l.user_id];
            const post = userPosts.find(p => p.id === l.post_id);
            
            const notificationId = `like-${l.id}`;
            allNotifications.push({
              id: notificationId,
              type: 'like',
              emoji: '❤️',
              title: 'New Like',
              body: `${profile?.full_name || 'Someone'} liked your post`,
              timestamp: l.created_at,
              avatar: profile?.avatar_url,
              user_name: profile?.full_name,
              user_id: profile?.id,
              post_id: l.post_id,
              post_content: post?.content?.substring(0, 50),
              read: readStatusMap[notificationId] ?? false,
              navigation: { screen: 'Community', params: { postId: l.post_id } },
            });
          });
        }
      }

      // Get new posts from users you interact with
      const { data: allPosts } = await supabase
        .from('posts')
        .select('id, user_id, content, created_at')
        .neq('user_id', user.id)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(100);

      if (allPosts && allPosts.length > 0) {
        // Get posts from users you've interacted with
        const interactedUserIds = new Set();
        const { data: myLikes } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id)
          .limit(100);

        const { data: myComments } = await supabase
          .from('post_comments')
          .select('post_id')
          .eq('user_id', user.id)
          .limit(100);

        const interactedPostIds = new Set();
        (myLikes || []).forEach(l => interactedPostIds.add(l.post_id));
        (myComments || []).forEach(c => interactedPostIds.add(c.post_id));

        if (interactedPostIds.size > 0) {
          const { data: interactedPosts } = await supabase
            .from('posts')
            .select('user_id')
            .in('id', Array.from(interactedPostIds));

          (interactedPosts || []).forEach(p => interactedUserIds.add(p.user_id));

          const relevantPosts = allPosts.filter(p => 
            interactedUserIds.has(p.user_id) && 
            new Date(p.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          ).slice(0, 20);

          if (relevantPosts.length > 0) {
            const userIds = [...new Set(relevantPosts.map(p => p.user_id))];
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .in('id', userIds);

            const profilesMap = {};
            (profiles || []).forEach(p => {
              profilesMap[p.id] = p;
            });

            relevantPosts.forEach(post => {
              const profile = profilesMap[post.user_id];
              const postPreview = post.content?.substring(0, 50) || 'a new post';
              const notificationId = `post-${post.id}`;
              
              allNotifications.push({
                id: notificationId,
                type: 'post',
                emoji: '📝',
                title: 'New Post',
                body: `${profile?.full_name || 'Someone'} shared: "${postPreview}${postPreview.length >= 50 ? '...' : ''}"`,
                timestamp: post.created_at,
                avatar: profile?.avatar_url,
                user_name: profile?.full_name,
                user_id: profile?.id,
                post_id: post.id,
                post_content: postPreview,
                read: readStatusMap[notificationId] ?? false,
                navigation: { screen: 'Community', params: { postId: post.id } },
              });
            });
          }
        }
      }

      // Sort by timestamp
      allNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      console.log('Total notifications:', allNotifications.length);
      setNotifications(allNotifications);
      
      // Update unread count for tab badge
      const unreadCount = allNotifications.filter(n => !n.read).length;
      updateUnreadCount(unreadCount);
    } catch (error) {
      console.error('Error loading notifications:', error);
      Alert.alert('Oops!', 'We couldn\'t load your notifications. Pull down to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleNotificationPress = (notification) => {
    // Mark as read
    setNotifications(prev => {
      const updated = prev.map(n => (n.id === notification.id ? { ...n, read: true } : n));
      // Update unread count
      const unreadCount = updated.filter(n => !n.read).length;
      updateUnreadCount(unreadCount);
      return updated;
    });

    // Navigate based on notification type
    if (notification.navigation) {
      navigation.navigate(notification.navigation.screen, notification.navigation.params);
    } else if (notification.post_id) {
      navigation.navigate('Community', { postId: notification.post_id });
    } else if (notification.food_entry_id) {
      navigation.navigate('Diary');
    } else if (notification.diet_plan_id) {
      navigation.navigate('DietPlan', { planId: notification.diet_plan_id });
    } else {
      navigation.navigate('Community');
    }
  };

  // Filter notifications based on selected filter
  const filteredNotifications = useMemo(() => {
    switch (filter) {
      case FILTER_OPTIONS.UNREAD:
        return notifications.filter(n => !n.read);
      case FILTER_OPTIONS.READ:
        return notifications.filter(n => n.read);
      default:
        return notifications;
    }
  }, [notifications, filter]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'comment':
        return { name: 'chatbubble', color: '#2196F3', emoji: '💬' };
      case 'like':
        return { name: 'heart', color: '#F44336', emoji: '❤️' };
      case 'post':
        return { name: 'document-text', color: '#4CAF50', emoji: '📝' };
      case 'meal':
        return { name: 'restaurant', color: '#FF9800', emoji: '🍽️' };
      case 'diet_plan':
        return { name: 'calendar', color: '#9C27B0', emoji: '📅' };
      case 'reminder':
        return { name: 'alarm', color: '#FF9800', emoji: '⏰' };
      default:
        return { name: 'notifications', color: '#9C27B0', emoji: '🔔' };
    }
  };

  const renderNotification = ({ item }) => {
    const icon = getNotificationIcon(item.type);
    const timeAgo = formatDistanceToNow(new Date(item.timestamp), { addSuffix: true });
    const displayTitle = item.emoji ? `${item.emoji} ${item.title}` : item.title;

    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          {
            backgroundColor: item.read 
              ? colors.surfaceContainerLowest 
              : colors.surfaceContainerLow,
            borderColor: item.read 
              ? colors.border 
              : colors.primary + (isDark ? '40' : '30'),
            ...Theme.getShadows(isDark).sm,
          },
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <IconCircle
          size={52}
          color={icon.color}
          variant={item.read ? 'subtle' : 'accent'}
        >
          {item.emoji ? (
            <Text style={styles.emojiIcon}>{item.emoji}</Text>
          ) : (
            <Ionicons name={icon.name} size={24} color={icon.color} />
          )}
        </IconCircle>
        <View style={styles.notificationContent}>
          {item.avatar || item.user_name ? (
            <View style={styles.userInfo}>
              <Avatar user={{ avatar_url: item.avatar, full_name: item.user_name }} size={36} />
              <View style={styles.notificationTextContainer}>
                <View style={styles.titleRow}>
                  <Text style={[styles.notificationTitle, { color: colors.text }]}>
                    {displayTitle}
                  </Text>
                  {!item.read && (
                    <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                  )}
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.titleRow}>
              <Text style={[styles.notificationTitle, { color: colors.text }]}>
                {displayTitle}
              </Text>
              {!item.read && (
                <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
              )}
            </View>
          )}
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
            <Text style={[styles.notificationTime, { color: colors.textSecondary }]}>
              {timeAgo}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    const emptyMessage = filter === FILTER_OPTIONS.UNREAD
      ? "All caught up! ✨"
      : filter === FILTER_OPTIONS.READ
      ? "No read notifications"
      : "No notifications yet";
    
    const emptyDescription = filter === FILTER_OPTIONS.UNREAD
      ? "You're all set! No unread notifications."
      : filter === FILTER_OPTIONS.READ
      ? "You haven't read any notifications yet."
      : "Stay connected! You'll see updates here when others interact with your content.";

    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIconContainer, { backgroundColor: colors.primary + '10' }]}>
          <Ionicons name="notifications-off-outline" size={64} color={colors.primary} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>{emptyMessage}</Text>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          {emptyDescription}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  const renderFilterButtons = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterContainer}
      style={styles.filterScrollView}
    >
      <TouchableOpacity
        style={[
          styles.filterButton,
          {
            backgroundColor: filter === FILTER_OPTIONS.ALL ? colors.primary : colors.card,
            borderColor: filter === FILTER_OPTIONS.ALL ? colors.primary : colors.border,
            ...(filter === FILTER_OPTIONS.ALL && Theme.getShadows(isDark).sm),
          },
        ]}
        onPress={() => setFilter(FILTER_OPTIONS.ALL)}
        activeOpacity={0.85}
      >
        <Text
          style={[
            styles.filterButtonText,
            {
              color: filter === FILTER_OPTIONS.ALL ? '#FFFFFF' : colors.text,
              fontWeight: filter === FILTER_OPTIONS.ALL ? Theme.fontWeight.semibold : Theme.fontWeight.regular,
            },
          ]}
        >
          All
        </Text>
        {filter === FILTER_OPTIONS.ALL && notifications.length > 0 && (
          <View style={[
            styles.filterBadge, 
            { 
              backgroundColor: isDark 
                ? 'rgba(255, 255, 255, 0.2)' 
                : 'rgba(255, 255, 255, 0.3)' 
            }
          ]}>
            <Text style={styles.filterBadgeText}>{notifications.length}</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.filterButton,
          {
            backgroundColor: filter === FILTER_OPTIONS.UNREAD ? colors.primary : colors.card,
            borderColor: filter === FILTER_OPTIONS.UNREAD ? colors.primary : colors.border,
            ...(filter === FILTER_OPTIONS.UNREAD && Theme.getShadows(isDark).sm),
          },
        ]}
        onPress={() => setFilter(FILTER_OPTIONS.UNREAD)}
        activeOpacity={0.85}
      >
        <Text
          style={[
            styles.filterButtonText,
            {
              color: filter === FILTER_OPTIONS.UNREAD ? '#FFFFFF' : colors.text,
              fontWeight: filter === FILTER_OPTIONS.UNREAD ? Theme.fontWeight.semibold : Theme.fontWeight.regular,
            },
          ]}
        >
          Unread
        </Text>
        {filter === FILTER_OPTIONS.UNREAD && unreadCount > 0 && (
          <View style={[
            styles.filterBadge, 
            { 
              backgroundColor: isDark 
                ? 'rgba(255, 255, 255, 0.2)' 
                : 'rgba(255, 255, 255, 0.3)' 
            }
          ]}>
            <Text style={[styles.filterBadgeText, { color: colors.primary }]}>{unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.filterButton,
          {
            backgroundColor: filter === FILTER_OPTIONS.READ ? colors.primary : colors.card,
            borderColor: filter === FILTER_OPTIONS.READ ? colors.primary : colors.border,
            ...(filter === FILTER_OPTIONS.READ && Theme.getShadows(isDark).sm),
          },
        ]}
        onPress={() => setFilter(FILTER_OPTIONS.READ)}
        activeOpacity={0.85}
      >
        <Text
          style={[
            styles.filterButtonText,
            {
              color: filter === FILTER_OPTIONS.READ ? '#FFFFFF' : colors.text,
              fontWeight: filter === FILTER_OPTIONS.READ ? Theme.fontWeight.semibold : Theme.fontWeight.regular,
            },
          ]}
        >
          Read
        </Text>
        {filter === FILTER_OPTIONS.READ && notifications.filter(n => n.read).length > 0 && (
          <View style={[
            styles.filterBadge, 
            { 
              backgroundColor: isDark 
                ? 'rgba(255, 255, 255, 0.2)' 
                : 'rgba(255, 255, 255, 0.3)' 
            }
          ]}>
            <Text style={[styles.filterBadgeText, { color: colors.primary }]}>
              {notifications.filter(n => n.read).length}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <PageContainer>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          {renderFilterButtons()}
          {unreadCount > 0 && (
            <TouchableOpacity
              style={[styles.markAllButton, { backgroundColor: colors.primary + '15' }]}
              onPress={() => {
                setNotifications(prev => {
                  const updated = prev.map(n => ({ ...n, read: true }));
                  updateUnreadCount(0);
                  return updated;
                });
              }}
            >
              <Ionicons name="checkmark-done" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filteredNotifications}
        renderItem={renderNotification}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    </PageContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: Theme.spacing.lg,
    paddingTop: Theme.spacing.xxl + 20,
    paddingBottom: Theme.spacing.md,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Theme.spacing.md,
  },
  headerTitle: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
  },
  markAllButton: {
    width: 40,
    height: 40,
    borderRadius: Theme.borderRadius.lg, // 12px - elegant rounded corners
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    minHeight: 40, // Proper touch target
  },
  filterScrollView: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.lg, // 12px - elegant rounded corners
    borderWidth: 1.5,
    gap: Theme.spacing.xs,
    minWidth: 80,
    minHeight: 36, // Proper touch target
    justifyContent: 'center',
  },
  filterButtonActive: {
    // Shadow applied inline based on theme
  },
  filterButtonText: {
    fontSize: Theme.fontSize.sm,
  },
  filterBadge: {
    borderRadius: Theme.borderRadius.round,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: Theme.fontSize.xs,
    fontWeight: Theme.fontWeight.bold,
    color: '#FFFFFF',
  },
  list: {
    padding: Theme.spacing.lg,
    paddingTop: Theme.spacing.md,
  },
  notificationCard: {
    flexDirection: 'row',
    padding: Theme.spacing.md, // 16px - consistent
    borderRadius: Theme.borderRadius.lg, // 12px - consistent
    marginBottom: Theme.spacing.md, // 16px - uniform spacing
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.xs,
  },
  notificationTextContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
    gap: Theme.spacing.xs,
  },
  notificationTitle: {
    fontSize: Theme.fontSize.base,
    fontWeight: Theme.fontWeight.semibold,
    flex: 1,
  },
  notificationMessage: {
    fontSize: Theme.fontSize.sm,
    marginBottom: Theme.spacing.xs,
    lineHeight: 20,
  },
  previewContainer: {
    padding: Theme.spacing.xs,
    paddingHorizontal: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    marginTop: Theme.spacing.xs,
  },
  notificationTime: {
    fontSize: Theme.fontSize.xs,
    marginTop: Theme.spacing.xs,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    marginTop: Theme.spacing.xs,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emojiIcon: {
    fontSize: 26,
  },
  postPreview: {
    fontSize: Theme.fontSize.xs,
    fontStyle: 'italic',
  },
  mealInfo: {
    fontSize: Theme.fontSize.xs,
    fontWeight: Theme.fontWeight.medium,
  },
  planInfo: {
    fontSize: Theme.fontSize.xs,
    fontWeight: Theme.fontWeight.medium,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.xxl,
    marginTop: Theme.spacing.xxl * 2,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    marginBottom: Theme.spacing.sm,
  },
  emptyText: {
    fontSize: Theme.fontSize.base,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Theme.spacing.xl,
  },
});

