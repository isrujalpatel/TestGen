const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : 'https://testgen-2zht.onrender.com'; 

let savedSolutions = {};

document.getElementById('generate-btn').addEventListener('click', async () => {
  const payload = {
    title: document.getElementById('title').value,
    description: document.getElementById('description').value,
    input_format: document.getElementById('input_format').value,
    output_format: document.getElementById('output_format').value,
    constraints: document.getElementById('constraints').value,
  };

  const btn = document.getElementById('generate-btn');
  btn.innerText = 'Analyzing & Generating...';
  btn.disabled = true;

  try {
    const res = await fetch(`${BACKEND_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    // Parse JSON response data
    const data = await res.json();

    // Check if the server returned a bad status code (400, 500, etc.)
    if (!res.ok) {
      // Pull the exact descriptive error message from the backend catch block
      throw new Error(data.details || data.error || `Status ${res.status}`);
    }
    
    // If successful, pass the data directly to display
    displayResults(data);
  } catch (err) {
    // This will now pop up the REAL error reason coming from Gemini!
    alert('Failed to construct suite: ' + err.message);
  } finally {
    btn.innerText = 'Generate Comprehensive Suite';
    btn.disabled = false;
  }
});

function displayResults(data) {
  document.getElementById('output-section').classList.remove('hidden');
  
  const formatCase = (c) => {
    if (!c) return 'N/A';
    if (typeof c === 'object') {
      return `Input:\n${c.input || ''}\n\nOutput:\n${c.output || ''}`;
    }
    return c;
  };

  document.getElementById('edge_case_view').innerText = formatCase(data.edgeCase || data.edge_case);
  document.getElementById('base_case_view').innerText = formatCase(data.baseCase || data.base_case);
  document.getElementById('time_limit_case_view').innerText = formatCase(data.timeLimitCase || data.time_limit_case);
  document.getElementById('complex_case_view').innerText = formatCase(data.complexCase || data.complex_case);
  document.getElementById('hard_case_view').innerText = formatCase(data.hardCase || data.hard_case);

  document.getElementById('brute_force_view').innerText = data.approaches?.brute_force || 'N/A';
  document.getElementById('optimal_view').innerText = data.approaches?.optimal || 'N/A';

  savedSolutions = data.solutions || {};
  switchLang('cpp');
}

function switchLang(lang) {
  document.querySelectorAll('.lang-selector button').forEach(b => b.classList.remove('active'));
  
  // Safely check if event path is initialized via UI interactions
  if (typeof event !== 'undefined' && event.target) {
    event.target.classList.add('active');
  }
  
  document.getElementById('code_display').innerText = savedSolutions[lang] || 'No code found';
}