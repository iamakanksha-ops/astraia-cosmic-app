export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user_date } = req.body;
  if (!user_date) {
    return res.status(400).json({ error: 'Date is required' });
  }

  try {
    const NASA_KEY = process.env.NASA_API_KEY;
    const GEMINI_KEY = process.env.GEMINI_API_KEY;

    // 1. Fetch deep space insight from NASA
    const nasaResponse = await fetch(`https://api.nasa.gov/planetary/apod?date=${user_date}&api_key=${NASA_KEY}`);
    const nasaData = await nasaResponse.json();

    if (!nasaResponse.ok) throw new Error(nasaData.msg || 'NASA API Error');

    // 2. Format the system instructions and data payload for the Gemini API
    const aiPrompt = {
      contents: [{
        parts: [{
          text: `You are a cosmic philosopher. Write a deeply moving, elegant, and poetic 3-paragraph narrative (under 250 words total) connecting the cosmic events of this NASA photo to a human milestone on this date: ${user_date}. 
          NASA Photo Title: ${nasaData.title}. 
          NASA Scientific Description: ${nasaData.explanation}.
          Structure: Paragraph 1 is the cosmic reality. Paragraph 2 is the emotional bridge to stardust/humanity. Paragraph 3 is a beautiful personal closing blessing.`
        }]
      }]
    };

    // 3. Request the generative story from Gemini
    // To this:
const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(aiPrompt)
    });
    
    const aiData = await geminiResponse.json();
    
    if (!geminiResponse.ok) throw new Error(aiData.error?.message || 'AI Generation Error');
    
    const generatedStory = aiData.candidates[0].content.parts[0].text;

    // 4. Return clean telemetry back to browser UI
    return res.status(200).json({
      title: nasaData.title,
      imageUrl: nasaData.hdurl || nasaData.url,
      story: generatedStory
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
