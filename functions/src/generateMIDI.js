const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const os = require("os");
const path = require("path");

const storage = admin.storage();
const db = admin.firestore();

/*
  generateMIDI(seed)
  Input: { bpm, key, style, seedId }
  Output: { projectId, midiUrls: [], metadata }
*/
exports.generateMIDI = functions.https.onCall(async (data, context) => {
  const { bpm = 120, key = "C", style = "lofi", seedId } = data;
  const projectId = data.projectId || `proj-${uuidv4()}`;

  // TODO: Replace with real MIDI generation service/ML
  // Simulate creation of 4 MIDI loops
  const midiFiles = [];
  for (let i = 0; i < 4; i++) {
    const filename = `${projectId}/midi/loop-${i}.mid`;
    const tmp = path.join(os.tmpdir(), `loop-${i}.mid`);
    fs.writeFileSync(tmp, `MIDI-DUMMY-${i}-${bpm}-${key}-${style}`);
    await storage.bucket().upload(tmp, { destination: filename });
    fs.unlinkSync(tmp);
    const url = await storage.bucket().file(filename).getSignedUrl({ action: "read", expires: Date.now() + 3600*1000 });
    midiFiles.push(url[0]);
  }

  const manifest = {
    projectId,
    bpm, key, style,
    midiUrls: midiFiles,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await db.collection("projects").doc(projectId).set(manifest, { merge: true });
  return manifest;
});