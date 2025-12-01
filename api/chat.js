const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Available Playlist Categories in Musicare
 * These are the categories we can recommend to users
 */
const AVAILABLE_CATEGORIES = {
  // Health Goals
  anxiety_relief: { type: 'goal', key: 'anxiety_relief', description: 'Calming music to ease anxiety and tension' },
  stress_relief: { type: 'goal', key: 'stress_relief', description: 'Soothing sounds to reduce stress' },
  sleep_improvement: { type: 'goal', key: 'sleep_improvement', description: 'Gentle music for better sleep' },
  mental_wellness: { type: 'goal', key: 'mental_wellness', description: 'Relaxing soundscapes for mental balance' },
  focus: { type: 'goal', key: 'focus', description: 'Instrumental music for concentration' },
  meditation: { type: 'goal', key: 'meditation', description: 'Peaceful music for meditation' },
  exercise: { type: 'goal', key: 'exercise', description: 'Energizing music for workouts' },
  mood_boost: { type: 'goal', key: 'mood_boost', description: 'Uplifting music to improve mood' },
  lofi_therapy: { type: 'goal', key: 'lofi_therapy', description: 'Lo-fi beats for relaxation' },

  // Music Genres
  lofi: { type: 'genre', key: 'lofi', description: 'Chill lo-fi hip hop beats' },
  rock: { type: 'genre', key: 'rock', description: 'Rock music for energy and confidence' },
  rnb: { type: 'genre', key: 'rnb', description: 'Smooth R&B and soul music' },
  nature: { type: 'genre', key: 'nature', description: 'Nature sounds and ambient music' }
};

/**
 * Use OpenAI to intelligently match user emotion to best playlist category
 * @param {string} message - User's message
 * @param {string} apiKey - OpenAI API key
 * @returns {Promise<Object|null>} - Matched category or null
 */
async function detectMoodWithAI(message, apiKey) {
  try {
    console.log('🤖 Chatbot: Using AI to detect mood and match playlist...');

    // Create a list of available categories for AI to choose from
    const categoryList = Object.entries(AVAILABLE_CATEGORIES)
      .map(([key, cat]) => `- ${key}: ${cat.description}`)
      .join('\n');

    const detectionPrompt = `You are a music therapy assistant. A user said: "${message}"

Available playlist categories:
${categoryList}

Based on the user's emotional state or need, which ONE category would be most helpful?
Respond with ONLY the category key (e.g., "anxiety_relief" or "mood_boost").
If no category matches, respond with "none".`;

    const payload = {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a playlist recommendation expert. Respond with only the category key, nothing else.' },
        { role: 'user', content: detectionPrompt }
      ],
      temperature: 0.3, // Lower temperature for more consistent matching
      max_tokens: 20
    };

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error('❌ OpenAI mood detection failed:', response.status);
      return null;
    }

    const data = await response.json();
    const categoryKey = data?.choices?.[0]?.message?.content?.trim().toLowerCase();

    if (categoryKey && categoryKey !== 'none' && AVAILABLE_CATEGORIES[categoryKey]) {
      const category = AVAILABLE_CATEGORIES[categoryKey];
      console.log(`🎯 Chatbot: AI matched mood to category "${categoryKey}"`);
      return {
        mood: categoryKey,
        type: category.type,
        key: category.key
      };
    }

    console.log('🤖 Chatbot: AI did not detect a matching mood');
    return null;

  } catch (error) {
    console.error('❌ Error in AI mood detection:', error);
    return null;
  }
}

export default async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY is not set in environment variables');
    return res.status(500).json({ error: 'Server misconfiguration: missing API key' });
  }

  try {
    const { message } = req.body || {};
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid request: message is required' });
    }
    if (message.length > 4000) {
      return res.status(400).json({ error: 'Message too long' });
    }

    console.log('🤖 Chatbot: Sending message to OpenAI:', message.substring(0, 50) + '...');

    // Use AI to intelligently detect mood and match to best playlist category
    const detectedMood = await detectMoodWithAI(message, apiKey);

    // Enhanced system prompt to include playlist recommendations
    const systemPrompt = detectedMood
      ? `You are Musicare assistant, a therapeutic music recommendation chatbot. The user seems to need ${AVAILABLE_CATEGORIES[detectedMood.mood]?.description || 'music therapy'}. Provide a warm, empathetic response acknowledging their feelings, and mention that you're curating personalized playlists to help them. Keep responses friendly, supportive, and concise (2-3 sentences max).`
      : 'You are Musicare assistant, a therapeutic music recommendation chatbot. Provide friendly, supportive responses about music and wellness. Keep responses concise (2-3 sentences max).';

    const payload = {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.8,
      max_tokens: 400
    };

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('❌ OpenAI error:', response.status, errText);
      return res.status(502).json({ error: 'OpenAI API error', details: errText });
    }

    const data = await response.json();
    const assistantMsg = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text ?? 'No reply from model.';
    console.log('✅ Chatbot: Received response from OpenAI');

    // Return response with playlist recommendation metadata
    const responseData = {
      reply: assistantMsg
    };

    // If mood detected, include playlist recommendation
    if (detectedMood) {
      responseData.playlistRecommendation = {
        type: detectedMood.type,
        key: detectedMood.key,
        mood: detectedMood.mood
      };
      console.log(`🎵 Chatbot: Recommending ${detectedMood.type}:${detectedMood.key} playlists`);
    }

    return res.status(200).json(responseData);
  } catch (err) {
    console.error('❌ Server error in /api/chat:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};
