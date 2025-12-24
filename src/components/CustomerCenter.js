import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRevenueCat } from '../contexts/RevenueCatContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from './Button';
import { PageContainer } from './PageContainer';

export const CustomerCenter = ({ visible, onClose }) => {
  const { colors } = useTheme();
  const { customerInfo, loading, refreshCustomerInfo } = useRevenueCat();
  const [actionLoading, setActionLoading] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const handleManageSubscriptions = async () => {
    setActionLoading(true);
    try {
      // RevenueCat Customer Center - Open subscription management
      // On iOS, this opens the App Store subscription management
      // On Android, this opens Google Play subscription management
      
      if (Platform.OS === 'ios') {
        // For iOS, you can open Settings app or use a deep link
        Alert.alert(
          'Manage Subscription',
          'To manage your subscription on iOS:\n\n1. Go to Settings\n2. Tap your Apple ID\n3. Tap Subscriptions\n4. Find and manage your subscription',
          [{ text: 'OK' }]
        );
      } else {
        // For Android, you can open Play Store
        Alert.alert(
          'Manage Subscription',
          'To manage your subscription on Android:\n\n1. Open Google Play Store\n2. Tap Menu → Subscriptions\n3. Find and manage your subscription',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to open subscription management.');
      console.error('Error opening subscription management:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewReceipts = () => {
    if (customerInfo?.nonSubscriptionTransactions?.length > 0) {
      Alert.alert(
        'Receipts',
        `You have ${customerInfo.nonSubscriptionTransactions.length} receipt(s). Check your email for purchase confirmations.`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Receipts', 'No receipts found. Receipts are typically sent to your email.');
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <PageContainer>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Customer Center</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Loading account information...
                </Text>
              </View>
            ) : (
              <>
                {/* Account Info */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Information</Text>
                  
                  {customerInfo?.originalAppUserId && (
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>User ID:</Text>
                      <Text style={[styles.infoValue, { color: colors.text }]}>
                        {customerInfo.originalAppUserId.substring(0, 20)}...
                      </Text>
                    </View>
                  )}

                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>First Seen:</Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {formatDate(customerInfo?.firstSeen)}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Request Date:</Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {formatDate(customerInfo?.requestDate)}
                    </Text>
                  </View>
                </View>

                {/* Active Entitlements */}
                {customerInfo?.entitlements?.active && 
                 Object.keys(customerInfo.entitlements.active).length > 0 && (
                  <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Subscriptions</Text>
                    
                    {Object.values(customerInfo.entitlements.active).map((entitlement, index) => (
                      <View key={index} style={styles.entitlementCard}>
                        <View style={styles.entitlementHeader}>
                          <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                          <Text style={[styles.entitlementName, { color: colors.text }]}>
                            {entitlement.identifier}
                          </Text>
                        </View>
                        
                        <View style={styles.entitlementDetails}>
                          <View style={styles.entitlementRow}>
                            <Text style={[styles.entitlementLabel, { color: colors.textSecondary }]}>
                              Product:
                            </Text>
                            <Text style={[styles.entitlementValue, { color: colors.text }]}>
                              {entitlement.productIdentifier}
                            </Text>
                          </View>
                          
                          {entitlement.expirationDate && (
                            <View style={styles.entitlementRow}>
                              <Text style={[styles.entitlementLabel, { color: colors.textSecondary }]}>
                                Expires:
                              </Text>
                              <Text style={[styles.entitlementValue, { color: colors.text }]}>
                                {formatDate(entitlement.expirationDate)}
                              </Text>
                            </View>
                          )}
                          
                          {entitlement.latestPurchaseDate && (
                            <View style={styles.entitlementRow}>
                              <Text style={[styles.entitlementLabel, { color: colors.textSecondary }]}>
                                Purchased:
                              </Text>
                              <Text style={[styles.entitlementValue, { color: colors.text }]}>
                                {formatDate(entitlement.latestPurchaseDate)}
                              </Text>
                            </View>
                          )}
                          
                          <View style={styles.entitlementRow}>
                            <Text style={[styles.entitlementLabel, { color: colors.textSecondary }]}>
                              Will Renew:
                            </Text>
                            <Text style={[styles.entitlementValue, { color: colors.text }]}>
                              {entitlement.willRenew ? 'Yes' : 'No'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Actions */}
                <View style={styles.actionsContainer}>
                  <Button
                    title="Manage Subscriptions"
                    onPress={handleManageSubscriptions}
                    loading={actionLoading}
                    style={styles.actionButton}
                  />
                  
                  <Button
                    title="View Receipts"
                    onPress={handleViewReceipts}
                    variant="outline"
                    style={styles.actionButton}
                  />
                  
                  <Button
                    title="Refresh Account Info"
                    onPress={refreshCustomerInfo}
                    variant="outline"
                    style={styles.actionButton}
                  />
                </View>

                {/* Help Text */}
                <View style={styles.helpContainer}>
                  <Text style={[styles.helpText, { color: colors.textSecondary }]}>
                    Need help? Contact support or manage your subscriptions directly through the App Store (iOS) or Google Play Store (Android).
                  </Text>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </PageContainer>
    </Modal>
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
    padding: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  section: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  entitlementCard: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  entitlementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  entitlementName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  entitlementDetails: {
    marginLeft: 28,
  },
  entitlementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  entitlementLabel: {
    fontSize: 14,
  },
  entitlementValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionsContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  actionButton: {
    marginBottom: 12,
  },
  helpContainer: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  helpText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
