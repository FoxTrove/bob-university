import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Card } from '../ui/Card';
import { StylistProfile } from './StylistCard';
import { Ionicons } from '@expo/vector-icons';

// Conditionally import Mapbox - it requires native code
let Mapbox: typeof import('@rnmapbox/maps').default | null = null;
try {
    Mapbox = require('@rnmapbox/maps').default;
    const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.MAPBOX_ACCESS_TOKEN || '';
    if (Mapbox && MAPBOX_TOKEN) {
        Mapbox.setAccessToken(MAPBOX_TOKEN);
    }
} catch (e) {
    // Mapbox not available (Expo Go)
    Mapbox = null;
}

interface StylistMapProps {
    stylists: StylistProfile[];
    onRegionChange?: (bounds: { ne: [number, number], sw: [number, number] }) => void;
    onSelectStylist?: (stylist: StylistProfile) => void;
}

export function StylistMap({ stylists, onRegionChange, onSelectStylist }: StylistMapProps) {
    const mapRef = useRef<any>(null);
    const cameraRef = useRef<any>(null);

    // Default to US center if no stylists
    const centerCoordinate = [-98.5795, 39.8283];

    const handleRegionChange = async (feature: any) => {
        if (!onRegionChange) return;
        try {
             const bounds = await mapRef.current?.getVisibleBounds();
             if (bounds) {
                 const [ne, sw] = bounds;
                 onRegionChange({ ne: ne as [number, number], sw: sw as [number, number] });
             }
        } catch (e) {
            console.log("Error getting bounds", e);
        }
    };

    const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.MAPBOX_ACCESS_TOKEN || '';

    // Show fallback if Mapbox isn't available (Expo Go) or token is missing
    if (!Mapbox || !MAPBOX_TOKEN) {
        return (
             <Card className="h-64 bg-surfaceHighlight items-center justify-center mb-4">
                <Ionicons name="map-outline" size={48} color="#a1a1aa" />
                <Text className="text-textMuted mt-2">
                    {!Mapbox ? 'Map requires a native build' : 'Mapbox Token Missing'}
                </Text>
                <Text className="text-textMuted text-xs mt-1">
                    {!Mapbox ? 'Use EAS Build for map functionality' : ''}
                </Text>
            </Card>
        )
    }

    return (
        <View className="h-full w-full relative rounded-xl overflow-hidden border border-border">
             {/* Map */}
            <Mapbox.MapView
                ref={mapRef}
                style={{ flex: 1 }}
                styleURL={Mapbox.StyleURL.Dark}
                onMapIdle={handleRegionChange}
                scaleBarEnabled={false}
                logoEnabled={false}
                attributionEnabled={false}
            >
                <Mapbox.Camera
                    ref={cameraRef}
                    zoomLevel={3}
                    centerCoordinate={centerCoordinate}
                />

                 {/* Stylist Pins */}
                 {stylists.filter(s => s.latitude && s.longitude).map((stylist) => (
                     <Mapbox.PointAnnotation
                        key={stylist.id}
                        id={stylist.id}
                        coordinate={[stylist.longitude!, stylist.latitude!]}
                        onSelected={() => onSelectStylist?.(stylist)}
                     >
                         <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                             <Ionicons name="location-sharp" size={40} color="#3b82f6" />
                         </View>
                     </Mapbox.PointAnnotation>
                 ))}
            </Mapbox.MapView>
        </View>
    );
}
