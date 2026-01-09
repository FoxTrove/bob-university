import { supabase } from '../supabase';

// Flag to check if native module is available
let isNativeModuleAvailable = false;
let GoogleSignin: any = null;
let statusCodes: any = null;
let isSuccessResponse: any = null;
let isErrorWithCode: any = null;

// Try to import the native module - will fail in Expo Go
try {
  const module = require('@react-native-google-signin/google-signin');
  GoogleSignin = module.GoogleSignin;
  statusCodes = module.statusCodes;
  isSuccessResponse = module.isSuccessResponse;
  isErrorWithCode = module.isErrorWithCode;
  isNativeModuleAvailable = true;
} catch {
  // Native module not available (e.g., in Expo Go)
  isNativeModuleAvailable = false;
}

export interface GoogleSignInResult {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    email?: string;
    name?: string;
    photo?: string;
  };
}

/**
 * Check if Google Sign-In is available
 * Returns false in Expo Go (requires development build)
 */
export function isGoogleSignInAvailable(): boolean {
  return isNativeModuleAvailable;
}

/**
 * Configure Google Sign In
 * Must be called before attempting sign in (typically in app initialization)
 *
 * Note: The webClientId should be the Web client ID from Google Cloud Console,
 * NOT the iOS or Android client ID
 */
export function configureGoogleSignIn() {
  if (!isNativeModuleAvailable || !GoogleSignin) {
    console.log('Google Sign-In not available (requires development build)');
    return;
  }

  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (!webClientId) {
    console.warn('Google Sign-In configuration skipped: Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID');
    return;
  }

  GoogleSignin.configure({
    // Web client ID from Google Cloud Console
    // This is required for getting the idToken for Supabase
    webClientId,
    // iOS client ID (optional, but recommended for iOS)
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    // Request offline access to get a refresh token
    offlineAccess: true,
    // Force account selection even if only one account
    forceCodeForRefreshToken: true,
  });
}

/**
 * Check if Google Play Services are available (Android only)
 */
export async function hasGooglePlayServices(): Promise<boolean> {
  if (!isNativeModuleAvailable || !GoogleSignin) {
    return false;
  }

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    return true;
  } catch {
    return false;
  }
}

/**
 * Perform Google Sign In and authenticate with Supabase
 *
 * Flow:
 * 1. Sign in with Google to get an ID token
 * 2. Send the ID token to Supabase
 * 3. Supabase verifies the token and creates/signs in the user
 *
 * Important: Supabase must have "Skip nonce checks" enabled for Google
 * in Dashboard > Authentication > Providers > Google
 */
export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  if (!isNativeModuleAvailable || !GoogleSignin) {
    return {
      success: false,
      error: 'Google Sign-In requires a development build. Please use email sign-in in Expo Go.',
    };
  }

  try {
    // Check for Google Play Services (required on Android)
    await GoogleSignin.hasPlayServices();

    // Perform Google Sign In
    const response = await GoogleSignin.signIn();

    if (!isSuccessResponse(response)) {
      return {
        success: false,
        error: 'Google Sign In was not successful',
      };
    }

    const { data: signInData } = response;

    if (!signInData.idToken) {
      return {
        success: false,
        error: 'No ID token received from Google',
      };
    }

    // Sign in with Supabase using the Google ID token
    // Note: We don't pass a nonce because Google's SDK doesn't support it
    // Make sure "Skip nonce checks" is enabled in Supabase for Google provider
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: signInData.idToken,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      user: {
        id: data.user?.id || '',
        email: data.user?.email,
        name: signInData.user.name || undefined,
        photo: signInData.user.photo || undefined,
      },
    };
  } catch (error: any) {
    // Handle specific Google Sign In errors
    if (isErrorWithCode && isErrorWithCode(error)) {
      switch (error.code) {
        case statusCodes?.SIGN_IN_CANCELLED:
          return {
            success: false,
            error: 'Sign in was cancelled',
          };
        case statusCodes?.IN_PROGRESS:
          return {
            success: false,
            error: 'Sign in is already in progress',
          };
        case statusCodes?.PLAY_SERVICES_NOT_AVAILABLE:
          return {
            success: false,
            error: 'Google Play Services is not available',
          };
        default:
          return {
            success: false,
            error: error.message || 'An error occurred during Google Sign In',
          };
      }
    }

    return {
      success: false,
      error: error.message || 'An error occurred during Google Sign In',
    };
  }
}

/**
 * Sign out from Google
 * Call this when the user signs out from your app
 */
export async function signOutFromGoogle(): Promise<void> {
  if (!isNativeModuleAvailable || !GoogleSignin) {
    return;
  }

  try {
    await GoogleSignin.signOut();
  } catch {
    // Ignore errors during sign out
  }
}

/**
 * Check if user is currently signed in to Google
 */
export function isGoogleSignedIn(): boolean {
  if (!isNativeModuleAvailable || !GoogleSignin) {
    return false;
  }
  return GoogleSignin.hasPreviousSignIn();
}
