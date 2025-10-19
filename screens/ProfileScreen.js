import React, { useLayoutEffect, useState, useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, Modal } from "react-native";
import { auth } from "../database/database";
import {
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signOut,
} from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";

// simpel knap komponent
const Btn = ({ title, onPress, disabled }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={{
      padding: 14,
      borderRadius: 12,
      marginVertical: 8,
      backgroundColor: "#eee",
      opacity: disabled ? 0.6 : 1,
    }}
  >
    <Text style={{ textAlign: "center", fontWeight: "600" }}>{title}</Text>
  </TouchableOpacity>
);

// simpel e mail validering
const isEmail = (s) => /\S+@\S+\.\S+/.test(String(s || "").trim());

export default function ProfileScreen({ navigation }) {
  // nuværende bruger
  const user = auth.currentUser;

  // lokal state for formular
  const [newEmail, setNewEmail] = useState(user?.email ?? "");
  const [newPass, setNewPass] = useState("");

  // modal state til password prompt
  const [pwVisible, setPwVisible] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pendingAction, setPendingAction] = useState(null); // email eller password

  // tilstand for om handlinger giver mening
  const canChangeEmail = useMemo(() => {
    const trimmed = String(newEmail || "").trim();
    return user && trimmed && trimmed !== user.email && isEmail(trimmed);
  }, [newEmail, user]);

  const canChangePassword = useMemo(() => (newPass || "").length >= 6, [newPass]);

  // skraldespand i header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate("ConfirmDelete")} style={{ marginRight: 16 }}>
          <Ionicons name="trash-outline" size={24} color="red" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // reautentificering med nuværende password
  const reauth = async (password) => {
    if (!user?.email) throw new Error("Bruger ikke fundet");
    const cred = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, cred);
  };

  // åbner modal og markerer ønsket handling
  const askPasswordThen = (action) => {
    setPendingAction(action);
    setPwInput("");
    setPwVisible(true);
  };

  // udfører valgt handling efter password er indtastet
  const onConfirmPassword = async () => {
    try {
      setPwVisible(false);

      if (pendingAction === "email") {
        if (!canChangeEmail) {
          Alert.alert("Ugyldig e-mail", "Indtast en gyldig e-mail som er anderledes end den nuværende.");
          return;
        }
        await reauth(pwInput);
        await updateEmail(user, String(newEmail || "").trim());
        Alert.alert("Opdateret", "E-mail er ændret.");
      } else if (pendingAction === "password") {
        if (!canChangePassword) {
          Alert.alert("For kort", "Kodeord skal være mindst 6 tegn.");
          return;
        }
        await reauth(pwInput);
        await updatePassword(user, newPass);
        setNewPass("");
        Alert.alert("Opdateret", "Kodeord er ændret.");
      }
    } catch (e) {
      Alert.alert("Fejl", e?.message || "Noget gik galt");
    } finally {
      setPendingAction(null);
      setPwInput("");
    }
  };

  // ui med felter for e mail og kodeord
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 16, marginBottom: 8 }}>
        Logget ind som: {user?.email || "ukendt"}
      </Text>

      {/* skift e mail */}
      <Text style={{ fontWeight: "700", marginTop: 14 }}>Ny e-mail</Text>
      <TextInput
        value={newEmail}
        onChangeText={setNewEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="ny@adresse.dk"
        style={{ borderWidth: 1, borderRadius: 10, padding: 10, marginTop: 6 }}
      />
      <Btn
        title="Gem ny e-mail"
        onPress={() => askPasswordThen("email")}
        disabled={!canChangeEmail}
      />

      {/* skift kodeord */}
      <Text style={{ fontWeight: "700", marginTop: 14 }}>Nyt kodeord</Text>
      <TextInput
        value={newPass}
        onChangeText={setNewPass}
        placeholder="Nyt kodeord"
        secureTextEntry
        style={{ borderWidth: 1, borderRadius: 10, padding: 10, marginTop: 6 }}
      />
      <Btn
        title="Gem nyt kodeord"
        onPress={() => askPasswordThen("password")}
        disabled={!canChangePassword}
      />

      {/* log ud */}
      <View style={{ height: 12 }} />
      <Btn
        title="Log ud"
        onPress={async () => {
          try {
            await signOut(auth);
          } catch (e) {
            Alert.alert("Fejl", e?.message || "Kunne ikke logge ud");
          }
        }}
      />

      {/* modal for nuværende kodeord */}
      <Modal
        visible={pwVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPwVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              width: "100%",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 8 }}>
              Indtast dit nuværende kodeord
            </Text>
            <TextInput
              value={pwInput}
              onChangeText={setPwInput}
              secureTextEntry
              placeholder="Nuværende kodeord"
              style={{ borderWidth: 1, borderRadius: 10, padding: 10, marginTop: 6 }}
            />
            <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 12 }}>
              <TouchableOpacity onPress={() => setPwVisible(false)} style={{ marginRight: 16 }}>
                <Text style={{ fontWeight: "600" }}>Annuller</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onConfirmPassword}>
                <Text style={{ fontWeight: "700" }}>Bekræft</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
