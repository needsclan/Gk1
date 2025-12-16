import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../database/database";
import GlobalStyles from "../style/GlobalStyle";

export default function Login() {
  // state til email og kodeord
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // funktion til at logge bruger ind via firebase auth
  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      Alert.alert("Logget ind!");
    } catch (error) {
      let errorMessage = "";
      
      switch (error.code) {
        case "auth/invalid-email":
          errorMessage = "Ugyldig email adresse";
          break;
        case "auth/user-not-found":
          errorMessage = "Ingen bruger fundet med denne email";
          break;
        case "auth/wrong-password":
          errorMessage = "Forkert kodeord";
          break;
        case "auth/invalid-credential":
          errorMessage = "Forkert email eller kodeord";
          break;
        case "auth/too-many-requests":
          errorMessage = "For mange forsøg. Prøv igen senere";
          break;
        case "auth/user-disabled":
          errorMessage = "Denne bruger er deaktiveret";
          break;
        case "auth/network-request-failed":
          errorMessage = "Netværksfejl. Tjek din internetforbindelse";
          break;
        default:
          errorMessage = "Login fejlede. Prøv igen";
      }
      
      Alert.alert("Login fejl", errorMessage);
    }
  };

  // funktion til at sende password reset email
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert("Indtast email", "Skriv din email adresse i feltet ovenfor");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert("Email sendt", "Tjek din indbakke for at nulstille dit kodeord");
    } catch (error) {
      let errorMessage = "";
      
      switch (error.code) {
        case "auth/invalid-email":
          errorMessage = "Ugyldig email adresse";
          break;
        case "auth/user-not-found":
          errorMessage = "Ingen bruger fundet med denne email";
          break;
        default:
          errorMessage = "Kunne ikke sende email. Prøv igen";
      }
      
      Alert.alert("Fejl", errorMessage);
    }
  };

  return (
    <View>
      {/* overskrift */}
      <Text style={GlobalStyles.title}>Login</Text>

      {/* inputfelt til email */}
      <TextInput
        placeholder="Email"
        style={GlobalStyles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor="#888"
      />

      {/* inputfelt til kodeord */}
      <TextInput
        placeholder="Kodeord"
        style={GlobalStyles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor="#888"
      />

      {/* knap til login */}
      <TouchableOpacity style={GlobalStyles.button} onPress={handleLogin}>
        <Text style={GlobalStyles.buttonText}>Login</Text>
      </TouchableOpacity>

      {/* knap til glemt kodeord */}
      <TouchableOpacity onPress={handleForgotPassword} style={{ marginTop: 10, alignItems: "center" }}>
        <Text style={{ color: "#0066cc", fontSize: 14 }}>Glemt kodeord?</Text>
      </TouchableOpacity>
    </View>
  );
}
