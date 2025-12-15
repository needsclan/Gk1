// screens/CVDetailScreen.js
import { View, Text, ScrollView, useWindowDimensions, Image, TouchableOpacity, Pressable } from "react-native";
import { useRoute, useNavigation, CommonActions } from "@react-navigation/native";
import { useEffect, useState, useRef } from "react";
import { auth } from "../database/database";

// helper: lav værdi om til label
const toLabel = (v) => {
  if (v == null) return "";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "object") return Object.values(v).map(String).join(", ");
  return String(v);
};

export default function CVDetailScreen() {
  // henter skærmhøjde til at beregne scroll padding
  const { height } = useWindowDimensions();

  // henter data fra ruten og navigation
  const { params } = useRoute();
  const navigation = useNavigation();

  // modtaget cv objekt
  const cv = params?.cv;
  if (!cv) return null;

  // Lyt til tab skift og pop CVDetail fra stack hvis man navigerer væk
  useEffect(() => {
    if (!params?.fromContacts) return;

    const parent = navigation.getParent();
    if (!parent) return;

    const unsubscribe = parent.addListener('state', (e) => {
      // Tjek om vi ikke længere er på SwipeCV tab
      const currentRoute = e.data.state.routes[e.data.state.index];
      if (currentRoute?.name !== 'SwipeCV') {
        // Pop CVDetail fra stacken
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      }
    });

    return unsubscribe;
  }, [params?.fromContacts, navigation]);

  // hvis brugeren kom fra kontakter, skal goBack gå tilbage til Messages i stedet for SwipeList
  const handleGoBack = () => {
    if (params?.fromContacts) {
      // Pop tilbage til SwipeList
      navigation.goBack();
      // Gå til Messages tab
      navigation.getParent()?.navigate("Messages");
    } else {
      navigation.goBack();
    }
  };

  // hovedlayout
  return (
    <View style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
          {/* Profilbillede øverst */}
          <TouchableOpacity 
            onPress={handleGoBack}
            style={{ alignItems: "center", paddingTop: 20, paddingBottom: 16, backgroundColor: "#fff" }}
            activeOpacity={0.7}
          >
            {cv.photoUrl ? (
              <Image
                source={{ uri: cv.photoUrl }}
                style={{ width: 140, height: 140, borderRadius: 70, borderWidth: 3, borderColor: "#0066cc" }}
              />
            ) : (
              <Image
                source={require('../assets/image.png')}
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: 70,
                  borderWidth: 3,
                  borderColor: "#0066cc",
                }}
                resizeMode="cover"
              />
            )}
          </TouchableOpacity>
          <View style={{ backgroundColor: "#fff", marginHorizontal: 16, marginTop: 8, borderRadius: 12, padding: 20, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 }}>
            <Text style={{ fontSize: 22, fontWeight: "700", color: "#1a1a1a", marginBottom: 4, textAlign: "center" }}>
              {cv.headline || "CV"}
            </Text>
            <Text style={{ fontSize: 14, color: "#666", marginBottom: 16, textAlign: "center" }}>
              {cv.jobTitle || "Professionel"}
            </Text>

            {/* To kolonner */}
            <View style={{ flexDirection: "row", gap: 16, marginBottom: 16 }}>
              {/* Venstre kolonne */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: "#0066cc", fontWeight: "700", marginBottom: 4 }}>
                  LOKATION
                </Text>
                <Text style={{ fontSize: 14, color: "#333", marginBottom: 12 }}>
                  {cv.city || cv.region || "Ikke angivet"}
                </Text>

                <Text style={{ fontSize: 12, color: "#0066cc", fontWeight: "700", marginBottom: 4 }}>
                  ALDER
                </Text>
                <Text style={{ fontSize: 14, color: "#333", marginBottom: 12 }}>
                  {cv.age ? `${cv.age} år` : "Ikke angivet"}
                </Text>

                <Text style={{ fontSize: 12, color: "#0066cc", fontWeight: "700", marginBottom: 4 }}>
                  ERFARING
                </Text>
                <Text style={{ fontSize: 14, color: "#333", marginBottom: 12 }}>
                  {cv.yearsExp ? `${cv.yearsExp} års erfaring` : "Ikke angivet"}
                </Text>

                <Text style={{ fontSize: 12, color: "#0066cc", fontWeight: "700", marginBottom: 4 }}>
                  UDDANNELSE
                </Text>
                <Text style={{ fontSize: 14, color: "#333", marginBottom: 12 }}>
                  {cv.educationLevel || "Ikke angivet"}
                </Text>
              </View>

              {/* Højre kolonne */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: "#0066cc", fontWeight: "700", marginBottom: 4 }}>
                  TILGÆNGELIGHED
                </Text>
                <Text style={{ fontSize: 14, color: "#333", marginBottom: 12 }}>
                  {cv.availability || "Ikke angivet"}
                </Text>

                <Text style={{ fontSize: 12, color: "#0066cc", fontWeight: "700", marginBottom: 4 }}>
                  SKILLS
                </Text>
                <Text style={{ fontSize: 14, color: cv.skills ? "#333" : "#999", marginBottom: 12 }}>
                  {cv.skills ? toLabel(cv.skills) : "Ikke angivet"}
                </Text>

                <Text style={{ fontSize: 12, color: "#0066cc", fontWeight: "700", marginBottom: 4 }}>
                  SPROG
                </Text>
                <Text style={{ fontSize: 14, color: cv.languages ? "#333" : "#999", marginBottom: 12 }}>
                  {cv.languages ? toLabel(cv.languages) : "Ikke angivet"}
                </Text>
              </View>
            </View>
          </View>

          {/* Profiltekst nedenunder */}
          {cv.text && (
            <View style={{ backgroundColor: "#fff", marginHorizontal: 16, marginTop: 8, borderRadius: 12, padding: 20, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#0066cc", marginBottom: 8 }}>
                PROFIL
              </Text>
              <Text style={{ fontSize: 15, color: "#333", lineHeight: 22 }}>
                {cv.text}
              </Text>
            </View>
          )}
        </ScrollView>
    </View>
  );
}
