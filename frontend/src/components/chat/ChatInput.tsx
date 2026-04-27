import React, { useState } from "react";
import { Modal, Pressable, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import EmojiSelector from "react-native-emoji-selector";

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
};

export const ChatInput: React.FC<Props> = ({ value, onChangeText, onSend }) => {
  const [showEmoji, setShowEmoji] = useState(false);

  return (
    <View className="mb-4">
      <Modal
        visible={showEmoji}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEmoji(false)}
      >
        <Pressable className="flex-1" onPress={() => setShowEmoji(false)}>
          <View className="flex-1 justify-end pb-32 pl-4">
            <View
              onStartShouldSetResponder={() => true}
              // @ts-expect-error onClick is a DOM passthrough on React Native Web
              onClick={(e: { stopPropagation?: () => void }) => e.stopPropagation?.()}
              style={{ width: 340, height: 380 }}
              className="overflow-hidden rounded-2xl bg-[#1C1C1E]"
            >
              <EmojiSelector
                onEmojiSelected={(emoji: string) => onChangeText(value + emoji)}
                showSearchBar
                showHistory={false}
                columns={7}
                theme="#007AFF"
              />
            </View>
          </View>
        </Pressable>
      </Modal>

      <View className="mx-4 flex-row items-center rounded-full bg-[#1C1C1E] px-3 py-2">
        <Pressable onPress={() => setShowEmoji((v) => !v)} className="mr-2">
          <Ionicons
            name={showEmoji ? "close-circle-outline" : "happy-outline"}
            color="#8E8E93"
            size={22}
          />
        </Pressable>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setShowEmoji(false)}
          placeholder="Message..."
          placeholderTextColor="#8E8E93"
          className="flex-1 px-2 text-white"
        />
        <Pressable onPress={onSend} className="rounded-full bg-[#007AFF] p-2">
          <Ionicons name="arrow-up" color="#fff" size={16} />
        </Pressable>
      </View>
    </View>
  );
};
