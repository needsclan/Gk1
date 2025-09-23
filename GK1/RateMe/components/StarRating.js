import React from "react";
import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function StarRating({ value = 0, onChange, size = 28, spacing = 6 }) {
  // value: 0-5
  return (
    <View style={{ flexDirection: "row" }}>
      {Array.from({ length: 5 }).map((_, i) => {
        const idx = i + 1;
        const name = idx <= value ? "star" : "star-outline";
        return (
          <Pressable key={idx} onPress={() => onChange?.(idx)} style={{ marginRight: spacing }}>
            <Ionicons name={name} size={size} />
          </Pressable>
        );
      })}
    </View>
  );
}
