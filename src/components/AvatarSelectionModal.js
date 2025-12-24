import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Theme } from '../constants/Theme';
import { supabase } from '../services/supabase';

// Local male avatar assets
const MALE_AVATARS = [
  { name: 'avatar-1-male.png', source: require('../../assets/avatar-1-male.png'), url: 'https://qcucqyorafkvmdrezhry.supabase.co/storage/v1/object/public/avatars/avatar-1-male.png' },
  { name: 'avatar-2-male.png', source: require('../../assets/avatar-2-male.png'), url: 'https://qcucqyorafkvmdrezhry.supabase.co/storage/v1/object/public/avatars/avatar-2-male.png' },
];

// Local female avatar assets
const FEMALE_AVATARS = [
  { name: 'avatar-1-female.png', source: require('../../assets/avatar-1-female.png'), url: 'https://qcucqyorafkvmdrezhry.supabase.co/storage/v1/object/public/avatars/avatar-1-female.png' },
  { name: 'avatar-2-female.png', source: require('../../assets/avatar-2-female.png'), url: 'https://qcucqyorafkvmdrezhry.supabase.co/storage/v1/object/public/avatars/avatar-2-female.png' },
];

export const AvatarSelectionModal = ({ visible, onClose, onSelect, currentGender }) => {
  const { colors } = useTheme();
  const [maleAvatars, setMaleAvatars] = useState([]);
  const [femaleAvatars, setFemaleAvatars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGender, setSelectedGender] = useState(currentGender || 'male');
  const [selectedAvatar, setSelectedAvatar] = useState(null);

  useEffect(() => {
    if (visible) {
      loadAvatars();
    }
  }, [visible]);

  const loadAvatars = async () => {
    setLoading(true);
    try {
      // Set local male avatars
      const localMaleAvatars = MALE_AVATARS.map(avatar => ({
        name: avatar.name,
        url: avatar.url,
        source: avatar.source, // Local source for Image component
      }));
      setMaleAvatars(localMaleAvatars);

      // Set local female avatars
      const localFemaleAvatars = FEMALE_AVATARS.map(avatar => ({
        name: avatar.name,
        url: avatar.url,
        source: avatar.source, // Local source for Image component
      }));
      setFemaleAvatars(localFemaleAvatars);
    } catch (error) {
      console.error('Error loading avatars:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (avatar) => {
    setSelectedAvatar(avatar);
  };

  const handleConfirm = () => {
    if (selectedAvatar) {
      onSelect(selectedAvatar);
      onClose();
    }
  };

  const currentAvatars = selectedGender === 'male' ? maleAvatars : femaleAvatars;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Select Avatar</Text>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: colors.surface }]}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Gender Selector */}
          <View style={styles.genderSelector}>
            <TouchableOpacity
              style={[
                styles.genderButton,
                {
                  backgroundColor: selectedGender === 'male' ? colors.primary : colors.surface,
                  borderColor: selectedGender === 'male' ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedGender('male')}
            >
              <Ionicons
                name="male"
                size={24}
                color={selectedGender === 'male' ? '#FFFFFF' : colors.text}
              />
              <Text
                style={[
                  styles.genderButtonText,
                  {
                    color: selectedGender === 'male' ? '#FFFFFF' : colors.text,
                  },
                ]}
              >
                Male
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.genderButton,
                {
                  backgroundColor: selectedGender === 'female' ? colors.primary : colors.surface,
                  borderColor: selectedGender === 'female' ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedGender('female')}
            >
              <Ionicons
                name="female"
                size={24}
                color={selectedGender === 'female' ? '#FFFFFF' : colors.text}
              />
              <Text
                style={[
                  styles.genderButtonText,
                  {
                    color: selectedGender === 'female' ? '#FFFFFF' : colors.text,
                  },
                ]}
              >
                Female
              </Text>
            </TouchableOpacity>
          </View>

          {/* Avatar Grid */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading avatars...
              </Text>
            </View>
          ) : currentAvatars.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="image-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No avatars found for {selectedGender}
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.avatarGrid}
              showsVerticalScrollIndicator={false}
            >
              {currentAvatars.map((avatar, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.avatarItem,
                    {
                      borderColor:
                        selectedAvatar?.url === avatar.url ? colors.primary : colors.border,
                      borderWidth: selectedAvatar?.url === avatar.url ? 3 : 1,
                    },
                  ]}
                  onPress={() => handleSelect(avatar)}
                >
                  <Image 
                    source={avatar.source || { uri: avatar.url }} 
                    style={styles.avatarImage} 
                  />
                  {selectedAvatar?.url === avatar.url && (
                    <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                      <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Confirm Button */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                {
                  backgroundColor: selectedAvatar ? colors.primary : colors.border,
                },
              ]}
              onPress={handleConfirm}
              disabled={!selectedAvatar}
            >
              <Text style={styles.confirmButtonText}>Confirm Selection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    flex: 1,
    maxHeight: '90%',
    borderTopLeftRadius: Theme.borderRadius.xl,
    borderTopRightRadius: Theme.borderRadius.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.lg,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  genderSelector: {
    flexDirection: 'row',
    padding: Theme.spacing.lg,
    gap: Theme.spacing.md,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.sm,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 2,
  },
  genderButtonText: {
    fontSize: Theme.fontSize.base,
    fontWeight: Theme.fontWeight.semibold,
  },
  scrollView: {
    flex: 1,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Theme.spacing.md,
    gap: Theme.spacing.md,
    justifyContent: 'center',
  },
  avatarItem: {
    width: 100,
    height: 100,
    borderRadius: Theme.borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xl,
  },
  loadingText: {
    marginTop: Theme.spacing.md,
    fontSize: Theme.fontSize.base,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xl,
  },
  emptyText: {
    marginTop: Theme.spacing.md,
    fontSize: Theme.fontSize.base,
  },
  footer: {
    padding: Theme.spacing.lg,
    borderTopWidth: 1,
  },
  confirmButton: {
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: Theme.fontSize.base,
    fontWeight: Theme.fontWeight.semibold,
  },
});

