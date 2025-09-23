import * as React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import HomeScreen from "../screens/HomeScreen";
import GalleryScreen from "../screens/GalleryScreen";
import DetailsScreen from "../screens/DetailsScreen";

const Stack = createStackNavigator();

export default function RootStack() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerTitleAlign: "center",
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Gallery" component={GalleryScreen} />
      <Stack.Screen
        name="Details"
        component={DetailsScreen}
        options={{ title: "Rate billede" }}
      />
    </Stack.Navigator>
  );
}
