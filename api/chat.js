
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
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

    const payload = {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are Musicare assistant. Provide friendly playlist recommendations and short explanations.' },
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
      console.error('OpenAI error:', response.status, errText);
      return res.status(502).json({ error: 'OpenAI API error', details: errText });
    }

    const data = await response.json();
    const assistantMsg = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text ?? 'No reply from model.';
    return res.status(200).json({ reply: assistantMsg });
  } catch (err) {
    console.error('Server error in /api/chat:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
