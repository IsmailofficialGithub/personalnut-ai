import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/Button';
import { Theme } from '../constants/Theme';

export const CameraScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  if (!permission) {
    return <View style={styles.container}><Text>Requesting permissions...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.message}>Let's capture your meals! We need camera access to get started 📸</Text>
        <Button title="Enable Camera" onPress={requestPermission} />
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.7,
        });
        navigation.navigate('FoodAnalysis', { 
          imageUri: photo.uri, 
          base64: photo.base64 
        });
      } catch (error) {
        Alert.alert('Oops!', 'We couldn\'t capture the photo. Please try again.');
      }
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled) {
      navigation.navigate('FoodAnalysis', {
        imageUri: result.assets[0].uri,
        base64: result.assets[0].base64,
      });
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
            <Ionicons name="close" size={32} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.footer}>
          <TouchableOpacity onPress={pickImage} style={styles.galleryButton}>
            <Ionicons name="images" size={32} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={takePicture} style={styles.captureButton}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
            style={styles.flipButton}
          >
            <Ionicons name="camera-reverse" size={32} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  camera: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Theme.spacing.lg,
    paddingTop: 60,
  },
  headerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.6)', // Slightly darker for better visibility
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.md, // Add shadow for depth
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.lg, // Strong shadow for prominent button
  },
  captureButtonInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#4CAF50',
  },
  galleryButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.6)', // Slightly darker
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.md, // Add shadow for depth
  },
  flipButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.6)', // Slightly darker
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.md, // Add shadow for depth
  },
  message: {
    fontSize: Theme.fontSize.base,
    textAlign: 'center',
    marginBottom: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.lg,
  },
});