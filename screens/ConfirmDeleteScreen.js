import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { auth, rtdb, storage } from "../database/database";
import { EmailAuthProvider, reauthenticateWithCredential, deleteUser, signOut } from "firebase/auth";
import { ref as dbref, remove } from "firebase/database";
import { ref as sref, listAll, deleteObject } from "firebase/storage";

export default function ConfirmDeleteScreen({ navigation }) {
  const user = auth.currentUser;
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  const deleteAllStorageUnder = async (path) => {
    const folderRef = sref(storage, path);
    const listing = await listAll(folderRef);
    await Promise.all(listing.items.map(deleteObject));
    await Promise.all(listing.prefixes.map(p => deleteAllStorageUnder(p.fullPath)));
  };

  const onDelete = async () => {
    try {
      if (!user?.email) return Alert.alert("Fejl", "Ingen bruger");
      if (!pw) return Alert.alert("Manglende kodeord", "Indtast dit nuværende kodeord");

      setBusy(true);

      // 1) Re-auth (krævet for sletning)
      const cred = EmailAuthProvider.credential(user.email, pw);
      await reauthenticateWithCredential(user, cred);

      const uid = user.uid;

      // 2) Slet data (RTDB + Storage)
      await remove(dbref(rtdb, `cvs/${uid}`));
      await remove(dbref(rtdb, `userChats/${uid}`));
      // (valgfrit) ryd andre noder du bruger
      // Storage: slet uploads/photos-mapper
      await deleteAllStorageUnder(`uploads/${uid}`);
      await deleteAllStorageUnder(`photos/${uid}`);

      // 3) Slet selve auth-brugeren
      await deleteUser(user);

      // 4) Log ud / tilbage til login
      try { await signOut(auth); } catch {}
      Alert.alert("Konto slettet", "Din profil og data er fjernet.");
    } catch (e) {
      // typisk: auth/requires-recent-login eller auth/wrong-password
      Alert.alert("Kunne ikke slette", e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>Slet profil?</Text>
      <Text>Dette sletter din konto og tilhørende data permanent.</Text>

      <TextInput
        value={pw}
        onChangeText={setPw}
        secureTextEntry
        placeholder="Nuværende kodeord"
        style={{ borderWidth: 1, borderRadius: 10, padding: 10, marginTop: 16 }}
      />

      <TouchableOpacity
        onPress={onDelete}
        disabled={busy}
        style={{ backgroundColor: "#ffdddd", padding: 14, borderRadius: 12, marginTop: 12, opacity: busy ? 0.6 : 1 }}
      >
        <Text style={{ textAlign: "center", fontWeight: "700" }}>
          {busy ? "Sletter…" : "Ja, slet min profil"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 14, marginTop: 8 }}>
        <Text style={{ textAlign: "center" }}>Annuller</Text>
      </TouchableOpacity>
    </View>
  );
}

