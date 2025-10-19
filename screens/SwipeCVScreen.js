import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ImageBackground, useWindowDimensions, Pressable } from "react-native";
import GlobalStyles from "../style/GlobalStyle";
import { ref, get, child } from "firebase/database";
import { rtdb, auth } from "../database/database";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";

// helper der laver værdi om til læsbar label
const toLabel = (v) => {
  if (v == null) return "";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "object") return Object.values(v).map(String).join(", ");
  return String(v);
};

// helper der formaterer tal som danske tusindtals
const formatDKK = (n) =>
  typeof n === "number"
    ? n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    : String(n);

export default function SwipeCVScreen() {
  // liste over andres cv er
  const [cvs, setCvs] = useState([]);

  // højde på tabbar til placering af infoblok
  const tabBarHeight = useBottomTabBarHeight();

  // skærmstørrelse til pager layout
  const { width, height } = useWindowDimensions();

  // navigation til detaljeskærm
  const navigation = useNavigation();

  // henter cv er en gang ved mount
  useEffect(() => {
    const loadCVs = async () => {
      try {
        const snapshot = await get(child(ref(rtdb), "cvs"));
        if (snapshot.exists()) {
          const data = snapshot.val();
          const me = auth.currentUser?.uid;

          // filtrerer eget cv væk og laver array til flatlist
          const others = Object.entries(data)
            .filter(([uid]) => uid !== me)
            .map(([uid, val]) => ({ uid, ...val }));

          setCvs(others);
        } else {
          setCvs([]);
        }
      } catch (error) {
        console.error("Fejl:", error.message);
      }
    };
    loadCVs();
  }, []);

  // tomtilstand hvis der ikke er data
  if (cvs.length === 0) {
    return (
      <View style={[GlobalStyles.container, { backgroundColor: "black" }]}>
        <Text style={GlobalStyles.title}>Ingen CV'er fundet</Text>
      </View>
    );
  }

  // infoblok som ligger ovenpå billedet nederst
  const InfoBlock = ({ item }) => (
    <View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: tabBarHeight + 16,
        padding: 20,
        backgroundColor: "rgba(0,0,0,0.35)",
      }}
    >
      <Text
        style={{
          fontSize: 22,
          fontWeight: "700",
          color: "#fff",
          marginBottom: 8,
        }}
      >
        {item.headline ? item.headline : "Andres CV"}
      </Text>

      {item.region ? (
        <Text style={{ fontSize: 16, color: "#fff" }}>📍 {item.region}</Text>
      ) : null}

      {item.educationLevel ? (
        <Text style={{ fontSize: 16, color: "#fff" }}>🎓 {item.educationLevel}</Text>
      ) : null}

      {item.age ? (
        <Text style={{ fontSize: 16, color: "#fff" }}>👤 {item.age} år</Text>
      ) : null}

      {item.yearsExp ? (
        <Text style={{ fontSize: 16, color: "#fff" }}>💼 {item.yearsExp} års erfaring</Text>
      ) : null}

      {item.availability ? (
        <Text style={{ fontSize: 16, color: "#fff" }}>🕓 {item.availability}</Text>
      ) : null}

      {item.skills ? (
        <Text style={{ fontSize: 16, color: "#fff" }}>🧠 {toLabel(item.skills)}</Text>
      ) : null}

      {item.languages ? (
        <Text style={{ fontSize: 16, color: "#fff" }}>🌍 {toLabel(item.languages)}</Text>
      ) : null}
    </View>
  );

  // hovedlayout med vandret pager af cv kort
  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <FlatList
        data={cvs}
        keyExtractor={(item) => item.uid}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          // hele kortet er klikbart og åbner detalje
          <Pressable
            style={{ width, height }}
            onPress={() => navigation.navigate("CVDetail", { cv: item })}
          >
            {item.photoUrl ? (
              <ImageBackground source={{ uri: item.photoUrl }} style={{ width, height }} resizeMode="cover">
                <InfoBlock item={item} />
              </ImageBackground>
            ) : (
              <View
                style={{
                  width,
                  height,
                  backgroundColor: "#111",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 20,
                }}
              >
                <Text style={{ color: "#aaa", marginBottom: 12 }}>Ingen billede</Text>
                <InfoBlock item={item} />
              </View>
            )}
          </Pressable>
        )}
      />
    </View>
  );
}
