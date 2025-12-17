import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ImageBackground,
  useWindowDimensions,
  Pressable,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Switch,
  ActivityIndicator,
  PanResponder,
  Animated,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import GlobalStyles from "../style/GlobalStyle";
import { ref, get, child, set } from "firebase/database";
import { rtdb, auth } from "../database/database";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";

// helper: konverterer forskellige datatyper til læsbar tekst
const toLabel = (v) => {
  if (v == null) return "";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "object") return Object.values(v).map(String).join(", ");
  return String(v);
};

export default function SwipeCVScreen() {
  // state til alle CV'er hentet fra Firebase
  const [cvs, setCvs] = useState([]);
  // state til filtrerede CV'er baseret på søgekriterier
  const [visibleCvs, setVisibleCvs] = useState([]);
  // styrer om filter-modal er åben
  const [modalVisible, setModalVisible] = useState(false);
  // søgekriterier som brugeren indtaster
  const [criteria, setCriteria] = useState({
    skills: "",
    languages: "",
    minAge: "",
    maxAge: "",
    city: "",
    useMyLocation: false,
    maxDistanceKm: "",
  });
  // brugerens GPS koordinater hvis aktiveret
  const [userLocation, setUserLocation] = useState(null);
  // cache til at gemme by-koordinater for at undgå gentagne API-kald
  const [geocodeCache, setGeocodeCache] = useState({});
  // viser loading spinner mens geodata hentes
  const [geoLoading, setGeoLoading] = useState(false);
  // den målposition (bruger eller by) vi filtrerer afstand fra
  const [filterTarget, setFilterTarget] = useState(null);
  // det CV som lige nu vises på skærmen
  const [currentCv, setCurrentCv] = useState(null);
  // viser "tilføjet til kontakter" besked i 2 sekunder
  const [contactSaved, setContactSaved] = useState(false);
  // reference til det nuværende synlige CV (bruges til swipe-down)
  const currentItemRef = useRef(null);
  // animated værdi til swipe-ned gestus
  const translateY = useRef(new Animated.Value(0)).current;
  // reference til FlatList for at kunne scrolle programmatisk
  const flatListRef = useRef(null);

  // højde på bottom tab bar (bruges til at positionere infoboks)
  const tabBarHeight = useBottomTabBarHeight();
  // skærmens bredde og højde
  const { width, height } = useWindowDimensions();
  // navigation hook til at skifte mellem skærme
  const navigation = useNavigation();

  // henter alle CV'er fra Firebase når komponenten loader
  useEffect(() => {
    const loadCVs = async () => {
      try {
        // hent /cvs node fra Firebase Realtime Database
        const snapshot = await get(child(ref(rtdb), "cvs"));
        if (!snapshot.exists()) return setCvs([]);

        const data = snapshot.val();
        const me = auth.currentUser?.uid;

        // filtrer eget CV ud, så man ikke ser sig selv
        const others = Object.entries(data)
          .filter(([uid]) => uid !== me)
          .map(([uid, val]) => ({ uid, ...val }));

        // sæt både alle CVer og synlige CVer til at starte
        setCvs(others);
        setVisibleCvs(others);
      } catch (error) {
        console.error("Fejl:", error.message);
      }
    };

    loadCVs();
  }, []);

  // beregner afstand i km mellem to GPS-koordinater ved hjælp af Haversine-formlen
  // denne formel tager højde for jordens krumning
  const haversineKm = (lat1, lon1, lat2, lon2) => {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371; // jordens radius i km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // konverterer bynavn til GPS-koordinater via OpenStreetMap Nominatim API
  // kun danske byer (countrycodes=dk)
  const geocode = async (query) => {
    if (!query) return null;
    const key = query.toLowerCase();
    // tjek cache først for at undgå unødvendige API-kald
    if (geocodeCache[key]) return geocodeCache[key];
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query,
      )}&limit=1&countrycodes=dk`;
      const res = await fetch(url, { headers: { "User-Agent": "Gk1App/1.0" } });
      const arr = await res.json();
      if (arr && arr.length > 0) {
        const { lat, lon } = arr[0];
        const coords = { latitude: Number(lat), longitude: Number(lon) };
        // gem i cache til næste gang
        setGeocodeCache((prev) => ({ ...prev, [key]: coords }));
        return coords;
      }
    } catch (err) {
      console.warn("Geocode fejl", err?.message || err);
    }
    return null;
  };

  // henter brugerens nuværende GPS-position via expo-location
  const getUserLocation = async () => {
    try {
      let Location;
      try {
        // dynamisk require fordi expo-location måske ikke er installeret
        Location = require("expo-location");
      } catch (e) {
        console.warn("expo-location ikke installeret; kan ikke hente enhedens position");
        return null;
      }
      // bed om tilladelse til at bruge location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return null;
      // hent højeste præcision position
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setUserLocation(coords);
      return coords;
    } catch (err) {
      console.warn("Location fejl", err?.message || err);
      return null;
    }
  };

  // anvender alle filtre når søgekriterier ændres
  // kører igen hver gang cvs, criteria, userLocation eller geocodeCache ændres
  useEffect(() => {
    const apply = async () => {
      if (!cvs) return setVisibleCvs([]);
      setGeoLoading(true);

      const skillList = (criteria.skills || "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      const languageList = (criteria.languages || "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      const base = cvs.filter((it) => {
        if (skillList.length) {
          const itemSkills = Array.isArray(it.skills)
            ? it.skills.map((s) => String(s).toLowerCase())
            : it.skills
            ? [String(it.skills).toLowerCase()]
            : [];
          const hasAll = skillList.every((s) => itemSkills.some((is) => is.includes(s)));
          if (!hasAll) return false;
        }
        if (languageList.length) {
          const itemLanguages = Array.isArray(it.languages)
            ? it.languages.map((s) => String(s).toLowerCase())
            : it.languages
            ? [String(it.languages).toLowerCase()]
            : [];
          const hasAll = languageList.every((s) => itemLanguages.some((is) => is.includes(s)));
          if (!hasAll) return false;
        }
        const age = it.age != null ? Number(it.age) : null;
        if (criteria.minAge) {
          const min = Number(criteria.minAge);
          if (isFinite(min) && (age == null || age < min)) return false;
        }
        if (criteria.maxAge) {
          const max = Number(criteria.maxAge);
          if (isFinite(max) && (age == null || age > max)) return false;
        }
        if (criteria.city) {
          const needle = criteria.city.toLowerCase();
          const hay = (it.city || it.region || "").toLowerCase();
          if (!hay.includes(needle)) return false;
        }
        return true;
      });

      const wantsDistance = criteria.maxDistanceKm && (criteria.useMyLocation || criteria.city);
      if (!wantsDistance) {
        setVisibleCvs(base);
        setFilterTarget(null);
        setGeoLoading(false);
        return;
      }

      let target = null;
      if (criteria.useMyLocation) {
        target = userLocation || (await getUserLocation());
      } else if (criteria.city) {
        target = await geocode(criteria.city.trim());
      }

      if (!target) {
        setVisibleCvs([]);
        setFilterTarget(null);
        setGeoLoading(false);
        return;
      }

      const maxKm = Number(criteria.maxDistanceKm) || 0;
      const filtered = base.filter((it) => {
        const lat = Number(it.cityLat);
        const lon = Number(it.cityLon);
        if (!isFinite(lat) || !isFinite(lon)) return false;
        const d = haversineKm(target.latitude, target.longitude, lat, lon);
        return d <= maxKm;
      });

      setVisibleCvs(filtered);
      setFilterTarget(target);
      setGeoLoading(false);
    };

    apply();
  }, [cvs, criteria, userLocation, geocodeCache]);

  // gemmer kontakt til Firebase når bruger swiper ned
  // opretter chat metadata for begge brugere uden at sende en besked
  const saveContact = useCallback(
    async (cv) => {
      const me = auth.currentUser?.uid;
      if (!me || !cv) return;
      const otherUid = cv.uid || cv.ownerUid;
      if (!otherUid || otherUid === me) return;

      // chat ID er begge bruger-IDs sorteret og sammensat med underscore
      const chatId = [me, otherUid].sort().join("_");
      const username = cv.headline || cv.username || otherUid;
      // metadata for min chat-liste
      const metaMe = {
        otherUid,
        otherUsername: username,
        lastMessage: "",
        updatedAt: Date.now(),
      };
      // metadata for den andens chat-liste
      const metaOther = {
        otherUid: me,
        otherUsername: auth.currentUser?.email || me,
        lastMessage: "",
        updatedAt: Date.now(),
      };

      try {
        // gem begge metadata samtidigt
        await Promise.all([
          set(ref(rtdb, `userChats/${me}/${chatId}`), metaMe),
          set(ref(rtdb, `userChats/${otherUid}/${chatId}`), metaOther),
        ]);
        // vis bekræftelse i 2 sekunder
        setContactSaved(true);
        setTimeout(() => setContactSaved(false), 2000);
      } catch (err) {
        console.warn("Kontakt gem fejlede", err?.message || err);
      }
    },
    []
  );

  // holder styr på hvilket CV der er synligt på skærmen
  // bruges når bruger swiper ned for at vide hvilket CV der skal gemmes
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 70 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems?.length) {
      const first = viewableItems[0]?.item;
      currentItemRef.current = first || null;
      setCurrentCv(first || null);
    }
  }).current;

  // håndterer swipe-ned gestus for at gemme kontakt
  // aktiveres kun ved vertikal swipe (ikke horisontal)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      // kun fang gestus hvis det er primært vertikal bevægelse
      onMoveShouldSetPanResponder: (_, g) => {
        const vy = Math.abs(g.dy);
        const vx = Math.abs(g.dx);
        return vy > 15 && vy > vx * 1.5;
      },
      // følg fingerens bevægelse nedad
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) {
          translateY.setValue(g.dy);
        }
      },
      onPanResponderTerminationRequest: () => true,
      // når finger slippes: gem kontakt hvis swipe > 60px, ellers spring tilbage
      onPanResponderRelease: (_, g) => {
        if (g.dy > 60) {
          saveContact(currentItemRef.current);
        }
        // animér tilbage til start position
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          speed: 20,
          bounciness: 8,
        }).start();
      },
    })
  ).current;

  // ingen data
  if (cvs.length === 0) {
    return (
      <View style={[GlobalStyles.container, { backgroundColor: "#f8f9fa" }]}>
        <Text style={GlobalStyles.title}>Ingen CV'er fundet</Text>
      </View>
    );
  }

  // hvid informationsboks der vises nederst på hvert CV-kort
  // viser headline, by, alder, erfaring, uddannelse, tilgængelighed, skills og sprog
  const InfoBlock = ({ item }) => (
    <View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: tabBarHeight + 16,
        paddingVertical: 20,
        paddingHorizontal: 20,
        backgroundColor: "#fff",
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 4,
      }}
    >
      <Text
        style={{
          fontSize: 18,
          fontWeight: "700",
          color: "#1a1a1a",
          marginBottom: 4,
        }}
        numberOfLines={1}
      >
        {item.headline ? item.headline : "Andres CV"}
      </Text>

      <Text style={{ fontSize: 13, color: "#666", marginBottom: 10 }} numberOfLines={1}>
        {item.jobTitle || "Professionel"}
      </Text>

      {/* To kolonner */}
      <View style={{ flexDirection: "row", gap: 12 }}>
        {/* Venstre kolonne */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: "#666", marginBottom: 4 }} numberOfLines={1}>
            📍 {item.city || item.region || "Ikke angivet"}
          </Text>
          <Text style={{ fontSize: 12, color: "#666", marginBottom: 4 }} numberOfLines={1}>
            👤 {item.age ? `${item.age} år` : "Ikke angivet"}
          </Text>
          <Text style={{ fontSize: 12, color: "#666", marginBottom: 4 }} numberOfLines={1}>
            💼 {item.yearsExp ? `${item.yearsExp} år` : "Ingen erfaring"}
          </Text>
          <Text style={{ fontSize: 12, color: "#666", marginBottom: 4 }} numberOfLines={1}>
            🎓 {item.educationLevel || "Ikke angivet"}
          </Text>
        </View>

        {/* Højre kolonne */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: "#666", marginBottom: 4 }} numberOfLines={1}>
            🕓 {item.availability || "Ikke angivet"}
          </Text>
          <Text style={{ fontSize: 10, color: "#0066cc", fontWeight: "600", marginTop: 2 }}>
            SKILLS
          </Text>
          <Text style={{ fontSize: 12, color: item.skills ? "#333" : "#999", marginBottom: 4 }} numberOfLines={1}>
            {item.skills ? toLabel(item.skills) : "Ikke angivet"}
          </Text>
          <Text style={{ fontSize: 10, color: "#0066cc", fontWeight: "600", marginTop: 2 }}>
            SPROG
          </Text>
          <Text style={{ fontSize: 12, color: item.languages ? "#333" : "#999" }} numberOfLines={1}>
            {item.languages ? toLabel(item.languages) : "Ikke angivet"}
          </Text>
        </View>
      </View>

      {filterTarget && item.cityLat && item.cityLon ? (
        (() => {
          const lat = Number(item.cityLat);
          const lon = Number(item.cityLon);
          if (isFinite(lat) && isFinite(lon)) {
            const d = haversineKm(filterTarget.latitude, filterTarget.longitude, lat, lon);
            return (
              <Text style={{ fontSize: 10, color: "#999", marginTop: 4 }}>
                📏 ca. {Math.round(d)} km væk
              </Text>
            );
          }
          return null;
        })()
      ) : null}
    </View>
  );

  // hovedvisning: horisontal FlatList med fullscreen CV-kort
  // floating action button (tragt-ikon) til at åbne filter-modal
  return (
    <View style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: "#0066cc" }]}
        onPress={() => setModalVisible(true)}
        accessibilityLabel="Åbn søgekriterier"
      >
        <Ionicons name="funnel" size={22} color="#fff" />
      </TouchableOpacity>

      {geoLoading ? (
        <View
          style={{
            position: "absolute",
            top: 60,
            right: 12,
            backgroundColor: "#fff",
            padding: 12,
            borderRadius: 10,
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
            zIndex: 5,
          }}
        >
          <ActivityIndicator color="#0066cc" />
        </View>
      ) : null}

      {contactSaved ? (
        <View
          style={{
            position: "absolute",
            top: Platform.OS === "ios" ? 80 : 60,
            alignSelf: "center",
            backgroundColor: "#0066cc",
            paddingVertical: 12,
            paddingHorizontal: 20,
            borderRadius: 20,
            zIndex: 10,
            shadowColor: "#000",
            shadowOpacity: 0.2,
            shadowRadius: 6,
            elevation: 4,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>
            ✓ Tilføjet til kontakter
          </Text>
        </View>
      ) : null}

      <FlatList
        ref={flatListRef}
        data={visibleCvs}
        keyExtractor={(item) => item.uid}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item }) => {
          const hasValidPhoto =
            item.photoUrl &&
            typeof item.photoUrl === "string" &&
            item.photoUrl.startsWith("http");

          return (
            <Animated.View
              style={{
                width,
                height,
                transform: [{ translateY }],
              }}
              {...panResponder.panHandlers}
            >
              <Pressable
                style={{ width, height, flexDirection: "column" }}
                onPress={() => navigation.navigate("CVDetail", { cv: item })}
              >
                {hasValidPhoto ? (
                <View style={{ flex: 1 }}>
                  <ImageBackground
                    source={{ uri: item.photoUrl }}
                    style={{ flex: 0.70 }}
                    resizeMode="cover"
                  />
                  <View style={{ flex: 0.30, backgroundColor: "#f8f9fa" }}>
                    <InfoBlock item={item} />
                  </View>
                </View>
              ) : (
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flex: 0.70,
                      backgroundColor: "#e8f0fe",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Image
                      source={require('../assets/image.png')}
                      style={{
                        width: 120,
                        height: 120,
                        borderRadius: 60,
                        borderWidth: 3,
                        borderColor: "#0066cc",
                      }}
                      resizeMode="cover"
                    />
                    <Text style={{ 
                      fontSize: 14, 
                      color: "#0066cc", 
                      marginTop: 16, 
                      fontWeight: "600" 
                    }}>
                      Intet profilbillede
                    </Text>
                  </View>
                  <View style={{ flex: 0.30, backgroundColor: "#f8f9fa" }}>
                    <InfoBlock item={item} />
                  </View>
                </View>
              )}
              </Pressable>
            </Animated.View>
          );
        }}
      />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Text style={{ fontWeight: "700", fontSize: 18, color: "#1a1a1a" }}>
                Søg efter kriterier
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#999" />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Skills (komma-separeret)"
              value={criteria.skills}
              onChangeText={(t) => setCriteria((c) => ({ ...c, skills: t }))}
              style={styles.input}
              placeholderTextColor="#999"
            />

            <TextInput
              placeholder="Sprog (komma-separeret)"
              value={criteria.languages}
              onChangeText={(t) => setCriteria((c) => ({ ...c, languages: t }))}
              style={styles.input}
              placeholderTextColor="#999"
            />

            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput
                placeholder="Min alder"
                value={criteria.minAge}
                onChangeText={(t) => setCriteria((c) => ({ ...c, minAge: t }))}
                style={[styles.input, { flex: 1 }]}
                keyboardType="number-pad"
                placeholderTextColor="#999"
              />
              <TextInput
                placeholder="Max alder"
                value={criteria.maxAge}
                onChangeText={(t) => setCriteria((c) => ({ ...c, maxAge: t }))}
                style={[styles.input, { flex: 1 }]}
                keyboardType="number-pad"
                placeholderTextColor="#999"
              />
            </View>

            <TextInput
              placeholder="By"
              value={criteria.city}
              onChangeText={(t) => setCriteria((c) => ({ ...c, city: t }))}
              style={styles.input}
              placeholderTextColor="#999"
            />

            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12, padding: 12, backgroundColor: "#f8f9fa", borderRadius: 8 }}>
              <Text style={{ flex: 1, color: "#1a1a1a", fontWeight: "500" }}>Brug min position</Text>
              <Switch
                value={!!criteria.useMyLocation}
                onValueChange={(v) => setCriteria((c) => ({ ...c, useMyLocation: v }))}
                trackColor={{ false: "#ddd", true: "#0066cc" }}
              />
            </View>

            <TextInput
              placeholder="Maks afstand (km)"
              value={criteria.maxDistanceKm}
              onChangeText={(t) => setCriteria((c) => ({ ...c, maxDistanceKm: t }))}
              style={styles.input}
              keyboardType="numeric"
              placeholderTextColor="#999"
            />

            <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
              <TouchableOpacity
                onPress={() =>
                  setCriteria({
                    skills: "",
                    languages: "",
                    minAge: "",
                    maxAge: "",
                    city: "",
                    useMyLocation: false,
                    maxDistanceKm: "",
                  })
                }
                style={[styles.button, { backgroundColor: "#f0f2f5", flex: 1 }]}
              >
                <Text style={{ color: "#1a1a1a", fontWeight: "600" }}>Ryd</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.button, { backgroundColor: "#e8e8e8", flex: 1 }]}
              >
                <Text style={{ color: "#666", fontWeight: "600" }}>Annuller</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.button, { backgroundColor: "#0066cc", flex: 1 }]}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>Anvend</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    top: Platform.OS === "ios" ? 44 : 16,
    right: 12,
    zIndex: 10,
    backgroundColor: "#0066cc",
    padding: 12,
    borderRadius: 28,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
    padding: 0,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    color: "#000",
    backgroundColor: "#fafafa",
    fontSize: 14,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
