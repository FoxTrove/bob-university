import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) Alert.alert(error.message);
    setLoading(false);
  }

  return (
    <View className="flex-1 justify-center px-8 bg-white">
      <StatusBar style="dark" />
      <View className="items-center mb-10">
        <Text className="text-3xl font-bold text-gray-900">Bob University</Text>
        <Text className="text-gray-500 mt-2">Welcome back, stylist!</Text>
      </View>

      <View className="space-y-4">
        <View>
          <Text className="text-gray-700 mb-1 font-medium">Email</Text>
          <TextInput
            className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 text-gray-900"
            placeholder="jessica@salon.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
        </View>

        <View>
          <Text className="text-gray-700 mb-1 font-medium">Password</Text>
          <TextInput
            className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 text-gray-900"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
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

      <View className="flex-row justify-center mt-8">
        <Text className="text-gray-600">Don't have an account? </Text>
        <Link href="/sign-up" asChild>
          <TouchableOpacity>
            <Text className="text-blue-600 font-bold">Sign Up</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}
