import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppleSignInButton, GoogleSignInButton, SocialDivider } from '../../components/auth';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) Alert.alert('Sign In Failed', error.message);
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
          <Text className="text-3xl font-bold text-gray-900">Bob Company</Text>
          <Text className="text-gray-500 mt-2">Welcome back, stylist!</Text>
        </View>

        {/* Social Sign In Buttons */}
        <View className="space-y-3">
          <AppleSignInButton />
          <GoogleSignInButton />
        </View>

        <SocialDivider text="or continue with email" />

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
              autoComplete="password"
            />
          </View>

          <TouchableOpacity
            className={`w-full bg-black rounded-lg py-4 items-center ${loading ? 'opacity-70' : ''}`}
            onPress={signInWithEmail}
            disabled={loading}
          >
            <Text className="text-white font-bold text-lg">
              {loading ? 'Signing in...' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sign Up Link */}
        <View className="flex-row justify-center mt-8 mb-8">
          <Text className="text-gray-600">Don't have an account? </Text>
          <Link href="/sign-up" asChild>
            <TouchableOpacity>
              <Text className="text-blue-600 font-bold">Sign Up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
