import { View, Text, Image } from 'react-native';

export type RichMediaBlock = 
  | { type: 'text'; content: string }
  | { type: 'header'; content: string; level?: 1 | 2 | 3 }
  | { type: 'image'; url: string; caption?: string }
  | { type: 'quote'; content: string };

interface RichMediaRendererProps {
  content: any; // We'll cast carefully
}

export function RichMediaRenderer({ content }: RichMediaRendererProps) {
  if (!content || !Array.isArray(content) || content.length === 0) {
    return null;
  }

  return (
    <View className="mt-6 mb-6 space-y-4">
      {content.map((block: RichMediaBlock, index) => {
        switch (block.type) {
          case 'header':
            const sizeClass = block.level === 1 ? 'text-2xl' : block.level === 2 ? 'text-xl' : 'text-lg';
            return (
              <Text key={index} className={`font-bold text-gray-900 ${sizeClass} mt-2`}>
                {block.content}
              </Text>
            );
          
          case 'text':
            return (
              <Text key={index} className="text-gray-700 text-base leading-relaxed">
                {block.content}
              </Text>
            );
          
          case 'image':
            return (
              <View key={index} className="my-2">
                <View className="w-full h-56 bg-gray-100 rounded-lg overflow-hidden">
                  <Image 
                    source={{ uri: block.url }} 
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </View>
                {block.caption && (
                  <Text className="text-gray-500 text-xs text-center mt-2 italic">
                    {block.caption}
                  </Text>
                )}
              </View>
            );
          
          case 'quote':
            return (
              <View key={index} className="border-l-4 border-brand-primary pl-4 py-2 bg-gray-50 my-2 rounded-r">
                <Text className="text-gray-800 italic font-medium">
                  "{block.content}"
                </Text>
              </View>
            );
            
          default:
            return null;
        }
      })}
    </View>
  );
}
