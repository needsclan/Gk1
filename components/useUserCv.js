// components/useUserCv.js
import { useEffect, useState, useCallback } from "react";
import { rtdb, storage } from "../database/database";
import { ref, update, get, child } from "firebase/database";
import { ref as sref, uploadBytes, getDownloadURL } from "firebase/storage";

export function useUserCv(uid) {
  // status felter
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // cv felter
  const [headline, setHeadline] = useState("");
  const [text, setText] = useState("");
  const [photoUri, setPhotoUri] = useState(null);

  const [region, setRegion] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [age, setAge] = useState("");          // ui som tekst
  const [yearsExp, setYearsExp] = useState(""); 
  const [availability, setAvailability] = useState("");

  // ui holder disse som tekst
  const [skills, setSkills] = useState("");
  const [languages, setLanguages] = useState("");

  // henter eksisterende cv data
  useEffect(() => {
    const load = async () => {
      if (!uid) return setLoading(false);
      try {
        const snap = await get(child(ref(rtdb), `cvs/${uid}`));
        if (snap.exists()) {
          const data = snap.val() || {};

          setHeadline(data.headline ?? "");
          setText(data.text ?? "");

          // læser både photoUrl og photoUri
          setPhotoUri(data.photoUrl ?? data.photoUri ?? null);

          setRegion(data.region ?? "");
          setEducationLevel(data.educationLevel ?? "");
          setAge(data.age != null ? String(data.age) : "");
          setYearsExp(data.yearsExp != null ? String(data.yearsExp) : "");
          setAvailability(data.availability ?? "");

          setSkills(Array.isArray(data.skills) ? data.skills.join(", ") : (data.skills ?? ""));
          setLanguages(Array.isArray(data.languages) ? data.languages.join(", ") : (data.languages ?? ""));
        }
      } catch (e) {
        setError(e.message || "Kunne ikke hente CV");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [uid]);

  // uploader billede og returnerer offentlig url
  const uploadImageAsync = useCallback(async (uri, userId) => {
    const res = await fetch(uri);
    const blob = await res.blob();
    const type = blob.type || "image/jpeg";
    const ext = (type.split("/")[1] || "jpg").split(";")[0];
    const storageRef = sref(storage, `avatars/${userId}/profile.${ext}`);
    await uploadBytes(storageRef, blob, { contentType: type });
    return await getDownloadURL(storageRef);
  }, []);

  // gemmer cv data
  const save = useCallback(async (payload = {}) => {
    if (!uid) return;

    setSaving(true);
    setError(null);

    try {
      // billede håndtering
      let nextPhotoUrl = null;
      const src = payload.photoUri ?? photoUri;
      if (src?.startsWith?.("file://")) {
        nextPhotoUrl = await uploadImageAsync(src, uid);
      } else if (src?.startsWith?.("http")) {
        nextPhotoUrl = src;
      }

      // helper til arrays
      const parseArr = (v, fallbackText) => {
        if (Array.isArray(v)) return v;
        const textVal = typeof v === "string" ? v : fallbackText || "";
        return textVal.split(",").map(s => s.trim()).filter(Boolean);
      };

      // næste objekt som skrives
      const next = {
        headline: (payload.headline ?? headline ?? "").trim(),
        text: payload.text ?? text ?? "",
        photoUrl: nextPhotoUrl ?? (payload.photoUrl ?? null),

        region: (payload.region ?? region) || null,
        educationLevel: (payload.educationLevel ?? educationLevel) || null,
        availability: (payload.availability ?? availability) || null,

        age: payload.age ?? (age ? Number(age) : null),
        yearsExp: payload.yearsExp ?? (yearsExp ? Number(yearsExp) : null),

        skills: parseArr(payload.skills, skills).length ? parseArr(payload.skills, skills) : null,
        languages: parseArr(payload.languages, languages).length ? parseArr(payload.languages, languages) : null,

        ts: Date.now(),
      };

      // fjerner undefined værdier
      Object.keys(next).forEach((k) => {
        if (next[k] === undefined) delete next[k];
      });

      // skriver ændringer til databasen
      await update(ref(rtdb, `cvs/${uid}`), next);

    } catch (e) {
      setError(e.message || "Kunne ikke gemme CV");
    } finally {
      setSaving(false);
    }
  }, [
    uid, headline, text, photoUri, region, educationLevel, availability,
    age, yearsExp, skills, languages, uploadImageAsync
  ]);

  // eksporter state og actions
  return {
    headline, setHeadline,
    text, setText,
    photoUri, setPhotoUri,
    region, setRegion,
    educationLevel, setEducationLevel,
    age, setAge,
    yearsExp, setYearsExp,
    availability, setAvailability,
    skills, setSkills,
    languages, setLanguages,

    loading, saving, error, save,
  };
}
