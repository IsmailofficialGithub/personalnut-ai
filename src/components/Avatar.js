import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Theme } from '../constants/Theme';

export const Avatar = ({ 
  user, 
  size = 40, 
  showBorder = false,
  borderColor = '#4CAF50',
  style 
}) => {
  const avatarSize = size;
  const fontSize = size * 0.4;
  const [imageError, setImageError] = useState(false);

  if (user?.avatar_url && !imageError) {
    return (
      <Image
        source={{ uri: user.avatar_url }}
        style={[
          styles.avatarImage,
          {
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
            borderWidth: showBorder ? 2 : 0,
            borderColor: borderColor,
          },
          style,
        ]}
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <View
      style={[
        styles.avatar,
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
          borderWidth: showBorder ? 2 : 0,
          borderColor: borderColor,
          backgroundColor: '#4CAF50',
        },
        style,
      ]}
    >
      <Text style={[styles.avatarText, { fontSize }]}>
        {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    resizeMode: 'cover',
    backgroundColor: '#E0E0E0',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: Theme.fontWeight.bold,
  },
});

