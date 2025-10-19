import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import ProfileScreen from "../screens/ProfileScreen";
import ConfirmDeleteScreen from "../screens/ConfirmDeleteScreen";

// opretter stack til profilsiden og sletning
const Stack = createStackNavigator();

export default function ProfileStack() {
  return (
    <Stack.Navigator>
      {/* hovedprofil med redigering og logout */}
      <Stack.Screen
        name="ProfileHome"
        component={ProfileScreen}
        options={{ title: "Min profil" }}
      />

      {/* bekræftelse af sletning af konto */}
      <Stack.Screen
        name="ConfirmDelete"
        component={ConfirmDeleteScreen}
        options={{ title: "Slet profil" }}
      />
    </Stack.Navigator>
  );
}
