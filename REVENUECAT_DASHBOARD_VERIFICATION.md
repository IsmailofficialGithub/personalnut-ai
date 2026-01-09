# RevenueCat Dashboard Verification Guide

## 🎯 Quick Verification Checklist

Use this guide to verify your RevenueCat configuration matches your code.

---

## 1. API Key Verification

### Current Configuration
- **API Key**: `sk_kiotmkdYmrVeTqbGEyjRYFSJogPPq`
- **Type**: Production key (starts with `sk_`)
- **Status**: ✅ Real payments will be processed

### Verify in Dashboard
1. Go to https://app.revenuecat.com
2. Navigate to **Project Settings** → **API Keys**
3. Verify your production key matches: `sk_kiotmkdYmrVeTqbGEyjRYFSJogPPq`
4. ⚠️ If using a test key (starts with `test_`), real payments won't work

---

## 2. Products Configuration

### Required Products in RevenueCat Dashboard

Your code expects these product IDs:

| Product ID | Type | Price | Entitlement |
|------------|------|-------|-------------|
| `pro_monthly` | Subscription (Monthly) | $9.99/month | `pro` |
| `premium_monthly` | Subscription (Monthly) | $19.99/month | `premium` |

### How to Verify Products

1. **Navigate to Products**:
   - Go to RevenueCat Dashboard → **Products**

2. **Check Each Product**:
   - ✅ Product `pro_monthly` exists
   - ✅ Product `premium_monthly` exists
   - ✅ Both are subscription products (not one-time)
   - ✅ Both are monthly subscriptions
   - ✅ Pricing matches ($9.99 and $19.99)

3. **Link to App Store/Play Store**:
   - ✅ `pro_monthly` linked to App Store Connect product
   - ✅ `premium_monthly` linked to App Store Connect product
   - ✅ `pro_monthly` linked to Google Play Console product
   - ✅ `premium_monthly` linked to Google Play Console product

---

## 3. Entitlements Configuration

### Required Entitlements

| Entitlement ID | Name | Linked Products |
|----------------|------|-----------------|
| `pro` | Pro | `pro_monthly` |
| `premium` | Premium | `premium_monthly` |

### How to Verify Entitlements

1. **Navigate to Entitlements**:
   - Go to RevenueCat Dashboard → **Entitlements**

2. **Check Each Entitlement**:
   - ✅ Entitlement `pro` exists
   - ✅ Entitlement `premium` exists
   - ✅ `pro_monthly` product is linked to `pro` entitlement
   - ✅ `premium_monthly` product is linked to `premium` entitlement

3. **Verify Entitlement Logic**:
   - Premium users should have access to Pro features
   - Pro users should NOT have access to Premium features
   - Free users should have NO entitlements

---

## 4. Offerings Configuration

### Required Offering Setup

1. **Navigate to Offerings**:
   - Go to RevenueCat Dashboard → **Offerings**

2. **Check Offering**:
   - ✅ At least one offering exists (e.g., `default`)
   - ✅ Offering is set as **Current Offering**
   - ✅ Offering contains both packages:
     - Package for `pro_monthly` product
     - Package for `premium_monthly` product

3. **Package Identifiers**:
   - Package identifiers can be anything (e.g., `$pro_monthly`, `pro_monthly_package`)
   - Code will find packages by:
     - Package identifier containing "pro" OR product identifier = "pro_monthly"
     - Package identifier containing "premium" OR product identifier = "premium_monthly"

---

## 5. App Store Connect Configuration (iOS)

### Required Products

1. **Navigate to App Store Connect**:
   - Go to https://appstoreconnect.apple.com
   - Select your app → **Features** → **In-App Purchases**

2. **Create Subscriptions**:
   - ✅ Subscription product with ID: `pro_monthly`
     - Type: Auto-Renewable Subscription
     - Duration: 1 Month
     - Price: $9.99
   - ✅ Subscription product with ID: `premium_monthly`
     - Type: Auto-Renewable Subscription
     - Duration: 1 Month
     - Price: $19.99

3. **Link in RevenueCat**:
   - ✅ Both products linked in RevenueCat dashboard
   - ✅ Products show as "Active" in RevenueCat

---

## 6. Google Play Console Configuration (Android)

### Required Products

1. **Navigate to Google Play Console**:
   - Go to https://play.google.com/console
   - Select your app → **Monetize** → **Products** → **Subscriptions**

2. **Create Subscriptions**:
   - ✅ Subscription product with ID: `pro_monthly`
     - Type: Subscription
     - Billing period: 1 month
     - Price: $9.99
   - ✅ Subscription product with ID: `premium_monthly`
     - Type: Subscription
     - Billing period: 1 month
     - Price: $19.99

3. **Link in RevenueCat**:
   - ✅ Both products linked in RevenueCat dashboard
   - ✅ Products show as "Active" in RevenueCat

---

## 7. Testing Configuration

### ⚠️ IMPORTANT: Real Payments Enabled

Since you're using a production API key, **real payments will be processed**.

### Safe Testing Options:

#### iOS Sandbox Testing
1. **Sign out of App Store** on test device
2. **Use sandbox test account** when prompted
3. **No real charges** will occur
4. Test purchases will work but won't charge money

#### Android Testing
1. **Add test accounts** in Google Play Console:
   - Go to **Settings** → **License Testing**
   - Add test account emails
2. **Use test accounts** for purchases
3. **No real charges** will occur

---

## 8. Code-to-Dashboard Mapping

### Product Matching Logic

The code in `SubscriptionScreen.js` finds packages using:

```javascript
// For Pro tier:
pkg.identifier.includes('pro') || pkg.product.identifier === 'pro_monthly'

// For Premium tier:
pkg.identifier.includes('premium') || pkg.product.identifier === 'premium_monthly'
```

**This means**:
- Package identifier can be flexible (e.g., `$pro_monthly`, `pro_package`)
- Product identifier MUST be exactly `pro_monthly` or `premium_monthly`

### Entitlement Checking Logic

The code checks entitlements using:

```javascript
// Check for Premium first (highest tier)
if (activeEntitlements['premium']) {
  return 'premium';
}

// Check for Pro
if (activeEntitlements['pro']) {
  return 'pro';
}

// Default to Free
return 'free';
```

**This means**:
- Entitlement identifiers MUST be exactly `pro` and `premium`
- Products must be linked to these entitlements

---

## 9. Common Issues & Solutions

### Issue: "Package Not Found" Error

**Possible Causes**:
1. Products not created in RevenueCat
2. Products not added to offering
3. Offering not set as current
4. Product IDs don't match

**Solution**:
1. Verify products exist in RevenueCat dashboard
2. Verify products are in current offering
3. Verify product IDs match exactly: `pro_monthly`, `premium_monthly`

### Issue: Purchase Succeeds But Entitlement Not Active

**Possible Causes**:
1. Product not linked to entitlement
2. Entitlement ID mismatch
3. Customer info not refreshed

**Solution**:
1. Verify product is linked to correct entitlement in dashboard
2. Verify entitlement IDs are exactly `pro` and `premium`
3. Check customer info refresh logic

### Issue: Real Money Charged During Testing

**Possible Causes**:
1. Using production API key with real account
2. Not using sandbox/test accounts

**Solution**:
1. Always use sandbox/test accounts for testing
2. Sign out of App Store/Play Store before testing
3. Use test accounts provided by Apple/Google

---

## 10. Verification Steps Summary

### Step-by-Step Verification

1. ✅ **API Key**: Verify production key in dashboard
2. ✅ **Products**: Verify `pro_monthly` and `premium_monthly` exist
3. ✅ **Entitlements**: Verify `pro` and `premium` exist and are linked
4. ✅ **Offerings**: Verify current offering contains both packages
5. ✅ **App Store**: Verify products exist and are linked
6. ✅ **Play Store**: Verify products exist and are linked
7. ✅ **Test**: Use sandbox accounts to test purchases

---

## 11. Quick Test Procedure

### Test Purchase Flow

1. **Open App** → Navigate to Subscription screen
2. **Check Offerings Load**: Should see both Pro and Premium plans
3. **Test Pro Purchase**:
   - Click "Upgrade to Pro"
   - Use sandbox/test account
   - Verify purchase completes
   - Verify entitlement activates
4. **Test Premium Purchase**:
   - Click "Upgrade to Premium"
   - Use sandbox/test account
   - Verify purchase completes
   - Verify entitlement activates
5. **Verify Entitlement**:
   - Check `isPro` and `isPremium` flags
   - Verify features unlock correctly

---

## 📞 Need Help?

- **RevenueCat Dashboard**: https://app.revenuecat.com
- **RevenueCat Docs**: https://docs.revenuecat.com/
- **RevenueCat Support**: support@revenuecat.com

---

**Last Updated**: Configuration check for production payments
**Status**: Ready for dashboard verification

