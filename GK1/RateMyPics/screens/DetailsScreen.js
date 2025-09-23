import React, { useMemo } from "react";
import { View, Text, Image, FlatList, ScrollView, Pressable } from "react-native";
import styles from "../styles/styles";
import { IMAGES } from "../data/images";
import { useRatings } from "../context/RatingsContext";
import StarRating from "../components/StarRating";

export default function DetailsScreen({ route, navigation }) {  // ← tilføj navigation
  const { imageId } = route.params;
  const image = IMAGES.find((x) => x.id === imageId);
  const { getRating, setRating, getHistory, getAverage } = useRatings();

  const current = getRating(image.id);
  const average = getAverage(image.id);
  const rows = useMemo(
    () => [...getHistory(image.id)].sort((a, b) => b.ts - a.ts),
    [imageId, getHistory]
  );
  return (
    <View style={styles.containerWhite}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
<Pressable 
  onPress={() => navigation.goBack()} 
  style={{ width: "100%", alignItems: "center" }}
>
  <Image 
    source={{ uri: image.url }} 
    style={[styles.detailImage, { width: "100%", height: 300 }]} 
    resizeMode="cover" 
  />
</Pressable>



        <Text style={styles.title}>{image.title}</Text>
        <Text style={styles.subtitle}>Gns: {average}/5 – Din: {current || 0}/5</Text>

        <StarRating value={current} onChange={(val) => setRating(image.id, val)} size={34} />

        <Text style={[styles.subtitle, { marginTop: 16 }]}>Din historik:</Text>
        <FlatList
          data={rows}
          keyExtractor={(item, idx) => String(item.ts) + idx}
          style={{ width: "92%" }}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.historyRow}>
              <Text style={styles.historyText}>{item.value}/5</Text>
              <Text style={styles.historyDate}>{new Date(item.ts).toLocaleString()}</Text>
            </View>
          )}
        />
      </ScrollView>
    </View>
  );
}

