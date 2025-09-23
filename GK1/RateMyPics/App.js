import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { RatingsProvider } from "./context/RatingsContext";
import RootStack from "./components/Stack"; // eller ./navigation/RootStack

export default function App() {
  return (
    <RatingsProvider>
      <NavigationContainer>
        <RootStack />
      </NavigationContainer>
    </RatingsProvider>
  );
}
