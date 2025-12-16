import React, { useState } from "react";
import { View, Button, ImageBackground } from "react-native";
import Signup from "../components/SignUpComponent";
import Login from "../components/LogInComponent";
import GlobalStyles from "../style/GlobalStyle";

export default function AuthScreen() {
  // styrer om login eller signup skal vises
  const [isLogin, setIsLogin] = useState(true);

  return (
    <ImageBackground
      source={require('../assets/image.png')}
      style={[GlobalStyles.container, { backgroundColor: "#f8f9fa" }]}
      resizeMode="center"
      imageStyle={{ opacity: 0.15 }}
    >
      <View style={{ flex: 1, justifyContent: "flex-start", paddingTop: 80 }}>
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
    </ImageBackground>
  );
}
