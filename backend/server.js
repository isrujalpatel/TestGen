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

    const promptText = `You are an expert competitive programming test case generator.

Your task is to generate ONLY actual test cases and the associated approaches/solutions for the following problem:
Title: "${title}"
Description: "${description || 'No description provided.'}"
Input Format: "${input_format || 'Standard'}"
Output Format: "${output_format || 'Standard'}"
Constraints: "${constraints || 'None specified.'}"

The response MUST be valid JSON.
Do NOT describe the test case.
Do NOT explain.
Do NOT write things like:
- Empty array
- Large numbers
- Duplicate elements
- Array of 10^4 elements

Instead generate REAL input values.

Rules for cases:
- Edge Case (edgeCase): Generate minimum constraint input.
- Base Case (baseCase): Generate a simple valid example.
- Time Limit Case (timeLimitCase): Generate a very large valid input using actual numbers. Do NOT say "10^5 elements" or write a description. Actually generate the real values/elements.
- Complex Case (complexCase): Generate an input containing multiple tricky situations.
- Hard Case (hardCase): Generate the hardest possible valid input according to constraints.

For every case, compute the correct expected output.

You MUST return a raw JSON object matching this schema exactly, with no extra text before or after it:
{
  "edgeCase": {
    "input": "[actual concrete input data formatted exactly as required by the Input Format, e.g. nums = [2], target = 4]",
    "output": "[actual expected output data formatted exactly as required by the Output Format]"
  },
  "baseCase": {
    "input": "[actual concrete input data formatted exactly as required by the Input Format, e.g. nums = [2, 7, 11, 15], target = 9]",
    "output": "[actual expected output data formatted exactly as required by the Output Format, e.g. [0, 1]]"
  },
  "timeLimitCase": {
    "input": "[actual concrete input data, representing a large case using actual numbers. Generate the array/matrix elements fully]",
    "output": "[actual expected output data]"
  },
  "complexCase": {
    "input": "[actual concrete input data with multiple tricky scenarios]",
    "output": "[actual expected output data]"
  },
  "hardCase": {
    "input": "[actual concrete input data representing the hardest possible valid input according to constraints]",
    "output": "[actual expected output data]"
  },
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