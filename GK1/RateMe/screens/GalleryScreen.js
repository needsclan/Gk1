import React, { useState } from "react";
import {
  FlatList,
  Image,
  Dimensions,
  Pressable,
  View,
  Text,
} from "react-native";
import { IMAGES } from "../data/images";
import { useRatings } from "../context/RatingsContext";
import styles from "../styles/styles";

const { width: WIN_W } = Dimensions.get("window");

export default function GalleryScreen({ navigation }) {
  const { getAverage, getRating } = useRatings();
  const [index, setIndex] = useState(0);

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <FlatList
        data={IMAGES}
        horizontal
        pagingEnabled
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(ev) => {
          const i = Math.round(ev.nativeEvent.contentOffset.x / WIN_W);
          setIndex(i);
        }}
        renderItem={({ item }) => (
          <Pressable
            style={{ width: WIN_W, flex: 1 }}
            onPress={() =>
              navigation.navigate("Details", { imageId: item.id })
            }
          >
            <Image
              source={{ uri: item.url }}
              style={styles.galleryImageFlex}
            />
          </Pressable>
        )}
      />

      {/* Bundbar med ratings */}
      <View style={styles.galleryInfoBar}>
        {(() => {
          const current = IMAGES[index] ?? IMAGES[0];
          const avg = current ? getAverage(current.id) : 0;
          const yours = current ? getRating(current.id) : 0;

          return (
            <>
              <Text style={styles.galleryInfoTitle}>
                {current?.title ?? ""}
              </Text>
              <Text style={styles.galleryInfoRating}>Gns: {avg}/5</Text>
              <Text style={styles.galleryInfoRating}>
                Din: {yours || 0}/5
              </Text>
            </>
          );
        })()}
      </View>
    </View>
  );
}
