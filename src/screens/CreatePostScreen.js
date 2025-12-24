import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Avatar } from '../components/Avatar';
import { supabase } from '../services/supabase';
import { Theme } from '../constants/Theme';

export const CreatePostScreen = ({ navigation }) => {
  const { user, profile } = useAuth();
  const { colors } = useTheme();
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [posting, setPosting] = useState(false);
  const [postType, setPostType] = useState('success_story');

  const postTypes = [
    { value: 'question', label: 'Question', icon: 'help-circle', color: '#2196F3' },
    { value: 'success_story', label: 'Success Story', icon: 'trophy', color: '#4CAF50' },
    { value: 'motivation', label: 'Motivation', icon: 'flame', color: '#FF9800' },
    { value: 'story', label: 'Story', icon: 'book', color: '#9C27B0' },
    { value: 'other', label: 'Other', icon: 'ellipse', color: '#757575' },
  ];


  const handlePost = async () => {
    if (!content.trim()) {
      Alert.alert('Almost there!', 'Add some content to share your story with the community');
      return;
    }

    setPosting(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: content.trim(),
          post_type: postType,
          is_public: isPublic,
          image_url: null,
        })
        .select()
        .single();

      if (error) throw error;

      Alert.alert('Posted! 🎉', 'Your post is now live in the community!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Oops!', 'We couldn\'t share your post. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Create Post</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.postCard}>
          <View style={styles.userInfo}>
            <Avatar user={profile} size={48} />
            <View>
              <Text style={[styles.userName, { color: colors.text }]}>
                {profile?.full_name || 'User'}
              </Text>
              <View style={styles.privacyRow}>
                <Ionicons 
                  name={isPublic ? "globe-outline" : "lock-closed-outline"} 
                  size={16} 
                  color={colors.textSecondary} 
                />
                <Text style={[styles.privacyText, { color: colors.textSecondary }]}>
                  {isPublic ? 'Public' : 'Only Me'}
                </Text>
              </View>
            </View>
          </View>

          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.surface, 
              color: colors.text,
              borderColor: colors.border,
            }]}
            placeholder="What's on your mind?"
            placeholderTextColor={colors.textSecondary}
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={8}
          />

          <View style={styles.postTypeContainer}>
            <Text style={[styles.postTypeLabel, { color: colors.text }]}>Post Type</Text>
            <View style={styles.postTypeOptions}>
              {postTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.postTypeOption,
                    {
                      backgroundColor: postType === type.value ? type.color + '20' : colors.surface,
                      borderColor: postType === type.value ? type.color : colors.border,
                    },
                  ]}
                  onPress={() => setPostType(type.value)}
                >
                  <Ionicons
                    name={type.icon}
                    size={20}
                    color={postType === type.value ? type.color : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.postTypeOptionText,
                      {
                        color: postType === type.value ? type.color : colors.textSecondary,
                        fontWeight: postType === type.value ? Theme.fontWeight.semibold : Theme.fontWeight.normal,
                      },
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.actions}>
            <View style={[styles.privacyToggle, { backgroundColor: colors.surface }]}>
              <View style={styles.privacyToggleInfo}>
                <Ionicons name="globe-outline" size={20} color={colors.text} />
                <Text style={[styles.privacyToggleText, { color: colors.text }]}>
                  {isPublic ? 'Public' : 'Only Me'}
                </Text>
              </View>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </Card>

        <Button
          title="Post"
          onPress={handlePost}
          loading={posting}
          disabled={!content.trim()}
          style={styles.postButton}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Theme.spacing.lg,
  },
  postCard: {
    marginBottom: Theme.spacing.lg,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
  },
  userName: {
    fontSize: Theme.fontSize.base,
    fontWeight: Theme.fontWeight.semibold,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    marginTop: Theme.spacing.xs,
  },
  privacyText: {
    fontSize: Theme.fontSize.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    fontSize: Theme.fontSize.base,
    textAlignVertical: 'top',
    minHeight: 150,
    marginBottom: Theme.spacing.md,
  },
  actions: {
    gap: Theme.spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
  },
  actionButtonText: {
    fontSize: Theme.fontSize.base,
    fontWeight: Theme.fontWeight.medium,
  },
  privacyToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
  },
  privacyToggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  privacyToggleText: {
    fontSize: Theme.fontSize.base,
    fontWeight: Theme.fontWeight.medium,
  },
  postButton: {
    marginTop: Theme.spacing.sm,
  },
  postTypeContainer: {
    marginBottom: Theme.spacing.md,
  },
  postTypeLabel: {
    fontSize: Theme.fontSize.base,
    fontWeight: Theme.fontWeight.semibold,
    marginBottom: Theme.spacing.sm,
  },
  postTypeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
  },
  postTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    minWidth: '30%',
  },
  postTypeOptionText: {
    fontSize: Theme.fontSize.sm,
  },
});

