import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppleSignInButton, GoogleSignInButton, SocialDivider } from '../../components/auth';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signUpWithEmail() {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      Alert.alert('Sign Up Failed', error.message);
    } else {
      Alert.alert('Success', 'Please check your inbox for email verification!');
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
        className="px-8"
      >
        <StatusBar style="dark" />

        {/* Header */}
        <View className="items-center mb-10">
          <Text className="text-3xl font-bold text-gray-900">Join Bob U</Text>
          <Text className="text-gray-500 mt-2">Master the art of the cut.</Text>
        </View>

        {/* Social Sign In Buttons */}
        <View className="space-y-3">
          <AppleSignInButton />
          <GoogleSignInButton />
        </View>

        <SocialDivider text="or sign up with email" />

        {/* Email/Password Form */}
        <View className="space-y-4">
          <View>
            <Text className="text-gray-700 mb-1 font-medium">Email</Text>
            <TextInput
              className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 text-gray-900"
              placeholder="jessica@salon.com"
              placeholderTextColor="#6B7280"
              style={{ color: '#111827' }} // Enforce text-gray-900 for dark mode
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          <View>
            <Text className="text-gray-700 mb-1 font-medium">Password</Text>
            <TextInput
              className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 text-gray-900"
              placeholder="••••••••"
              placeholderTextColor="#6B7280"
              style={{ color: '#111827' }} // Enforce text-gray-900 for dark mode
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
            />
            <Text className="text-gray-400 text-xs mt-1">Must be at least 6 characters</Text>
          </View>

          <TouchableOpacity
            className={`w-full bg-black rounded-lg py-4 items-center ${loading ? 'opacity-70' : ''}`}
            onPress={signUpWithEmail}
            disabled={loading}
          >
            <Text className="text-white font-bold text-lg">
              {loading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Terms Notice */}
        <Text className="text-gray-400 text-xs text-center mt-4 px-4">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </Text>

        {/* Sign In Link */}
        <View className="flex-row justify-center mt-6 mb-8">
          <Text className="text-gray-600">Already have an account? </Text>
          <Link href="/sign-in" asChild>
            <TouchableOpacity>
              <Text className="text-blue-600 font-bold">Sign In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
