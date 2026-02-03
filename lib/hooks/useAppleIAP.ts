import { useState, useCallback } from 'react';
import { Platform, Alert } from 'react-native';

// Types for IAP (will be provided by react-native-iap when installed)
interface Product {
  productId: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  localizedPrice: string;
}

interface UseAppleIAPResult {
  products: Product[];
  loading: boolean;
  purchasing: boolean;
  error: string | null;
  isAvailable: boolean;
  purchaseProduct: (productId: string) => Promise<boolean>;
  restorePurchases: () => Promise<void>;
}

/**
 * Hook for Apple In-App Purchases
 *
 * NOTE: This hook requires `react-native-iap` to be installed and configured.
 * Currently returns a stub implementation until the package is added.
 *
 * To enable Apple IAP:
 * 1. Install: npx expo install react-native-iap
 * 2. Configure in app.json/app.config.js
 * 3. Set up products in App Store Connect
 * 4. Create the apple-iap-webhook edge function
 */
export function useAppleIAP(_productIds: string[]): UseAppleIAPResult {
  const [products] = useState<Product[]>([]);
  const [loading] = useState(false);
  const [purchasing] = useState(false);
  const [error] = useState<string | null>(null);

  // IAP is not available until react-native-iap is installed
  const isAvailable = false;

  const purchaseProduct = useCallback(async (_productId: string): Promise<boolean> => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Not Available', 'Apple In-App Purchases are only available on iOS');
      return false;
    }

    Alert.alert(
      'Not Configured',
      'In-app purchases are not yet configured. Please use the web checkout for now.'
    );
    return false;
  }, []);

  const restorePurchases = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      return;
    }

    Alert.alert(
      'Not Configured',
      'In-app purchases are not yet configured. Please contact support if you have an existing subscription.'
    );
  }, []);

  return {
    products,
    loading,
    purchasing,
    error,
    isAvailable,
    purchaseProduct,
    restorePurchases,
  };
}
