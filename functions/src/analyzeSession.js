const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { v4: uuidv4 } = require("uuid");

const db = admin.firestore();

/*
 analyzeSession(projectId)
 Runs pattern extraction over recorded session snapshots and writes patterns to /patterns
*/
exports.analyzeSession = functions.https.onCall(async (data, context) => {
  const { projectId } = data;
  if (!projectId) throw new functions.https.HttpsError("invalid-argument", "projectId required");

  // TODO: Replace with real analysis pipeline (motif extraction, clustering)
  // For now, scan project events and produce a fake pattern if events exist.
  const eventsSnap = await db.collection(`projects/${projectId}/events`).limit(100).get();
  const count = eventsSnap.size;
  const patterns = [];

  if (count > 0) {
    const patternId = `pattern-${uuidv4()}`;
    const pattern = {
      patternId,
      projectId,
      type: "motif",
      fingerprint: "FAKE-FP-" + Math.random().toString(36).slice(2,8),
      score: Math.min(1, 0.5 + (count / 100)),
      examples: [{ projectId, sample: "midi/loop-0.mid" }],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    await db.collection("patterns").doc(patternId).set(pattern);
    patterns.push(pattern);
  }

  await db.collection("projects").doc(projectId).set({ analyzedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  return { projectId, patternsFound: patterns.length, patterns };
});