import React, { createContext, useContext, useState } from "react";
import { IMAGES } from "../data/images";

const RatingsContext = createContext();

// helper til gennemsnit
const avg = (arr) => (arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length) : 0);

export const RatingsProvider = ({ children }) => {
  // { [imageId]: { history: [ {value, ts} ] } }
  const [store, setStore] = useState(() => {
    const seeded = {};
    IMAGES.forEach((img) => {
      seeded[img.id] = { history: [] };
    });
    return seeded;
  });

  const setRating = (imageId, value) => {
    setStore((prev) => {
      const img = prev[imageId] ?? { history: [] };
      const nextHistory = [...img.history, { value: value, ts: Date.now() }];
      return {
        ...prev,
        [imageId]: { history: nextHistory }
      };
    });
  };

  const getRating = (imageId) => {
    const h = store[imageId]?.history ?? [];
    return h.length ? h[h.length - 1].value : 0; // seneste rating
  };

  const getHistory = (imageId) => store[imageId]?.history ?? [];

  const getAverage = (imageId) => {
    const h = getHistory(imageId);
    if (h.length === 0) return 0;
    const sum = h.reduce((a, b) => a + b.value, 0);
    return Number((sum / h.length).toFixed(2));
  };

  return (
    <RatingsContext.Provider value={{ setRating, getRating, getHistory, getAverage }}>
      {children}
    </RatingsContext.Provider>
  );
};

export const useRatings = () => useContext(RatingsContext);
