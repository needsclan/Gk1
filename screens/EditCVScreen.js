import React, { useLayoutEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GlobalStyles from "../style/GlobalStyle";
import { auth } from "../database/database";
import { useUserCv } from "../components/useUserCv";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

const EDU_LEVELS = ["", "Folkeskole", "Gymnasial", "Erhvervsuddannelse", "Bachelor", "Kandidat", "PhD"];
const AVAIL = ["", "Fuldtid", "Deltid", "Freelance/Kontrakt", "Studiejob", "Praktik"];

// helper til at vise array som tekst
const arrToInput = (v) => (Array.isArray(v) ? v.join(", ") : v || "");

// helper til at lave input tekst om til array
const inputToArr = (s) =>
  (s || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

export default function EditCVScreen({ navigation }) {
  // aktuelt bruger id
  const uid = auth.currentUser?.uid ?? null;
  const insets = useSafeAreaInsets();

  // hook som henter og gemmer cv data
  const {
    headline, setHeadline,
    text, setText,
    photoUri, setPhotoUri,
    city, setCity,
    educationLevel, setEducationLevel,
    age, setAge,
    yearsExp, setYearsExp,
    availability, setAvailability,
    skills, setSkills,
    languages, setLanguages,
    loading, saving, error, save,
  } = useUserCv(uid);

  // gemmer cv efter normalisering af felter
  const onSave = () => {
    const payload = {
      headline: (headline || "").trim(),
      text,
      photoUri,
      city,
      educationLevel,
      availability,
      age: age ? Number(age) : null,
      yearsExp: yearsExp ? Number(yearsExp) : null,
      skills: inputToArr(skills),
      languages: inputToArr(languages),
    };
    save(payload);
  };

  // sætter header titel og gem knap
  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Rediger CV",
      headerRight: () => (
        <TouchableOpacity
          onPress={onSave}
          disabled={saving || loading}
          accessibilityLabel="Gem CV"
          style={{ marginRight: 12, opacity: saving || loading ? 0.6 : 1 }}
        >
          <Text style={{ fontWeight: "700", color: "#0066cc" }}>{saving ? "Gemmer…" : "Gem"}</Text>
        </TouchableOpacity>
      ),
    });
  }, [
    navigation, saving, loading,
    headline, text, photoUri, city, educationLevel, availability, age, yearsExp, skills, languages
  ]);

  // viser simpel loader mens data hentes
  if (loading) return <Text style={{ padding: 16 }}>Henter…</Text>;

  // vælger billede via kamera eller bibliotek
  const chooseImage = () => {
    Alert.alert("Profilbillede", "Vælg hvordan du vil tilføje et billede", [
      { text: "Kamera", onPress: openCamera },
      { text: "Bibliotek", onPress: openGallery },
      { text: "Annuller", style: "cancel" },
    ]);
  };

  // åbner kamera og sætter valgt billede
  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Ingen adgang", "Giv kameratilladelse i indstillinger.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.8 });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  // åbner galleri og sætter valgt billede
  const openGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Ingen adgang", "Giv adgang til billedbiblioteket i indstillinger.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: false, quality: 0.8 });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  // hovedlayout med formular felter
  const keyboardOffset = Platform.OS === "ios"
    ? (insets.top || 0) + (insets.bottom || 0) + 60
    : (insets.bottom || 0) + 60;

  return (
    <KeyboardAvoidingView
      style={[GlobalStyles.container, { backgroundColor: "#f8f9fa" }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={keyboardOffset}
    >
      <ScrollView
        contentContainerStyle={GlobalStyles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* top med profilbillede og overskrift */}
        <View style={{ alignItems: "center", marginBottom: 12 }}>
          <TouchableOpacity onPress={chooseImage} accessibilityLabel="Vælg profilbillede">
            {photoUri ? (
              <Image
                source={{ uri: photoUri }}
                style={{ width: 140, height: 140, borderRadius: 8, marginBottom: 8 }}
              />
            ) : (
              <View
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: 8,
                  marginBottom: 8,
                  backgroundColor: "#f0f6ff",
                  borderWidth: 1,
                  borderColor: "#cfe0ff",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="camera-outline" size={40} color="#0066cc" />
              </View>
            )}
          </TouchableOpacity>

          <TextInput
            placeholder="Headline fx Frontend udvikler eller Dataanalytiker"
            placeholderTextColor="#999"
            style={[GlobalStyles.input, { width: "100%", borderColor: "#e0e7ff" }]}
            value={headline}
            onChangeText={setHeadline}
            autoCapitalize="sentences"
            maxLength={120}
          />
        </View>

        {/* profil tekst */}
        <Text style={{ fontWeight: "700", marginBottom: 6, color: "#0066cc" }}>Profil</Text>
        <TextInput
          placeholder="Kort profil eller summary"
          placeholderTextColor="#999"
          style={[GlobalStyles.input, { height: 160, textAlignVertical: "top", borderColor: "#e0e7ff" }]}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={1500}
        />

        {/* by valg */}
        <Text style={{ fontWeight: "700", marginTop: 12, color: "#0066cc" }}>By</Text>
        <TextInput
          placeholder="Skriv din by (fx Aarhus eller København)"
          placeholderTextColor="#999"
          style={[GlobalStyles.input, { borderColor: "#e0e7ff" }]}
          value={city}
          onChangeText={setCity}
          autoCapitalize="words"
        />

        {/* uddannelsesniveau valg */}
        <Text style={{ fontWeight: "700", marginTop: 12, color: "#0066cc" }}>Uddannelsesniveau</Text>
        <View style={[GlobalStyles.input, { padding: 0, borderColor: "#e0e7ff" }]}>
          <Picker selectedValue={educationLevel} onValueChange={setEducationLevel}>
            {EDU_LEVELS.map((e) => (
              <Picker.Item key={e || "empty"} label={e || "Vælg…"} value={e} />
            ))}
          </Picker>
        </View>

        {/* alder og erfaring i år */}
        <Text style={{ fontWeight: "700", marginTop: 12, color: "#0066cc" }}>Alder og erfaring</Text>
        <TextInput
          placeholder="Alder i år"
          keyboardType="number-pad"
          style={[GlobalStyles.input, { borderColor: "#e0e7ff" }]}
          value={age}
          onChangeText={setAge}
          maxLength={3}
        />
        <TextInput
          placeholder="Erfaringsår for eksempel 3"
          keyboardType="number-pad"
          style={[GlobalStyles.input, { borderColor: "#e0e7ff" }]}
          value={yearsExp}
          onChangeText={setYearsExp}
          maxLength={2}
        />

        {/* tilgængelighed valg */}
        <Text style={{ fontWeight: "700", marginTop: 12, color: "#0066cc" }}>Tilgængelighed</Text>
        <View style={[GlobalStyles.input, { padding: 0, borderColor: "#e0e7ff" }]}>
          <Picker selectedValue={availability} onValueChange={setAvailability}>
            {AVAIL.map((a) => (
              <Picker.Item key={a || "empty"} label={a || "Vælg…"} value={a} />
            ))}
          </Picker>
        </View>

        {/* skills og sprog som kommasepareret tekst */}
        <Text style={{ fontWeight: "700", marginTop: 12, color: "#0066cc" }}>Skills og sprog</Text>
        <TextInput
          placeholder="Skills kommasepareret for eksempel JavaScript, React, Firebase"
          style={[GlobalStyles.input, { borderColor: "#e0e7ff" }]}
          value={arrToInput(skills)}
          onChangeText={setSkills}
          autoCapitalize="none"
        />
        <TextInput
          placeholder="Sprog kommasepareret for eksempel Dansk, Engelsk"
          style={[GlobalStyles.input, { borderColor: "#e0e7ff" }]}
          value={arrToInput(languages)}
          onChangeText={setLanguages}
        />

        {/* fejlmeddelelse fra hook vises her */}
        {!!error && <Text style={{ color: "red", marginTop: 8 }}>{error}</Text>}

        {/* ekstra bundplads da gem knappen ligger i header */}
        <View style={{ height: 24 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
