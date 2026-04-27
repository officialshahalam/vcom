import React from "react";
import { ScrollView, Pressable, Text } from "react-native";

const filters = ["Normal", "Blur", "Grayscale", "Warm", "Cool", "Beauty"];

export const FilterPicker: React.FC<{ value: string; onChange: (value: string) => void }> = ({ value, onChange }) => {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
      {filters.map((filter) => (
        <Pressable
          key={filter}
          onPress={() => onChange(filter)}
          className={`mr-2 rounded-full px-4 py-2 ${value === filter ? "bg-[#007AFF]" : "bg-[#1C1C1E]"}`}
        >
          <Text className="text-sm text-white">{filter}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
};
