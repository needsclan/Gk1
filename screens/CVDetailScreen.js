// screens/CVDetailScreen.js
import { View, Text, Pressable, ScrollView, useWindowDimensions, TouchableOpacity } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { auth } from "../database/database";

export default function CVDetailScreen() {
  // henter skærmhøjde til at beregne scroll padding
  const { height } = useWindowDimensions();

  // henter data fra ruten og navigation
  const { params } = useRoute();
  const navigation = useNavigation();

  // modtaget cv objekt
  const cv = params?.cv;
  if (!cv) return null;

  // identificerer begge brugere
  const otherUid = cv.uid || cv.ownerUid;
  const myUid = auth.currentUser?.uid;

  // genererer et unikt chatId baseret på begge bruger id’er
  const chatId = [myUid, otherUid].sort().join("_");

  // åbner chatten med den valgte bruger
  const openChat = () => {
    navigation.navigate("Messages", { screen: "Chat", params: { chatId, otherUid } });
  };

  // hovedlayout
  return (
    <Pressable style={{ flex: 1, backgroundColor: "#000" }} onPress={() => navigation.goBack()}>
      <View style={{ flex: 1, padding: 24 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: height * 0.1 }}
        >
          <Text style={{ fontSize: 24, fontWeight: "800", color: "#fff", marginBottom: 12 }}>CV</Text>
          <Text style={{ fontSize: 16, color: "#fff", lineHeight: 22 }}>{cv.text || ""}</Text>
        </ScrollView>

        {/* flydende knap nederst til at starte chat */}
        <TouchableOpacity
          onPress={openChat}
          style={{
            position: "absolute",
            right: 24,
            bottom: 24,
            backgroundColor: "#fff",
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 24,
          }}
        >
          <Text style={{ fontWeight: "700" }}>Send besked</Text>
        </TouchableOpacity>
      </View>
    </Pressable>
  );
}
