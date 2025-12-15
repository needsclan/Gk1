// screens/ChatListScreen.js
import React, { useEffect, useState, useCallback } from "react";
import { FlatList, Text } from "react-native";
import {
  ref,
  onValue,
  off,
  query,
  orderByChild,
  get,
  remove,
} from "firebase/database";
import { rtdb, auth } from "../database/database";
import ChatListItem from "../components/ChatListItem";

export default function ChatListScreen({ navigation }) {
  // henter bruger id fra den aktuelle session
  const uid = auth.currentUser?.uid;

  // holder den viste liste over chats
  const [items, setItems] = useState([]);

  useEffect(() => {
    // stopper hvis brugeren ikke er logget ind
    if (!uid) return;

    // peger på brugerens chat oversigt sorteret efter opdateringstid
    const userChatsRef = ref(rtdb, `userChats/${uid}`);
    const q = query(userChatsRef, orderByChild("updatedAt"));

    // gemmer reference til callback for at kunne afmelde senere
    const callback = (snap) => {
      // læser data eller bruger tomt objekt
      const val = snap.val() || {};

      // mapper objekt til en liste egnet til flatlist
      const arr = Object.entries(val).map(([chatId, v]) => ({
        chatId,
        otherUid: v.otherUid,
        // falder tilbage til alternative felter hvis brugernavn mangler
        otherUsername: v.otherUsername || v.otheruid || v.otherUid,
        lastMessage: v.lastMessage || "",
        updatedAt: v.updatedAt || 0,
      }));

      // sorterer nyeste besked øverst
      arr.sort((a, b) => b.updatedAt - a.updatedAt);

      // opdaterer state så listen re renderer
      setItems(arr);
    };

    // starter realtime lytter
    onValue(q, callback);

    // afmelder lytter når komponenten unmountes eller uid ændrer sig
    return () => off(userChatsRef, "value", callback);
  }, [uid]);

  // åbner en chat og sender nødvendige parametre til chat skærmen
  const open = useCallback(
    (it) => {
      navigation.navigate("Chat", {
        chatId: it.chatId,
        otherUid: it.otherUid,
        otherUsername: it.otherUsername,
      });
    },
    [navigation]
  );

  // sletter en chat reference for den aktuelle bruger
  // rydder også hele beskedtråden hvis modparten ikke længere har chatten
  const deleteChat = useCallback(
    async (it) => {
      if (!uid) return;
      const { chatId, otherUid } = it;

      // fjerner chat reference hos den aktuelle bruger
      await remove(ref(rtdb, `userChats/${uid}/${chatId}`));

      // tjekker om modparten stadig har chat reference
      const otherRef = ref(rtdb, `userChats/${otherUid}/${chatId}`);
      const otherSnap = await get(otherRef);

      // hvis modparten ikke har chatten ryddes hele beskedtråden
      if (!otherSnap.exists()) {
        await remove(ref(rtdb, `messages/${chatId}`));
      }
    },
    [uid]
  );

  // viser en simpel tekst hvis brugeren ikke er logget ind
  if (!uid) return <Text style={{ padding: 16 }}>Login kræves</Text>;

  // viser tomtilstand hvis der ingen chats er
  if (!items.length) return <Text style={{ padding: 16 }}>Ingen kontakter endnu</Text>;

  // renderer chat listen
  return (
    <FlatList
      data={items}
      keyExtractor={(it) => String(it.chatId)}
      renderItem={({ item }) => (
        <ChatListItem item={item} onPress={open} onDelete={deleteChat} />
      )}
    />
  );
}
