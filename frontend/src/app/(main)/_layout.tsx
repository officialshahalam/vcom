import { Tabs } from "expo-router";
import { View, Text } from "react-native";

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View className="items-center justify-center pt-1">
      <Text className={`text-xl ${focused ? "opacity-100" : "opacity-50"}`}>{icon}</Text>
      <Text className={`text-xs mt-0.5 ${focused ? "text-violet-400" : "text-gray-500"}`}>
        {label}
      </Text>
    </View>
  );
}

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#111827",
          borderTopColor: "#1f2937",
          height: 64,
          paddingBottom: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="chat"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="💬" label="Chats" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="👥" label="Contacts" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="calls"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="📞" label="Calls" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
