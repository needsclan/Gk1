import React from "react";
import { View, Text } from "react-native";
import styles from "../styles/styles";
import CustomButton from "../components/ButtonComponent";

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>RateMyPics</Text>
      <Text style={styles.subtitle}>Rate billeder med stjerner ⭐</Text>

      <CustomButton
        label="Gå til Galleri"
        type="primary"
        onPress={() => navigation.navigate("Gallery")}
      />

      <CustomButton
        label="Upload (dummy)"
        type="ghost"
        onPress={() => alert("Upload kommer snart 🤞")}
      />
    </View>
  );
}
