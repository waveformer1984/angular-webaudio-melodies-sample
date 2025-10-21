const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const os = require("os");
const path = require("path");

const storage = admin.storage();
const db = admin.firestore();

/*
 synthesizeVocal(lyrics, melody)
 Inputs: { projectId, lyrics, melodyRef }
 Output: { vocalUrl, alignment }
*/
exports.synthesizeVocal = functions.https.onCall(async (data, context) => {
  const { projectId, lyrics } = data;
  if (!projectId || !lyrics) throw new functions.https.HttpsError("invalid-argument", "projectId and lyrics required");

  // TODO: Call your TTS/singing model here.
  // Simulate by writing a dummy WAV file to Storage.
  const filename = `${projectId}/audio/vocal-demo.wav`;
  const tmp = path.join(os.tmpdir(), `vocal-${uuidv4()}.wav`);
  fs.writeFileSync(tmp, `WAV-DUMMY-VOCAL - ${JSON.stringify(lyrics).slice(0,200)}`);
  await storage.bucket().upload(tmp, { destination: filename });
  fs.unlinkSync(tmp);

  const url = await storage.bucket().file(filename).getSignedUrl({ action: "read", expires: Date.now() + 3600*1000 });

  // Simulated alignment map
  const alignment = lyrics ? { lines: Object.keys(lyrics).length || 1 } : { lines: 0 };
  await db.collection("projects").doc(projectId).set({ vocal: { url: url[0], alignment } }, { merge: true });

  return { vocalUrl: url[0], alignment };
});