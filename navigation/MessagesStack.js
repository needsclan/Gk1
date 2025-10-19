// navigation/MessagesStack.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ChatListScreen from "../screens/ChatListScreen";
import ChatScreen from "../screens/ChatScreen";

// opretter stack til beskeder og chat
const Stack = createNativeStackNavigator();

export default function MessagesStack() {
  return (
    <Stack.Navigator>
      {/* oversigt over alle chats */}
      <Stack.Screen
        name="ChatList"
        component={ChatListScreen}
        options={{ title: "Beskeder" }}
      />

      {/* individuel chat med en anden bruger */}
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ title: "Chat" }}
      />
    </Stack.Navigator>
  );
}
