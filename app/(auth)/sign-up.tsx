import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signUpWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) Alert.alert(error.message);
    else Alert.alert('Success', 'Please check your inbox for email verification!');
    setLoading(false);
  }

  return (
    <View className="flex-1 justify-center px-8 bg-white">
      <StatusBar style="dark" />
      <View className="items-center mb-10">
        <Text className="text-3xl font-bold text-gray-900">Join Bob U</Text>
        <Text className="text-gray-500 mt-2">Master the art of the cut.</Text>
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
          onPress={signUpWithEmail}
          disabled={loading}
        >
          <Text className="text-white font-bold text-lg">
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row justify-center mt-8">
        <Text className="text-gray-600">Already have an account? </Text>
        <Link href="/sign-in" asChild>
          <TouchableOpacity>
            <Text className="text-blue-600 font-bold">Sign In</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}
