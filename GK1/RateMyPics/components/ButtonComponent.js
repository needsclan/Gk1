import React from "react";
import { Pressable, Text } from "react-native";
import styles from "../styles/styles";

export default function CustomButton({ label, onPress, type = "primary" }) {
  let buttonStyle = [styles.button];
  let textStyle = styles.buttonText;

  if (type === "primary") {
    buttonStyle.push(styles.buttonPrimary);
    textStyle = styles.buttonText;
  } else if (type === "ghost") {
    buttonStyle.push(styles.buttonGhost);
    textStyle = styles.buttonTextGhost;
  }

  return (
    <Pressable style={buttonStyle} onPress={onPress}>
      <Text style={textStyle}>{label}</Text>
    </Pressable>
  );
}
