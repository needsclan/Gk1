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
    <View
      style={{
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderColor: "#eee",
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <TouchableOpacity
        onPress={() => onPress?.(item)}
        style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
      >
        <TouchableOpacity
          onPress={() => onViewProfile?.()}
          style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: "#eee", alignItems: "center", justifyContent: "center",
            marginRight: 12,
            overflow: "hidden",
          }}
        >
          {item.photoUrl ? (
            <Image
              source={{ uri: item.photoUrl }}
              style={{ width: 36, height: 36, borderRadius: 18 }}
            />
          ) : (
            <Text style={{ fontWeight: "700" }}>
              {item.otherUsername?.slice(0,1)?.toUpperCase() || "?"}
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: "700" }} numberOfLines={1}>
            {item.otherUsername || item.otherUid}
          </Text>
          <Text style={{ color: "#666" }} numberOfLines={1}>
            {item.lastMessage || "…"}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={confirmDelete}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityLabel="Slet samtale"
      >
        <Ionicons name="trash-outline" size={22} />
      </TouchableOpacity>
    </View>
  );
}

export default memo(ChatListItem);
