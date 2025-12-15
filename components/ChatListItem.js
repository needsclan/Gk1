import React, { memo } from "react";
import { View, Text, TouchableOpacity, Alert, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

function ChatListItem({ item, onPress, onDelete, onViewProfile }) {
  const confirmDelete = () => {
    Alert.alert(
      "Slet samtale",
      `Vil du slette chatten med ${item.otherUsername || "brugeren"}?`,
      [
        { text: "Annuller", style: "cancel" },
        { text: "Slet", style: "destructive", onPress: () => onDelete?.(item) },
      ]
    );
  };

  return (
    <View style={{ paddingHorizontal: 12, paddingVertical: 10 }}>
      <TouchableOpacity
        onPress={() => onPress?.(item)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderRadius: 12,
          backgroundColor: "#0f1220",
          borderWidth: 1.5,
          borderColor: "#00d4ff",
          shadowColor: "#00d4ff",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
          elevation: 5,
        }}
      >
        <TouchableOpacity
          onPress={() => onViewProfile?.()}
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: "#1a1f3a",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            borderWidth: 2,
            borderColor: "#00ff88",
          }}
        >
          {item.photoUrl ? (
            <Image
              source={{ uri: item.photoUrl }}
              style={{ width: 52, height: 52, borderRadius: 26 }}
            />
          ) : (
            <Text style={{ fontWeight: "800", fontSize: 18, color: "#00ff88" }}>
              {item.otherUsername?.slice(0, 1)?.toUpperCase() || "?"}
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: "700", fontSize: 15, color: "#00ff88", marginBottom: 4 }} numberOfLines={1}>
            {item.otherUsername || item.otherUid}
          </Text>
          <Text style={{ color: "#00d4ff", fontSize: 12, opacity: 0.85 }} numberOfLines={1}>
            {item.lastMessage || "Ingen samtale endnu"}
          </Text>
        </View>

        <TouchableOpacity
          onPress={confirmDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Slet samtale"
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#00d4ff" />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
}

export default memo(ChatListItem);
