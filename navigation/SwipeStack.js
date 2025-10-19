import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SwipeCVScreen from "../screens/SwipeCVScreen";
import CVDetailScreen from "../screens/CVDetailScreen";

// opretter stack til swipe flowet
const Stack = createNativeStackNavigator();

export default function SwipeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* hovedskærm hvor man swiper gennem cv'er */}
      <Stack.Screen name="SwipeList" component={SwipeCVScreen} />
      {/* detaljeskærm for et valgt cv */}
      <Stack.Screen name="CVDetail" component={CVDetailScreen} />
    </Stack.Navigator>
  );
}
