import { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useVideoPlayer, VideoView, VideoViewProps } from 'expo-video';
import { useEvent } from 'expo';
import { Ionicons } from '@expo/vector-icons';

interface MuxVideoPlayerProps {
  playbackId: string | null;
  fallbackUrl?: string;
  title?: string;
  initialPosition?: number;
  onProgress?: (position: number, duration: number) => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
  autoPlay?: boolean;
  canSeekFuture?: boolean;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function MuxVideoPlayer({
  playbackId,
  fallbackUrl,
  title,
  initialPosition = 0,
  onProgress,
  onComplete,
  onError,
  autoPlay = false,
  canSeekFuture = false,
}: MuxVideoPlayerProps) {
  const videoRef = useRef<VideoView>(null);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [maxWatched, setMaxWatched] = useState(initialPosition);
  const [progressBarWidth, setProgressBarWidth] = useState(0);
  
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasCompletedRef = useRef(false);

  // Construct the Mux HLS URL
  const videoUrl = playbackId
    ? `https://stream.mux.com/${playbackId}.m3u8`
    : fallbackUrl;

  const player = useVideoPlayer(videoUrl || '', (p) => {
    p.loop = false;
    p.playbackRate = 1.0;
    if (initialPosition > 0) {
      p.currentTime = initialPosition;
    }
    if (autoPlay) {
      p.play();
    }
  });

  // Subscribe to player status changes
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  useEffect(() => {
    if (status === 'readyToPlay') {
      setIsBuffering(false);
    } else if (status === 'loading') {
      setIsBuffering(true);
    } else if (status === 'error') {
      onError?.('Failed to load video');
    }
  }, [status, onError]);

  // Track progress periodically
  useEffect(() => {
    if (isPlaying && !progressIntervalRef.current) {
      progressIntervalRef.current = setInterval(() => {
        if (player.currentTime && player.duration) {
          const currentTime = player.currentTime;
          
          // Update max watched
          if (currentTime > maxWatched) {
            setMaxWatched(currentTime);
          }
          
          onProgress?.(currentTime, player.duration);

          // Check for completion (90% watched)
          const percentWatched = (currentTime / player.duration) * 100;
          if (percentWatched >= 90 && !hasCompletedRef.current) {
            hasCompletedRef.current = true;
            onComplete?.();
          }
        }
      }, 5000); // Update every 5 seconds
    } else if (!isPlaying && progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [isPlaying, player, onProgress, onComplete, maxWatched]);

  // Auto-hide controls
  const hideControlsDelayed = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying]);

  useEffect(() => {
    if (showControls && isPlaying) {
      hideControlsDelayed();
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, isPlaying, hideControlsDelayed]);

  const togglePlayPause = () => {
    if (!hasStarted) {
      setHasStarted(true);
    }
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
    setShowControls(true);
  };

  const skipForward = () => {
    // Only allow skipping forward if we can seek future or if the new time is within what we've watched
    const targetTime = Math.min(player.currentTime + 10, player.duration || player.currentTime);
    if (!canSeekFuture && targetTime > maxWatched && targetTime > player.currentTime) {
        // Can't skip past max watched
        return;
    }
    player.currentTime = targetTime;
  };

  const skipBackward = () => {
    const newTime = Math.max(player.currentTime - 10, 0);
    player.currentTime = newTime;
  };

  const handleVideoPress = () => {
    setShowControls(!showControls);
    if (!showControls) {
      hideControlsDelayed();
    }
  };

  const enterFullscreen = () => {
    setIsFullscreen(true);
    videoRef.current?.enterFullscreen();
  };

  const handleFullscreenEnter = () => {
    setIsFullscreen(true);
  };

  const handleFullscreenExit = () => {
    setIsFullscreen(false);
  };
  
  const cyclePlaybackSpeed = () => {
    const speeds = [0.5, 1.0, 1.25, 1.5, 2.0];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    player.playbackRate = nextSpeed;
  };

  if (!videoUrl) {
    return (
      <View className="aspect-video bg-black items-center justify-center">
        <Ionicons name="videocam-off" size={48} color="#666" />
        <Text className="text-gray-400 mt-2">Video not available</Text>
      </View>
    );
  }

  return (
    <View className="aspect-video bg-black">
      <Pressable onPress={handleVideoPress} className="flex-1">
        <VideoView
          ref={videoRef}
          player={player}
          style={{ flex: 1 }}
          contentFit="contain"
          nativeControls={isFullscreen} // Use native controls in fullscreen
          allowsFullscreen
          allowsPictureInPicture
          onFullscreenEnter={handleFullscreenEnter}
          onFullscreenExit={handleFullscreenExit}
        />

        {/* Buffering indicator */}
        {isBuffering && (
          <View className="absolute inset-0 items-center justify-center bg-black/50">
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}

        {/* Play button overlay (before first play) */}
        {!hasStarted && !isBuffering && !isFullscreen && (
          <View className="absolute inset-0 items-center justify-center bg-black/30">
            <Pressable
              onPress={togglePlayPause}
              className="w-20 h-20 rounded-full bg-white/90 items-center justify-center"
            >
              <Ionicons name="play" size={40} color="#000" style={{ marginLeft: 4 }} />
            </Pressable>
          </View>
        )}

        {/* Custom controls overlay - hidden in fullscreen since native controls are used */}
        {showControls && hasStarted && !isFullscreen && (
          <View className="absolute inset-0 bg-black/40">
            {/* Top bar with title */}
            {title && (
              <View className="p-4 flex-row justify-between items-start">
                <Text className="text-white font-medium text-lg flex-1 mr-4" numberOfLines={1}>
                  {title}
                </Text>
                
                {/* Speed Control */}
                <Pressable 
                    onPress={cyclePlaybackSpeed}
                    className="bg-black/50 px-2 py-1 rounded border border-white/20"
                >
                    <Text className="text-white text-xs font-bold">{playbackSpeed}x</Text>
                </Pressable>
              </View>
            )}

            {/* Center controls */}
            <View className="flex-1 flex-row items-center justify-center gap-12">
              <Pressable onPress={skipBackward} className="p-2">
                <Ionicons name="play-back" size={32} color="#fff" />
              </Pressable>

              <Pressable
                onPress={togglePlayPause}
                className="w-16 h-16 rounded-full bg-white/20 items-center justify-center"
              >
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={32}
                  color="#fff"
                  style={!isPlaying ? { marginLeft: 3 } : undefined}
                />
              </Pressable>

              <Pressable 
                onPress={skipForward} 
                className={`p-2 ${(!canSeekFuture && player.currentTime >= maxWatched) ? 'opacity-30' : ''}`}
                disabled={!canSeekFuture && player.currentTime >= maxWatched}
              >
                <Ionicons name="play-forward" size={32} color="#fff" />
              </Pressable>
            </View>

            {/* Bottom bar with progress and fullscreen */}
            <View className="p-4">
              {/* Time display */}
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-white text-xs">
                  {formatTime(player.currentTime || 0)}
                </Text>
                <Text className="text-white text-xs">
                  {formatTime(player.duration || 0)}
                </Text>
              </View>

              {/* Progress bar */}
              <View 
                className="h-6 justify-center mb-1 relative"
                onLayout={(e) => setProgressBarWidth(e.nativeEvent.layout.width)}
              >
                  <Pressable
                    className="h-full justify-center"
                    onPress={(e) => {
                        if (!player.duration || progressBarWidth === 0) return;
                        const clickX = e.nativeEvent.locationX;
                        const percentage = Math.max(0, Math.min(1, clickX / progressBarWidth));
                        const targetTime = percentage * player.duration;

                        if (!canSeekFuture && targetTime > maxWatched && targetTime > player.currentTime) {
                            // Block seeking forward if not allowed
                            return; 
                        }
                        
                        player.currentTime = targetTime;
                    }}
                  >
                        <View className="h-1 bg-white/30 rounded-full overflow-hidden relative pointer-events-none">
                            <View
                            className="h-full bg-primary rounded-full absolute left-0 top-0"
                            style={{
                                width: `${
                                player.duration
                                    ? (player.currentTime / player.duration) * 100
                                    : 0
                                }%`,
                            }}
                            />
                            {!canSeekFuture && (
                                <View 
                                className="h-full bg-white/10 absolute top-0"
                                style={{
                                    left: `${
                                        player.duration
                                        ? (maxWatched / player.duration) * 100
                                        : 0
                                    }%`,
                                    right: 0
                                }}
                                />
                            )}
                        </View>
                        {/* Scrubber Knob */}
                        <View 
                            className="w-3 h-3 bg-white rounded-full absolute"
                            style={{
                                left: `${
                                    player.duration
                                    ? (player.currentTime / player.duration) * 100
                                    : 0
                                }%`,
                                marginLeft: -6
                            }}
                        />
                  </Pressable>
              </View>

              {/* Bottom controls */}
              <View className="flex-row items-center justify-end">
                <Pressable onPress={enterFullscreen} className="p-2">
                  <Ionicons name="expand" size={24} color="#fff" />
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </Pressable>
    </View>
  );
}
