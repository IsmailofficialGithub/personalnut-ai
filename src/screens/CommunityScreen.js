import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
  Modal,
  TextInput,
  Share,
  Linking,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';
import { supabase } from '../services/supabase';
import { Theme } from '../constants/Theme';
import { format } from 'date-fns';
import { PageContainer } from '../components/PageContainer';

export const CommunityScreen = ({ navigation }) => {
  const { user, profile } = useAuth();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' or 'myPosts'
  const [postTypeFilter, setPostTypeFilter] = useState(null); // null = all, or specific post_type
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userLikes, setUserLikes] = useState(new Set());
  
  // Comment modal state
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  
  // Share modal state
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [postToShare, setPostToShare] = useState(null);

  useEffect(() => {
    loadPosts();
    loadUserLikes();
    const cleanup = setupRealtimeSubscription();

    return () => {
      if (cleanup) cleanup();
    };
  }, [activeTab, postTypeFilter]);

  const setupRealtimeSubscription = () => {
    // Listen to posts table changes (for count updates from triggers)
    const postsChannel = supabase
      .channel('posts_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            loadPosts();
          } else if (payload.eventType === 'UPDATE') {
            // Update post counts in real-time when trigger updates them
            setPosts(prevPosts =>
              prevPosts.map(post =>
                post.id === payload.new.id 
                  ? { 
                      ...post, 
                      comments_count: payload.new.comments_count,
                      likes_count: payload.new.likes_count,
                      ...payload.new 
                    } 
                  : post
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setPosts(prevPosts => prevPosts.filter(post => post.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Listen to comments changes - update post count immediately
    const commentsChannel = supabase
      .channel('comments_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_comments',
        },
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
            const postId = payload.new?.post_id || payload.old?.post_id;
            if (!postId) return;
            
            // Recalculate count from post_comments table
            const { count } = await supabase
              .from('post_comments')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', postId);
            
            setPosts(prevPosts =>
              prevPosts.map(post =>
                post.id === postId 
                  ? { ...post, comments_count: count || 0 } 
                  : post
              )
            );
          }
        }
      )
      .subscribe();

    // Listen to likes changes - update post count immediately
    const likesChannel = supabase
      .channel('likes_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_likes',
        },
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
            const postId = payload.new?.post_id || payload.old?.post_id;
            if (!postId) return;
            
            // Recalculate count from post_likes table
            const { count } = await supabase
              .from('post_likes')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', postId);
            
            setPosts(prevPosts =>
              prevPosts.map(post =>
                post.id === postId 
                  ? { ...post, likes_count: count || 0 } 
                  : post
              )
            );
            
            // Update user likes set
            if (payload.eventType === 'INSERT' && payload.new?.user_id === user?.id) {
              setUserLikes(prev => new Set(prev).add(postId));
            } else if (payload.eventType === 'DELETE' && payload.old?.user_id === user?.id) {
              setUserLikes(prev => {
                const newSet = new Set(prev);
                newSet.delete(postId);
                return newSet;
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      postsChannel.unsubscribe();
      commentsChannel.unsubscribe();
      likesChannel.unsubscribe();
    };
  };

  const loadUserLikes = async () => {
    try {
      const { data } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id);

      if (data) {
        setUserLikes(new Set(data.map(like => like.post_id)));
      }
    } catch (error) {
      console.error('Error loading user likes:', error);
    }
  };

  const loadPosts = async () => {
    try {
      // Fetch posts and profiles separately to avoid relationship issues
      let query = supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (activeTab === 'myPosts') {
        query = query.eq('user_id', user.id);
      }
      // Note: is_public filter removed temporarily until column is added to database
      // Uncomment below when is_public column exists:
      // else {
      //   query = query.eq('is_public', true);
      // }

      // Apply post type filter if selected
      if (postTypeFilter) {
        query = query.eq('post_type', postTypeFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Fetch profiles for all posts
      const userIds = [...new Set((data || []).map(post => post.user_id).filter(Boolean))];
      const profilesMap = {};
      
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);
        
        if (profilesData) {
          profilesData.forEach(profile => {
            profilesMap[profile.id] = profile;
          });
        }
      }
      
      // Get all post IDs to fetch counts
      const postIds = (data || []).map(post => post.id);
      
      // Fetch counts from post_comments and post_likes tables
      const commentsCountMap = {};
      const likesCountMap = {};
      
      if (postIds.length > 0) {
        // Get comments count for all posts
        const { data: commentsData } = await supabase
          .from('post_comments')
          .select('post_id')
          .in('post_id', postIds);
        
        if (commentsData) {
          commentsData.forEach(comment => {
            commentsCountMap[comment.post_id] = (commentsCountMap[comment.post_id] || 0) + 1;
          });
        }
        
        // Get likes count for all posts
        const { data: likesData } = await supabase
          .from('post_likes')
          .select('post_id')
          .in('post_id', postIds);
        
        if (likesData) {
          likesData.forEach(like => {
            likesCountMap[like.post_id] = (likesCountMap[like.post_id] || 0) + 1;
          });
        }
      }
      
      // Fetch related diet plans and food entries separately if needed
      const postsWithRelations = await Promise.all(
        (data || []).map(async (post) => {
          const result = { ...post };
          
          // Add profile data
          result.profiles = profilesMap[post.user_id] || null;
          
          // Override counts with actual counts from related tables
          result.comments_count = commentsCountMap[post.id] || 0;
          result.likes_count = likesCountMap[post.id] || 0;
          
          if (post.shared_diet_plan_id) {
            try {
              const { data: dietPlan } = await supabase
                .from('diet_plans')
                .select('id, plan_name')
                .eq('id', post.shared_diet_plan_id)
                .single();
              if (dietPlan) result.shared_diet_plan = dietPlan;
            } catch (err) {
              console.log('Error fetching diet plan:', err);
            }
          }
          
          if (post.shared_food_entry_id) {
            try {
              const { data: foodEntry } = await supabase
                .from('food_entries')
                .select('id, meal_name, calories')
                .eq('id', post.shared_food_entry_id)
                .single();
              if (foodEntry) result.shared_food_entry = foodEntry;
            } catch (err) {
              console.log('Error fetching food entry:', err);
            }
          }
          
          return result;
        })
      );
      
      setPosts(postsWithRelations);
    } catch (error) {
      console.error('Error loading posts:', error);
      Alert.alert('Oops!', 'We couldn\'t load the community feed. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    await loadUserLikes();
  };

  const toggleLike = async (postId, currentLikes) => {
    const isLiked = userLikes.has(postId);
    
    try {
      if (isLiked) {
        // Delete like
        const { error: deleteError } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;

        setUserLikes(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      } else {
        // Insert like
        const { error: insertError } = await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: user.id });

        if (insertError) throw insertError;

        setUserLikes(prev => new Set(prev).add(postId));
      }
      
      // Recalculate count from post_likes table
      const { count } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);
      
      const newLikesCount = count || 0;
      
      // Update post in state with actual count from database
      setPosts(posts.map(p =>
        p.id === postId 
          ? { ...p, likes_count: newLikesCount } 
          : p
      ));
    } catch (error) {
      console.error('Error toggling like:', error);
      Alert.alert('Error', 'Failed to update like');
    }
  };

  const openComments = async (post) => {
    setSelectedPost(post);
    setCommentModalVisible(true);
    await loadComments(post.id);
  };

  const loadComments = async (postId) => {
    try {
      const { data: commentsData, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Fetch profiles for comments
      const commentUserIds = [...new Set((commentsData || []).map(comment => comment.user_id).filter(Boolean))];
      const commentProfilesMap = {};
      
      if (commentUserIds.length > 0) {
        const { data: commentProfiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', commentUserIds);
        
        if (commentProfiles) {
          commentProfiles.forEach(profile => {
            commentProfilesMap[profile.id] = profile;
          });
        }
      }
      
      // Add profile data to comments
      const data = (commentsData || []).map(comment => ({
        ...comment,
        profiles: commentProfilesMap[comment.user_id] || null,
      }));
      
      setComments(data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
      setComments([]);
    }
  };

  const postComment = async () => {
    if (!newComment.trim() || !selectedPost) return;

    setPostingComment(true);
    try {
      const { data: newCommentData, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: selectedPost.id,
          user_id: user.id,
          content: newComment.trim(),
        })
        .select('*')
        .single();

      if (error) throw error;
      
      // Fetch profile for the new comment
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', user.id)
        .single();
      
      const data = {
        ...newCommentData,
        profiles: profileData || null,
      };

      setComments([...comments, data]);
      setNewComment('');
      
      // Recalculate count from post_comments table
      const { count } = await supabase
        .from('post_comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', selectedPost.id);
      
      const newCommentsCount = count || 0;
      
      // Update post in state with actual count from database
      setPosts(posts.map(p =>
        p.id === selectedPost.id 
          ? { ...p, comments_count: newCommentsCount } 
          : p
      ));
      
      // Also update selectedPost if it's being displayed
      if (selectedPost) {
        setSelectedPost({
          ...selectedPost,
          comments_count: newCommentsCount
        });
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      Alert.alert('Oops!', 'We couldn\'t post your comment. Please try again.');
    } finally {
      setPostingComment(false);
    }
  };

  const deleteComment = async (commentId, postId) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete comment
              const { error } = await supabase
                .from('post_comments')
                .delete()
                .eq('id', commentId);

              if (error) throw error;
              
              setComments(comments.filter(c => c.id !== commentId));
              
              // Recalculate count from post_comments table
              const { count } = await supabase
                .from('post_comments')
                .select('*', { count: 'exact', head: true })
                .eq('post_id', postId);
              
              const newCommentsCount = count || 0;
              
              // Update post in state with actual count from database
              setPosts(posts.map(p =>
                p.id === postId 
                  ? { ...p, comments_count: newCommentsCount } 
                  : p
              ));
              
              // Also update selectedPost if it's being displayed
              if (selectedPost && selectedPost.id === postId) {
                setSelectedPost({
                  ...selectedPost,
                  comments_count: newCommentsCount
                });
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete comment');
            }
          },
        },
      ]
    );
  };

  const openShareModal = (post) => {
    setPostToShare(post);
    setShareModalVisible(true);
  };

  const shareToSocial = async (platform) => {
    if (!postToShare) return;

    const postText = postToShare.content || 'Check out this post from GRAM AI!';
    const shareUrl = `https://gram.ai/post/${postToShare.id}`;
    const shareMessage = `${postText}\n\n${shareUrl}`;

    try {
      if (platform === 'native') {
        const result = await Share.share({
          message: shareMessage,
          title: 'Share Post',
        });
        if (result.action === Share.sharedAction) {
          setShareModalVisible(false);
        }
      } else {
        // For specific platforms, you can use Linking
        const urls = {
          whatsapp: `whatsapp://send?text=${encodeURIComponent(shareMessage)}`,
          instagram: `instagram://share`,
          facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
        };

        if (urls[platform]) {
          const canOpen = await Linking.canOpenURL(urls[platform]);
          if (canOpen) {
            await Linking.openURL(urls[platform]);
          } else {
            // Fallback to native share
            await Share.share({ message: shareMessage });
          }
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback to native share
      Share.share({ message: shareMessage });
    }
    
    setShareModalVisible(false);
  };

  const deletePost = async (postId) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('posts')
                .delete()
                .eq('id', postId);

              if (error) throw error;
              setPosts(posts.filter(p => p.id !== postId));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete post');
            }
          },
        },
      ]
    );
  };

  const getPostTypeInfo = (postType) => {
    const types = {
      question: { icon: 'help-circle', label: 'Question', color: '#2196F3' },
      success_story: { icon: 'trophy', label: 'Success Story', color: '#4CAF50' },
      motivation: { icon: 'flame', label: 'Motivation', color: '#FF9800' },
      story: { icon: 'book', label: 'Story', color: '#9C27B0' },
      meal: { icon: 'restaurant', label: 'Meal', color: '#FF5722' },
      other: { icon: 'ellipse', label: 'Other', color: '#757575' },
    };
    return types[postType] || types.other;
  };

  const renderPost = ({ item }) => {
    const isLiked = userLikes.has(item.id);
    const userProfile = item.profiles || {};
    const postTypeInfo = getPostTypeInfo(item.post_type);

    return (
      <Card style={styles.postCard}>
        {/* Redesigned Header - Profile, Name, Date/Time at Top */}
        <View style={styles.postHeaderTop}>
          <TouchableOpacity
            style={styles.userInfoTop}
            onPress={() => navigation.navigate('Profile')}
          >
            <Avatar user={userProfile} size={40} />
            <View style={styles.userInfoText}>
              <Text style={[styles.userName, { color: colors.text }]}>
                {userProfile.full_name || 'Anonymous'}
              </Text>
              <View style={styles.postMetaTop}>
                <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
                  {format(new Date(item.created_at), 'MMM d • h:mm a')}
                </Text>
                {!item.is_public && (
                  <View style={styles.privateBadge}>
                    <Ionicons name="lock-closed" size={10} color={colors.textSecondary} />
                    <Text style={[styles.privateText, { color: colors.textSecondary }]}>Private</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
          <View style={styles.postHeaderActions}>
            {/* Post Type Badge */}
            <View style={[styles.postTypeBadge, { backgroundColor: postTypeInfo.color + '15' }]}>
              <Ionicons name={postTypeInfo.icon} size={14} color={postTypeInfo.color} />
              <Text style={[styles.postTypeText, { color: postTypeInfo.color }]}>
                {postTypeInfo.label}
              </Text>
            </View>
            {item.user_id === user.id && (
              <TouchableOpacity onPress={() => deletePost(item.id)}>
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {item.shared_diet_plan && (
          <View style={[styles.sharedItem, { backgroundColor: colors.primary + '10' }]}>
            <Ionicons name="restaurant" size={20} color={colors.primary} />
            <Text style={[styles.sharedItemText, { color: colors.primary }]}>
              Shared Diet Plan: {item.shared_diet_plan.plan_name}
            </Text>
          </View>
        )}

        {item.shared_food_entry && (
          <View style={[styles.sharedItem, { backgroundColor: colors.secondary + '10' }]}>
            <Ionicons name="fast-food" size={20} color={colors.secondary} />
            <Text style={[styles.sharedItemText, { color: colors.secondary }]}>
              Shared Meal: {item.shared_food_entry.meal_name} ({item.shared_food_entry.calories} cal)
            </Text>
          </View>
        )}

        {item.content && (
          <Text style={[styles.postContent, { color: colors.text }]}>
            {item.content}
          </Text>
        )}

        {item.image_url && (
          <Image source={{ uri: item.image_url }} style={styles.postImage} />
        )}

        <View style={styles.postActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => toggleLike(item.id, item.likes_count)}
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={20}
              color={isLiked ? colors.error : colors.textSecondary}
            />
            <Text style={[styles.actionText, { color: colors.text }]}>
              {item.likes_count || 0}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => openComments(item)}
          >
            <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.actionText, { color: colors.text }]}>
              {item.comments_count || 0}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => openShareModal(item)}
          >
            <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const postTypeFilters = [
    { value: null, label: 'All', icon: 'grid-outline' },
    { value: 'question', label: 'Question', icon: 'help-circle-outline' },
    { value: 'success_story', label: 'Success', icon: 'trophy-outline' },
    { value: 'motivation', label: 'Motivation', icon: 'flame-outline' },
    { value: 'story', label: 'Story', icon: 'book-outline' },
    { value: 'meal', label: 'Meal', icon: 'restaurant-outline' },
    { value: 'other', label: 'Other', icon: 'ellipse-outline' },
  ];

  const renderHeader = () => (
    <View>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'feed' && styles.activeTab]}
          onPress={() => {
            setActiveTab('feed');
            setLoading(true);
            loadPosts();
          }}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'feed' ? colors.primary : colors.textSecondary }
          ]}>
            Feed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'myPosts' && styles.activeTab]}
          onPress={() => {
            setActiveTab('myPosts');
            setLoading(true);
            loadPosts();
          }}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'myPosts' ? colors.primary : colors.textSecondary }
          ]}>
            My Posts
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Post Type Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {postTypeFilters.map((filter) => {
          const isActive = postTypeFilter === filter.value;
          const filterInfo = filter.value ? getPostTypeInfo(filter.value) : null;
          
          return (
            <TouchableOpacity
              key={filter.value || 'all'}
              style={[
                styles.filterChip,
                isActive && styles.activeFilterChip,
                isActive && filterInfo && { backgroundColor: filterInfo.color + '20', borderColor: filterInfo.color },
                !isActive && { backgroundColor: colors.surface, borderColor: colors.border }
              ]}
              onPress={() => {
                setPostTypeFilter(filter.value);
                setLoading(true);
              }}
            >
              <Ionicons 
                name={filter.icon} 
                size={16} 
                color={isActive && filterInfo ? filterInfo.color : colors.textSecondary} 
              />
              <Text style={[
                styles.filterText,
                { 
                  color: isActive && filterInfo ? filterInfo.color : colors.textSecondary,
                  fontWeight: isActive ? Theme.fontWeight.semibold : Theme.fontWeight.normal
                }
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        {activeTab === 'myPosts' 
          ? "Share your journey! Your first post is waiting to inspire others ✨"
          : "Be the first to share! Start the conversation 🎉"}
      </Text>
    </View>
  );

  const renderCommentModal = () => (
    <Modal
      visible={commentModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setCommentModalVisible(false)}
    >
      <SafeAreaView style={styles.modalOverlay} edges={['bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalKeyboardView}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            {/* Handle Bar */}
            <View style={styles.commentModalHandle} />
            
            {/* Header */}
            <View style={[styles.modalHeader, { 
              borderBottomColor: colors.border,
              backgroundColor: colors.card,
            }]}>
              <View style={styles.modalHeaderLeft}>
                <Ionicons name="chatbubbles" size={24} color={colors.primary} />
                <View style={styles.modalTitleContainer}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    Comments
                  </Text>
                  {selectedPost && (
                    <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                      {selectedPost.comments_count || 0} {selectedPost.comments_count === 1 ? 'comment' : 'comments'}
                    </Text>
                  )}
                </View>
              </View>
              <TouchableOpacity 
                onPress={() => setCommentModalVisible(false)}
                style={[styles.closeButton, { backgroundColor: colors.surface }]}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={comments}
              keyExtractor={item => item.id}
              style={styles.commentsList}
              contentContainerStyle={styles.commentsListContent}
              renderItem={({ item }) => (
                <View style={[styles.commentItem, { backgroundColor: colors.surface }]}>
                  <Avatar user={item.profiles} size={40} />
                  <View style={styles.commentContent}>
                    <View style={styles.commentHeader}>
                      <View style={styles.commentAuthorContainer}>
                        <Text style={[styles.commentAuthor, { color: colors.text }]}>
                          {item.profiles?.full_name || 'Anonymous'}
                        </Text>
                        {item.user_id === user.id && (
                          <View style={[styles.ownCommentBadge, { backgroundColor: colors.primary + '20' }]}>
                            <Text style={[styles.ownCommentBadgeText, { color: colors.primary }]}>
                              You
                            </Text>
                          </View>
                        )}
                      </View>
                      {item.user_id === user.id && (
                        <TouchableOpacity 
                          onPress={() => deleteComment(item.id, selectedPost?.id)}
                          style={[styles.deleteCommentButton, { backgroundColor: colors.error + '15' }]}
                        >
                          <Ionicons name="trash-outline" size={16} color={colors.error} />
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={[styles.commentText, { color: colors.text }]}>
                      {item.content}
                    </Text>
                    <View style={styles.commentFooter}>
                      <Text style={[styles.commentTime, { color: colors.textSecondary }]}>
                        {format(new Date(item.created_at), 'MMM d, h:mm a')}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyComments}>
                  <Ionicons name="chatbubbles-outline" size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyCommentsText, { color: colors.textSecondary }]}>
                    No comments yet. Be the first to comment!
                  </Text>
                </View>
              }
            />

            <View style={[styles.commentInputContainer, { 
              borderTopColor: colors.border,
              backgroundColor: colors.card,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 8,
            }]}>
              <View style={[styles.commentInputWrapper, {
                backgroundColor: colors.surface,
                borderColor: newComment.trim() ? colors.primary : colors.border,
              }]}>
                <TextInput
                  style={[styles.commentInput, {
                    color: colors.text,
                    minHeight: 40,
                  }]}
                  placeholder="Write a comment..."
                  placeholderTextColor={colors.textSecondary}
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline
                  maxLength={500}
                  textAlignVertical="top"
                  autoCorrect={true}
                  autoCapitalize="sentences"
                  returnKeyType="default"
                  blurOnSubmit={false}
                />
                {newComment.trim().length > 0 && (
                  <Text style={[styles.commentCharCount, { color: colors.textSecondary }]}>
                    {newComment.trim().length}/500
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={[
                  styles.sendButton, 
                  { 
                    backgroundColor: newComment.trim() ? colors.primary : colors.border,
                    shadowColor: newComment.trim() ? colors.primary : 'transparent',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: newComment.trim() ? 4 : 0,
                  }
                ]}
                onPress={postComment}
                disabled={!newComment.trim() || postingComment}
              >
                {postingComment ? (
                  <Ionicons name="hourglass-outline" size={20} color="#FFFFFF" />
                ) : (
                  <Ionicons name="send" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );

  const renderShareModal = () => (
    <Modal
      visible={shareModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShareModalVisible(false)}
    >
      <TouchableOpacity
        style={styles.shareModalOverlay}
        activeOpacity={1}
        onPress={() => setShareModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <SafeAreaView edges={['bottom']}>
            <View style={[styles.shareModalContent, { backgroundColor: colors.card }]}>
              <View style={styles.shareModalHandle} />
              
              <Text style={[styles.shareModalTitle, { color: colors.text }]}>Share Post</Text>
              
              <View style={styles.shareOptions}>
                <TouchableOpacity
                  style={styles.shareOption}
                  onPress={() => shareToSocial('whatsapp')}
                >
                  <View style={[styles.shareIconContainer, { backgroundColor: '#25D366' }]}>
                    <Ionicons name="logo-whatsapp" size={32} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.shareOptionText, { color: colors.text }]}>WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.shareOption}
                  onPress={() => shareToSocial('instagram')}
                >
                  <View style={[styles.shareIconContainer, { backgroundColor: '#E4405F' }]}>
                    <Ionicons name="logo-instagram" size={32} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.shareOptionText, { color: colors.text }]}>Instagram</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.shareOption}
                  onPress={() => shareToSocial('facebook')}
                >
                  <View style={[styles.shareIconContainer, { backgroundColor: '#1877F2' }]}>
                    <Ionicons name="logo-facebook" size={32} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.shareOptionText, { color: colors.text }]}>Facebook</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.shareOption}
                  onPress={() => shareToSocial('native')}
                >
                  <View style={[styles.shareIconContainer, { backgroundColor: colors.primary }]}>
                    <Ionicons name="share-outline" size={32} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.shareOptionText, { color: colors.text }]}>More</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: colors.surface }]}
                onPress={() => setShareModalVisible(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <PageContainer>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!loading && renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      />

      {/* Floating Plus Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('CreatePost')}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Comment Modal */}
      {renderCommentModal()}

      {/* Share Modal */}
      {renderShareModal()}
    </PageContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: Theme.spacing.lg,
    paddingBottom: Theme.spacing.xxl + 80,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    marginBottom: Theme.spacing.md,
    gap: Theme.spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  activeTab: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  tabText: {
    fontSize: Theme.fontSize.base,
    fontWeight: Theme.fontWeight.semibold,
  },
  filterContainer: {
    marginTop: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  filterContent: {
    paddingHorizontal: Theme.spacing.md,
    gap: Theme.spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.round,
    borderWidth: 1,
  },
  activeFilterChip: {
    borderWidth: 2,
  },
  filterText: {
    fontSize: Theme.fontSize.sm,
  },
  postCard: {
    marginBottom: Theme.spacing.md,
  },
  postHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.md,
    paddingBottom: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  userInfoTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    flex: 1,
  },
  userInfoText: {
    flex: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    flex: 1,
  },
  postHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  postTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.round,
  },
  postTypeText: {
    fontSize: Theme.fontSize.xs,
    fontWeight: Theme.fontWeight.medium,
  },
  userName: {
    fontSize: Theme.fontSize.base,
    fontWeight: Theme.fontWeight.semibold,
  },
  postMetaTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.xs,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.xs,
  },
  timestamp: {
    fontSize: Theme.fontSize.sm,
  },
  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
  },
  privateText: {
    fontSize: Theme.fontSize.xs,
  },
  sharedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.md,
  },
  sharedItemText: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.medium,
  },
  postContent: {
    fontSize: Theme.fontSize.base,
    lineHeight: 22,
    marginBottom: Theme.spacing.md,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.md,
  },
  postActions: {
    flexDirection: 'row',
    gap: Theme.spacing.lg,
    paddingTop: Theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
  },
  actionText: {
    fontSize: Theme.fontSize.sm,
  },
  fab: {
    position: 'absolute',
    right: Theme.spacing.lg,
    bottom: Theme.spacing.lg + 60,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: Theme.spacing.xl,
    marginTop: Theme.spacing.xxl,
  },
  emptyText: {
    fontSize: Theme.fontSize.base,
    marginTop: Theme.spacing.md,
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalKeyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '90%',
    borderTopLeftRadius: Theme.borderRadius.xl * 2,
    borderTopRightRadius: Theme.borderRadius.xl * 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 16,
  },
  commentModalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#CCCCCC',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
    flex: 1,
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
  },
  modalSubtitle: {
    fontSize: Theme.fontSize.sm,
    marginTop: Theme.spacing.xs,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentsList: {
    flex: 1,
  },
  commentsListContent: {
    padding: Theme.spacing.lg,
    paddingBottom: Theme.spacing.xxl,
  },
  commentItem: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.xs,
  },
  commentAuthorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    flex: 1,
  },
  commentAuthor: {
    fontSize: Theme.fontSize.base,
    fontWeight: Theme.fontWeight.semibold,
  },
  ownCommentBadge: {
    paddingHorizontal: Theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.round,
  },
  ownCommentBadgeText: {
    fontSize: Theme.fontSize.xs,
    fontWeight: Theme.fontWeight.semibold,
  },
  deleteCommentButton: {
    padding: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.round,
  },
  commentText: {
    fontSize: Theme.fontSize.base,
    lineHeight: 22,
    marginBottom: Theme.spacing.sm,
  },
  commentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentTime: {
    fontSize: Theme.fontSize.xs,
  },
  emptyComments: {
    padding: Theme.spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  emptyCommentsText: {
    fontSize: Theme.fontSize.base,
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: Theme.spacing.lg,
    borderTopWidth: 1,
    gap: Theme.spacing.md,
    alignItems: 'flex-end',
  },
  commentInputWrapper: {
    flex: 1,
    borderWidth: 2,
    borderRadius: Theme.borderRadius.lg,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    minHeight: 50,
    maxHeight: 120,
    justifyContent: 'flex-start',
  },
  commentInput: {
    flex: 1,
    fontSize: Theme.fontSize.base,
    lineHeight: Theme.fontSize.base * 1.4,
    textAlignVertical: 'top',
    padding: 0,
    margin: 0,
    includeFontPadding: false,
  },
  commentCharCount: {
    fontSize: Theme.fontSize.xs,
    textAlign: 'right',
    marginTop: Theme.spacing.xs,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Share Modal Styles
  shareModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  shareModalContent: {
    borderTopLeftRadius: Theme.borderRadius.xl,
    borderTopRightRadius: Theme.borderRadius.xl,
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.xl,
  },
  shareModalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#CCCCCC',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Theme.spacing.md,
  },
  shareModalTitle: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    marginBottom: Theme.spacing.xl,
    textAlign: 'center',
  },
  shareOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Theme.spacing.xl,
    paddingHorizontal: Theme.spacing.sm,
  },
  shareOption: {
    alignItems: 'center',
    width: 80,
  },
  shareIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  shareOptionText: {
    fontSize: Theme.fontSize.sm,
    textAlign: 'center',
    fontWeight: Theme.fontWeight.medium,
  },
  cancelButton: {
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: Theme.fontSize.base,
    fontWeight: Theme.fontWeight.semibold,
  },
});
