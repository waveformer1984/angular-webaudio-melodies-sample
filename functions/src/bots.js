const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { v4: uuidv4 } = require("uuid");
const { VertexAI } = require('@google-cloud/vertex-ai');

const db = admin.firestore();

// Initialize Vertex AI
const vertex_ai = new VertexAI({ project: 'rezonette-studio', location: 'us-central1' });
const model = 'gemini-1.0-pro-001'; // Use a suitable Gemini model

const generativeModel = vertex_ai.getGenerativeModel({
    model: model,
    generation_config: {
        "max_output_tokens": 8192,
        "temperature": 0.9,
        "top_p": 1
    },
});

/**
 * Creates a new Studio Bot instance for a user.
 */
exports.createStudioBot = functions.https.onCall(async (data, context) => {
  const { botId, nickname } = data;
  const uid = context.auth.uid;

  if (!uid) {
    throw new functions.https.HttpsError("unauthenticated", "User must be logged in to create a bot.");
  }

  if (!botId) {
    throw new functions.https.HttpsError("invalid-argument", "A 'botId' is required to create a bot.");
  }

  const placeholderNftId = `nft-placeholder-${uuidv4()}`;

  const newUserBot = {
    botId,
    ownerUid: uid,
    nickname: nickname || `My ${botId} Bot`,
    nftId: placeholderNftId, 
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const botRef = await db.collection("userBots").add(newUserBot);

  console.log(`New UserBot created with ID: ${botRef.id} for user ${uid}`);

  return { userBotId: botRef.id, ...newUserBot };
});

/**
 * Starts a new chat session with a bot and gets the initial message.
 */
exports.startChat = functions.https.onCall(async (data, context) => {
    const { userBotId } = data;
    const uid = context.auth.uid;

    if (!uid) {
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    }

    // Retrieve bot details to get its personality/prompt
    const botSnapshot = await db.collection('bots').doc(userBotId).get();
    if (!botSnapshot.exists) {
        throw new functions.https.HttpsError("not-found", "Bot not found.");
    }
    const botData = botSnapshot.data();

    const chat = generativeModel.startChat({
        context: botData.prompt, // Use the bot's persona as context
        history: [], // No history for a new chat
    });

    const initialMessage = "Hello! I'm ready to help you create. What's on your mind?";

    // We don't need to send a message to the model to start, just return an initial greeting.
    return { initialResponse: initialMessage };
});


/**
 * Handles user interaction with a Studio Bot using an ongoing chat session.
 */
exports.interactWithBot = functions.https.onCall(async (data, context) => {
  const { userBotId, message, history } = data; // Expecting message history
  const uid = context.auth.uid;

  if (!uid) {
    throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
  }

  const botSnapshot = await db.collection('bots').doc(userBotId).get();
  if (!botSnapshot.exists) {
      throw new functions.https.HttpsError("not-found", "Bot not found.");
  }
  const botData = botSnapshot.data();

  // Recreate the chat session with history
  const chat = generativeModel.startChat({
      context: botData.prompt,
      history: history || [],
  });

  const stream = await chat.sendMessageStream(message);
  const aggregatedResponse = await stream.response;
  const botResponse = aggregatedResponse.candidates[0].content.parts[0].text;
  
  return { response: botResponse };
});
