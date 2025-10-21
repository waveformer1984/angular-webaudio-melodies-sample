const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { v4: uuidv4 } = require("uuid");
const { VertexAI } = require('@google-cloud/vertex-ai');
const { searchWebForSong } = require("./search"); // Import the search function

const db = admin.firestore();

// Initialize Vertex AI
const vertex_ai = new VertexAI({ project: 'rezonette-studio', location: 'us-central1' });
const model = 'gemini-1.0-pro-001';

const generativeModel = vertex_ai.getGenerativeModel({
    model: model,
    generation_config: {
        "max_output_tokens": 8192,
        "temperature": 0.9,
        "top_p": 1
    },
});

// ... (createStudioBot and startChat functions remain the same) ...

/**
 * Handles user interaction with a Studio Bot, now with web search capabilities.
 */
exports.interactWithBot = functions.https.onCall(async (data, context) => {
    const { userBotId, message, history } = data;
    const uid = context.auth.uid;

    if (!uid) {
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    }

    // Keyword to trigger the song search
    const searchTrigger = "find the song";

    if (message.toLowerCase().startsWith(searchTrigger)) {
        const songQuery = message.substring(searchTrigger.length).trim();
        
        try {
            const songInfo = await searchWebForSong({ query: songQuery });

            if (songInfo && songInfo.artist) {
                return {
                    type: 'song_found',
                    song: songInfo,
                    response: `I found \"${songInfo.title}\" by ${songInfo.artist}. What would you like to do?`,
                    options: [
                        { id: 'midi_pattern', text: 'Generate a MIDI pattern' },
                        { id: 'song_sample', text: 'Find a sample of the song' },
                        { id: 'model_track', text: 'Use it as a model track' }
                    ]
                };
            } else {
                return { type: 'text', response: `I couldn\'t find that song. Can you give me more information?` };
            }
        } catch (error) {
            console.error("Error during song search flow:", error);
            return { type: 'text', response: "I had trouble searching for that song. Please try again." };
        }

    } else {
        // Default conversational flow
        const botSnapshot = await db.collection('bots').doc(userBotId).get();
        if (!botSnapshot.exists) {
            throw new functions.https.HttpsError("not-found", "Bot not found.");
        }
        const botData = botSnapshot.data();

        const chat = generativeModel.startChat({
            context: botData.prompt,
            history: history || [],
        });

        const stream = await chat.sendMessageStream(message);
        const aggregatedResponse = await stream.response;
        const botResponse = aggregatedResponse.candidates[0].content.parts[0].text;

        return { type: 'text', response: botResponse };
    }
});
