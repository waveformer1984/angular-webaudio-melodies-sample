const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { v4: uuidv4 } = require("uuid");

const db = admin.firestore();

/*
  generateLyrics(seed)
  Input: { title, mood, bpm, linesTarget }
  Output: { lyricsUrl, lyricsJson }
*/
exports.generateLyrics = functions.https.onCall(async (data, context) => {
  const { title = "Untitled", mood = "melancholic", bpm = 120 } = data;
  const projectId = data.projectId || `proj-${uuidv4()}`;

  // TODO: Replace with real LLM call
  const lyrics = {
    title,
    mood,
    bpm,
    chorus: [
      "Night falls, the neon breathes",
      "We trade our names for melodies"
    ],
    verse1: [
      "Streetlight ghosts in coffee steam",
      "Your laugh a flash, a distant beam"
    ],
    createdAt: new Date().toISOString()
  };

  const docRef = db.collection("projects").doc(projectId);
  await docRef.set({ lyrics }, { merge: true });

  return { projectId, lyrics };
});