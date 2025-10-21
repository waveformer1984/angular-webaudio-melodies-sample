const admin = require("firebase-admin");
const { getFunctions, httpsCallable } = require("firebase/functions");
const { initializeApp } = require("firebase/app");
const { getAuth, signInAnonymously } = require("firebase/auth");
const { getFirestore } = require("firebase/firestore");
const functions = require("firebase/functions");

// configure to emulator
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
process.env.FUNCTIONS_EMULATOR_ORIGIN = "http://localhost:5001";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";
process.env.FIREBASE_STORAGE_EMULATOR_HOST = "localhost:9199";

const firebaseConfig = {
  apiKey: "fake",
  authDomain: "localhost",
  projectId: "rezonette-test"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const fns = functions.getFunctions(app, "http://localhost:5001");
const call = (name, data) => httpsCallable(fns, name)(data);

async function run() {
  console.log("Signing in anonymously...");
  await signInAnonymously(auth);

  console.log("Generating MIDI...");
  const midiResp = await call("generateMIDI", { bpm: 120, key: "A", style: "lofi", projectId: "test-proj-1" });
  console.log("MIDI manifest:", midiResp.data);

  console.log("Generating Lyrics...");
  const lyricsResp = await call("generateLyrics", { title: "Midnight Drift", mood: "nostalgic", projectId: "test-proj-1" });
  console.log("Lyrics:", lyricsResp.data);

  console.log("Synthesizing Vocal...");
  const synthResp = await call("synthesizeVocal", { projectId: "test-proj-1", lyrics: lyricsResp.data.lyrics });
  console.log("Vocal:", synthResp.data);

  console.log("Analyzing Session...");
  const analyzeResp = await call("analyzeSession", { projectId: "test-proj-1" });
  console.log("Analysis:", analyzeResp.data);

  console.log("Creating Pack...");
  const packResp = await call("createPack", { projectId: "test-proj-1", patternIds: analyzeResp.data.patterns.map(p => p.patternId) });
  console.log("Pack:", packResp.data);

  console.log("Test flow complete.");
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });