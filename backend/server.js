import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Groq client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.post('/api/generate', async (req, res) => {
  try {
    const { title, description, input_format, output_format, constraints } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const promptText = `Generate a comprehensive coding challenge suite for the problem: "${title}".
Description: "${description || 'No description provided.'}"
Input Format: "${input_format || 'Standard'}"
Output Format: "${output_format || 'Standard'}"
Constraints: "${constraints || 'None specified.'}"

You MUST return a raw JSON object matching this schema exactly, with no extra text before or after it:
{
  "edge_case": "Describe the edge cases here...",
  "base_case": "Describe the base cases here...",
  "time_limit_case": "Describe time limit test criteria...",
  "complex_case": "Describe a complex structural case...",
  "hard_case": "Describe a hard stress test case...",
  "approaches": {
    "brute_force": "Explain the brute force strategy and its complexity.",
    "optimal": "Explain the optimal approach strategy and its complexity."
  },
  "solutions": {
    "cpp": "// Your full production-ready C++ solution code here",
    "java": "// Your full production-ready Java solution code here",
    "python": "// Your full production-ready Python solution code here"
  }
}`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are a precise coding-problem test suite generator. You only ever respond with raw, valid JSON matching the schema given by the user — no markdown fences, no commentary.' },
        { role: 'user', content: promptText },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const rawText = completion.choices[0].message.content;
    const generatedData = JSON.parse(rawText);
    res.json(generatedData);

  } catch (error) {
    console.error('=== BACKEND CRASH LOG ===');
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

app.get('/', (req, res) => {
  res.send('Backend Server is Online!');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});