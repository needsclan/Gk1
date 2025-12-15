// screens/CVDetailScreen.js
import { View, Text, Pressable, ScrollView, useWindowDimensions, Image } from "react-native";
import { useRoute, useNavigation, CommonActions } from "@react-navigation/native";
import { useEffect } from "react";
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
    <Pressable style={{ flex: 1, backgroundColor: "#000" }} onPress={handleGoBack}>
      <View style={{ flex: 1, padding: 24 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Øverste sektion: Headline med billede til højre */}
          <View style={{ flexDirection: "row", marginBottom: 20, alignItems: "flex-start", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 24, fontWeight: "800", color: "#fff" }}>
                {cv.headline || "CV"}
              </Text>
            </View>
            {cv.photoUrl && (
              <Image
                source={{ uri: cv.photoUrl }}
                style={{ width: 70, height: 70, borderRadius: 35 }}
              />
            )}
          </View>

          {/* Oplysninger liste */}
          {/* By */}
          {cv.city ? (
            <Text style={{ fontSize: 15, color: "#fff", marginBottom: 8 }}>
              📍 {cv.city}
            </Text>
          ) : cv.region ? (
            <Text style={{ fontSize: 15, color: "#fff", marginBottom: 8 }}>
              📍 {cv.region}
            </Text>
          ) : null}

          {/* Uddannelse */}
          {cv.educationLevel && (
            <Text style={{ fontSize: 15, color: "#fff", marginBottom: 8 }}>
              🎓 {cv.educationLevel}
            </Text>
          )}

          {/* Alder */}
          {cv.age && (
            <Text style={{ fontSize: 15, color: "#fff", marginBottom: 8 }}>
              👤 {cv.age} år
            </Text>
          )}

          {/* Erfaring */}
          {cv.yearsExp && (
            <Text style={{ fontSize: 15, color: "#fff", marginBottom: 8 }}>
              💼 {cv.yearsExp} års erfaring
            </Text>
          )}

          {/* Tilgængelighed */}
          {cv.availability && (
            <Text style={{ fontSize: 15, color: "#fff", marginBottom: 8 }}>
              🕓 {cv.availability}
            </Text>
          )}

          {/* Skills */}
          {cv.skills && (
            <Text style={{ fontSize: 15, color: "#fff", marginBottom: 8 }}>
              🧠 {toLabel(cv.skills)}
            </Text>
          )}

          {/* Sprog */}
          {cv.languages && (
            <Text style={{ fontSize: 15, color: "#fff", marginBottom: 20 }}>
              🌍 {toLabel(cv.languages)}
            </Text>
          )}

          {/* Profiltekst nedenunder */}
          {cv.text && (
            <>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#aaa", marginBottom: 8 }}>
                Profil
              </Text>
              <Text style={{ fontSize: 15, color: "#fff", lineHeight: 22 }}>
                {cv.text}
              </Text>
            </>
          )}
        </ScrollView>
      </View>
    </Pressable>
  );
}
