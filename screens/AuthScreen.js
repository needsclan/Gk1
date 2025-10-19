import React, { useState } from "react";
import { View, Button } from "react-native";
import Signup from "../components/SignUpComponent";
import Login from "../components/LogInComponent";
import GlobalStyles from "../style/GlobalStyle";

export default function AuthScreen() {
  // styrer om login eller signup skal vises
  const [isLogin, setIsLogin] = useState(true);

  return (
    <View style={GlobalStyles.container}>
      {/* viser enten login eller signup afhængigt af state */}
      {isLogin ? <Login /> : <Signup />}
      
      {/* knap til at skifte mellem login og signup */}
      <View style={GlobalStyles.switchContainer}>
        <Button
          title={
            isLogin
              ? "Har du ikke en konto? Opret en"
              : "Har du en konto? Log ind"
          }
          onPress={() => setIsLogin((prev) => !prev)}
        />
      </View>
    </View>
  );
}
