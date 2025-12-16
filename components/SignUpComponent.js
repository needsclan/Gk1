import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";
import { auth, rtdb } from "../database/database";
import GlobalStyles from "../style/GlobalStyle";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const handleSignup = async () => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const uid = cred.user.uid;

      // gem username i RTDB
      await set(ref(rtdb, `users/${uid}`), {
        username: username.trim(),
        email: email.trim(),
        createdAt: Date.now(),
      });

      Alert.alert("Bruger oprettet!", `Velkommen, ${username}`);
    } catch (error) {
      let errorMessage = "";
      
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "Denne email er allerede i brug";
          break;
        case "auth/invalid-email":
          errorMessage = "Ugyldig email adresse";
          break;
        case "auth/weak-password":
          errorMessage = "Kodeordet er for svagt. Brug mindst 6 tegn";
          break;
        case "auth/operation-not-allowed":
          errorMessage = "Oprettelse af bruger er ikke tilladt";
          break;
        case "auth/network-request-failed":
          errorMessage = "Netværksfejl. Tjek din internetforbindelse";
          break;
        default:
          errorMessage = "Oprettelse fejlede. Prøv igen";
      }
      
      Alert.alert("Oprettelse fejl", errorMessage);
    }
  };

  return (
    <View>
      <Text style={GlobalStyles.title}>Opret bruger</Text>

      {/* Brugernavn */}
      <TextInput
        placeholder="Brugernavn"
        style={GlobalStyles.input}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        placeholderTextColor="#888"
      />

      {/* Email */}
      <TextInput
        placeholder="Email"
        style={GlobalStyles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor="#888"
      />

      {/* Kodeord */}
      <TextInput
        placeholder="Kodeord"
        style={GlobalStyles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor="#888"
      />

      <TouchableOpacity style={GlobalStyles.button} onPress={handleSignup}>
        <Text style={GlobalStyles.buttonText}>Opret bruger</Text>
      </TouchableOpacity>
    </View>
  );
}
