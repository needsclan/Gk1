// screens/ChatScreen.js
import React, { useEffect, useState, useCallback, useLayoutEffect, useRef } from "react";
import {
  View, FlatList, TextInput, TouchableOpacity, Text,
  KeyboardAvoidingView, Platform, ImageBackground
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ref, onChildAdded, push, set, get, update, serverTimestamp } from "firebase/database";
import { rtdb, auth } from "../database/database";
import { useRoute, useNavigation } from "@react-navigation/native";

// henter visningsnavn for en given bruger fra Firebase
// prøver først /users/{uid}/username, derefter /cvs/{uid}/headline
const getUsername = async (uid) => {
  if (!uid) return null;
  const u = await get(ref(rtdb, `users/${uid}/username`));
  if (u.exists()) return u.val();
  const h = await get(ref(rtdb, `cvs/${uid}/headline`));
  if (h.exists()) return h.val();
  return uid;
};

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { params } = useRoute();
  const navigation = useNavigation();

  // chatId er sammensat af begge bruger-IDs sorteret
  const chatId = params?.chatId;
  // den anden bruger vi chatter med
  const otherUid = params?.otherUid;
  // nuværende bruger
  const uid = auth.currentUser?.uid;

  // array af beskeder i denne chat
  const [msgs, setMsgs] = useState([]);
  // tekst brugeren skriver i input-feltet
  const [text, setText] = useState("");
  // mit visningsnavn
  const [myName, setMyName] = useState("");
  // den andens visningsnavn
  const [otherName, setOtherName] = useState("");
  // reference til FlatList for at kunne scrolle til bunden
  const flatListRef = useRef(null);

  // henter visningsnavne for begge brugere når komponenten loader
  useEffect(() => {
    (async () => {
      if (!uid || !otherUid) return;
      const [me, other] = await Promise.all([getUsername(uid), getUsername(otherUid)]);
      setMyName(me || "");
      setOtherName(other || "");
    })();
  }, [uid, otherUid]);

  // sætter header titel til den andens navn og tilføjer tilbage-knap
  // tilbage-knappen navigerer altid til ChatList (ikke bare tilbage)
  useLayoutEffect(() => {
    navigation.setOptions({
      title: otherName || "",
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate("Messages", { screen: "ChatList" })}
          style={{ paddingHorizontal: 8 }}
        >
          <Ionicons name="chevron-back" size={24} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, otherName]);

  // sætter realtime listener op til at lytte efter nye beskeder i denne chat
  // onChildAdded køres for alle eksisterende beskeder + hver ny besked der tilføjes
  useEffect(() => {
    if (!chatId) return;
    setMsgs([]);
    const msgsRef = ref(rtdb, `messages/${chatId}`);
    const unsub = onChildAdded(msgsRef, (snap) => {
      const m = snap.val();
      // undgå duplikater hvis beskeden allerede er i listen
      setMsgs((prev) => (prev.some(x => x.id === snap.key) ? prev : [...prev, { id: snap.key, ...m }]));
    });
    // cleanup: fjern listener når komponenten unmounter
    return () => unsub();
  }, [chatId]);

  // auto-scroll til bunden når nye beskeder kommer ind
  // lille delay (50ms) for at sikre rendering er færdig
  useEffect(() => {
    if (!flatListRef.current || msgs.length === 0) return;
    const t = setTimeout(() => flatListRef.current?.scrollToEnd?.({ animated: true }), 50);
    return () => clearTimeout(t);
  }, [msgs.length]);

  // sikrer at userChats metadata findes for begge brugere
  // hvis ikke, oprettes de så chatten vises i begge brugeres chat-lister
  useEffect(() => {
    const init = async () => {
      if (!uid || !otherUid || !chatId) return;
      const myRef = ref(rtdb, `userChats/${uid}/${chatId}`);
      const otherRef = ref(rtdb, `userChats/${otherUid}/${chatId}`);
      const [mySnap, otherSnap] = await Promise.all([get(myRef), get(otherRef)]);
      if (!mySnap.exists()) {
        await set(myRef, { otherUid, otherUsername: otherName || otherUid, lastMessage: "", updatedAt: serverTimestamp() });
      }
      if (!otherSnap.exists()) {
        await set(otherRef, { otherUid: uid, otherUsername: myName || uid, lastMessage: "", updatedAt: serverTimestamp() });
      }
    };
    init();
  }, [uid, otherUid, chatId, myName, otherName]);

  // sender en ny besked til Firebase
  // opdaterer både /messages/{chatId} og userChats metadata for begge brugere
  const send = useCallback(async () => {
    const t = text.trim();
    if (!t || !uid || !chatId) return;
    setText("");
    // opret ny besked i /messages/{chatId}
    const msgRef = push(ref(rtdb, `messages/${chatId}`));
    await set(msgRef, { text: t, senderId: uid, createdAt: serverTimestamp() });
    // opdater metadata i begge brugeres chat-lister med seneste besked
    const metaMe = { otherUid, otherUsername: otherName || otherUid, lastMessage: t, updatedAt: serverTimestamp() };
    const metaOther = { otherUid: uid, otherUsername: myName || uid, lastMessage: t, updatedAt: serverTimestamp() };
    await update(ref(rtdb, `userChats/${uid}/${chatId}`), metaMe);
    await update(ref(rtdb, `userChats/${otherUid}/${chatId}`), metaOther);
  }, [text, uid, otherUid, chatId, myName, otherName]);

  // UI rendering: SkillBridge logo baggrund, beskeder i FlatList, input felt nederst
  // KeyboardAvoidingView sørger for at tastaturet skubber indholdet op
  const keyboardOffset = Platform.OS === "ios"
    ? (insets.top || 0) + (insets.bottom || 0) + 40
    : (insets.bottom || 0) + 40;

  return (
    <ImageBackground
      source={require('../assets/image.png')}
      style={{ flex: 1 }}
      resizeMode="center"
      imageStyle={{ opacity: 0.15 }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={keyboardOffset}
      >
      <FlatList
        ref={flatListRef}
        style={{ flex: 1, padding: 12 }}
        contentContainerStyle={{ paddingBottom: 80 + (insets.bottom || 0) }}
        keyboardShouldPersistTaps="handled"
        data={[...msgs].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))}
        keyExtractor={(m) => String(m.id)}
        renderItem={({ item }) => {
          const mine = item.senderId === uid;
          const label = mine ? myName : otherName;
          return (
            <View style={{ marginVertical: 4, maxWidth: "85%", alignSelf: mine ? "flex-end" : "flex-start" }}>
              <Text style={{ fontSize: 12, color: "#666", marginBottom: 2 }}>{label}</Text>
              <View style={{ backgroundColor: mine ? "#d1f7c4" : "#eee", padding: 10, borderRadius: 12 }}>
                <Text>{item.text}</Text>
              </View>
            </View>
          );
        }}
      />

      <View style={{ 
        flexDirection: "row", 
        padding: 8, 
        borderTopWidth: 1, 
        borderColor: "#eee", 
        backgroundColor: "#fff",
        paddingBottom: 24
      }}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Skriv en besked…"
          style={{ flex: 1, padding: 12, borderWidth: 1, borderColor: "#ddd", borderRadius: 12, marginRight: 8, backgroundColor: "#fff" }}
          onSubmitEditing={send}
          returnKeyType="send"
        />
        <TouchableOpacity onPress={send} style={{ paddingHorizontal: 16, justifyContent: "center", opacity: text.trim() ? 1 : 0.5 }}>
          <Text style={{ fontWeight: "700" }}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
    </ImageBackground>
  );
}
