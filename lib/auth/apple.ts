import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { supabase } from '../supabase';

/**
 * Generate a random nonce for Apple Sign In
 * Apple requires a nonce for security - it prevents replay attacks
 */
async function generateNonce(): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  return Array.from(randomBytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Hash a nonce using SHA256 for Apple Sign In
 * Apple expects the nonce in the JWT to be SHA256 hashed
 */
async function sha256(input: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    input
  );
  return digest;
}

export interface AppleSignInResult {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    email?: string;
    fullName?: {
      givenName?: string;
      familyName?: string;
    };
  };
}

/**
 * Check if Apple Sign In is available on this device
 * Only available on iOS 13+ and macOS 10.15+
 */
export async function isAppleSignInAvailable(): Promise<boolean> {
  return await AppleAuthentication.isAvailableAsync();
}

/**
 * Perform Apple Sign In and authenticate with Supabase
 *
 * Flow:
 * 1. Generate a random nonce
 * 2. Hash the nonce with SHA256
 * 3. Request Apple credential with the hashed nonce
 * 4. Send the identity token to Supabase with the raw nonce
 * 5. Supabase verifies the token and creates/signs in the user
 */
export async function signInWithApple(): Promise<AppleSignInResult> {
  try {
    // Generate nonce for security
    const rawNonce = await generateNonce();
    const hashedNonce = await sha256(rawNonce);

    // Request Apple credential
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!credential.identityToken) {
      return {
        success: false,
        error: 'No identity token received from Apple',
      };
    }

    // Sign in with Supabase using the Apple identity token
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      nonce: rawNonce, // Supabase expects the raw nonce, not hashed
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    // Apple only provides the user's full name on FIRST sign-in
    // If we have it, we should save it to the user's profile
    if (credential.fullName?.givenName || credential.fullName?.familyName) {
      const fullName = [
        credential.fullName.givenName,
        credential.fullName.familyName,
      ]
        .filter(Boolean)
        .join(' ');

      // Update user metadata with full name
      await supabase.auth.updateUser({
        data: { full_name: fullName },
      });
    }

    return {
      success: true,
      user: {
        id: data.user?.id || '',
        email: data.user?.email,
        fullName: credential.fullName
          ? {
              givenName: credential.fullName.givenName || undefined,
              familyName: credential.fullName.familyName || undefined,
            }
          : undefined,
      },
    };
  } catch (error: any) {
    // Handle specific Apple authentication errors
    if (error.code === 'ERR_REQUEST_CANCELED') {
      return {
        success: false,
        error: 'Sign in was cancelled',
      };
    }

    return {
      success: false,
      error: error.message || 'An error occurred during Apple Sign In',
    };
  }
}
