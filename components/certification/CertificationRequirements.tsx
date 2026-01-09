import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';

interface Requirement {
    id: string;
    label: string;
    met: boolean;
}

interface CertificationRequirementsProps {
    requirements: Requirement[];
}

export function CertificationRequirements({ requirements }: CertificationRequirementsProps) {
    return (
        <Card className="mb-6">
            <Text className="text-lg font-bold text-text mb-4">Requirements</Text>
            <View className="space-y-3">
                {requirements.map((req) => (
                    <View key={req.id} className="flex-row items-start gap-3">
                        <Ionicons 
                            name={req.met ? "checkmark-circle" : "ellipse-outline"} 
                            size={20} 
                            color={req.met ? "#22c55e" : "#52525b"} 
                            style={{ marginTop: 1 }}
                        />
                        <Text className={`flex-1 ${req.met ? 'text-text' : 'text-textMuted'}`}>
                            {req.label}
                        </Text>
                    </View>
                ))}
            </View>
        </Card>
    );
}
