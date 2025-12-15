import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import SwipeStack from "./SwipeStack";
import EditCVScreen from "../screens/EditCVScreen";
import ProfileStack from "./ProfileStack";
import MessagesStack from "./MessagesStack";

// opretter bundnavigation med fire faner
const Tab = createBottomTabNavigator();

export default function TabsNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="SwipeCV"
      screenOptions={{ headerShown: false }}
    >
      {/* swipe sektion */}
      <Tab.Screen
        name="SwipeCV"
        component={SwipeStack}
        options={{
          title: "Swipe",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />

      {/* rediger eget cv */}
      <Tab.Screen
        name="EditCV"
        component={EditCVScreen}
        options={{
          title: "Rediger CV",
          headerShown: true,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="create-outline" size={size} color={color} />
          ),
        }}
      />

      {/* profil og kontoindstillinger */}
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />

      {/* kontakter og chat */}
      <Tab.Screen
        name="Messages"
        component={MessagesStack}
        options={{
          title: "Kontakter",
          unmountOnBlur: true, // smider stacken væk ved tab-skift
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
