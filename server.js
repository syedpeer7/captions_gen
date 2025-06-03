import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.post('/api/generate', async (req, res) => {
  const { description, platform } = req.body;

  if (!description) {
    return res.status(400).json({ error: 'Missing video description' });
  }

  let stylePrompt = '';
  switch (platform) {
    case 'instagram':
      stylePrompt = 'Make it catchy, visually appealing, with trendy and viral hashtags.';
      break;
    case 'linkedin':
      stylePrompt = 'Make it professional, insightful, and career-focused with decent hashtags.';
      break;
    case 'x':
      stylePrompt = 'Make it short, clever, and impactful with relevant hashtags.';
      break;
    default:
      stylePrompt = '';
  }

  const prompt = `Generate a ${platform} post with a caption and 10 hashtags based on the following content:\n\n"${description}"\n\n${stylePrompt}\n\nFormat:\nCaption:\n<your caption>\n\nHashtags:\n#tag1 #tag2 #tag3 #tag4 #tag5 #tag6 #tag7 #tag8 #tag9 #tag10`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data.error.message || 'Unknown error from Gemini API' });
    }

    const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini';
    res.json({ result: generatedText });
  } catch (error) {
    console.error('Gemini API error:', error);
    res.status(500).json({ error: error.message || 'Gemini request failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
