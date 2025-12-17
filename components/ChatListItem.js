import React, { memo } from "react";
import { View, Text, TouchableOpacity, Alert, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Komponent der viser én chat i chat-listen
// Props:
// - item: chat objekt med otherUsername, otherUid, lastMessage, photoUrl
// - onPress: funktion der kaldes når brugeren klikker på chatten
// - onDelete: funktion der kaldes når brugeren sletter chatten
// - onViewProfile: funktion der kaldes når brugeren klikker på profilbilledet
function ChatListItem({ item, onPress, onDelete, onViewProfile }) {
  // viser bekræftelsesdialog før sletning af chat
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
    <View style={{ paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#f8f9fa" }}>
      {/* Hovedcontainer der kan trykkes på for at åbne chatten */}
      <TouchableOpacity
        onPress={() => onPress?.(item)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderRadius: 12,
          backgroundColor: "#ffffff",
          borderWidth: 1,
          borderColor: "#e0e7ff",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        {/* Profilbillede cirkel - kan trykkes på for at se profil */}
        <TouchableOpacity
          onPress={() => onViewProfile?.()}
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: "#f0f6ff",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            borderWidth: 2,
            borderColor: "#0066cc",
          }}
        >
          {/* Hvis bruger har uploadet profilbillede, vis det - ellers vis SkillBridge logo */}
          {item.photoUrl ? (
            <Image
              source={{ uri: item.photoUrl }}
              style={{ width: 52, height: 52, borderRadius: 26 }}
            />
          ) : (
            <Image
              source={require('../assets/image.png')}
              style={{ width: 40, height: 40, opacity: 0.3 }}
              resizeMode="contain"
            />
          )}
        </TouchableOpacity>

        {/* Tekst område med navn og seneste besked */}
        <View style={{ flex: 1 }}>
          {/* Brugerens visningsnavn */}
          <Text style={{ fontWeight: "700", fontSize: 15, color: "#1a1a1a", marginBottom: 4 }} numberOfLines={1}>
            {item.otherUsername || item.otherUid}
          </Text>
          {/* Seneste besked eller placeholder tekst */}
          <Text style={{ color: "#0066cc", fontSize: 12, opacity: 0.85 }} numberOfLines={1}>
            {item.lastMessage || "Ingen samtale endnu"}
          </Text>
        </View>

        {/* Menu knap (tre prikker) til at slette samtalen */}
        <TouchableOpacity
          onPress={confirmDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Slet samtale"
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#0066cc" />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
}

// memo() optimering: kun re-render hvis props ændres
export default memo(ChatListItem);
