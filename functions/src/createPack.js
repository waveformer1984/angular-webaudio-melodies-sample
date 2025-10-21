const functions = require("firebase-functions");
const admin = require("firebase-admin");
const archiver = require("archiver");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const os = require("os");
const path = require("path");

const db = admin.firestore();
const storage = admin.storage();

/*
 createPack(patternIds[])
 Collect top examples, render 30s preview, zip assets, upload pack
*/
exports.createPack = functions.https.onCall(async (data, context) => {
  const { projectId, patternIds = [] } = data;
  if (!projectId) throw new functions.https.HttpsError("invalid-argument", "projectId required");

  // Gather assets (simulated)
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pack-"));
  const zipPath = path.join(tmpDir, `pack-${uuidv4()}.zip`);
  const output = fs.createWriteStream(zipPath);
  const archive = archiver("zip");

  archive.pipe(output);

  // In real impl: fetch best audio/midi per pattern; here we create dummy files
  patternIds.forEach((pid, i) => {
    const f = path.join(tmpDir, `loop-${i}.wav`);
    fs.writeFileSync(f, `DUMMY AUDIO ${pid}`);
    archive.file(f, { name: `loops/loop-${i}.wav` });
    const m = path.join(tmpDir, `loop-${i}.mid`);
    fs.writeFileSync(m, `DUMMY MIDI ${pid}`);
    archive.file(m, { name: `midi/loop-${i}.mid` });
  });

  await archive.finalize();

  const bucketPath = `${projectId}/packs/${path.basename(zipPath)}`;
  await storage.bucket().upload(zipPath, { destination: bucketPath });
  fs.rmSync(tmpDir, { recursive: true, force: true });

  const [url] = await storage.bucket().file(bucketPath).getSignedUrl({ action: "read", expires: Date.now() + 24*3600*1000 });

  const packDoc = {
    projectId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    patterns: patternIds,
    packUrl: url
  };

  const docRef = await db.collection("packs").add(packDoc);
  return { packId: docRef.id, packUrl: url };
});