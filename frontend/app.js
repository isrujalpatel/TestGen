const isLocal = !window.location.hostname || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const BACKEND_URL = isLocal ? 'http://localhost:5000' : 'https://testgen-2zht.onrender.com'; 

// Global State for AI Agent data
let currentApproaches = {};
let currentSolutions = {};
let activeStrategy = 'brute_force'; // 'brute_force' | 'optimal'
let activeModalLang = 'cpp'; // 'cpp' | 'python' | 'java'

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
    
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.details || data.error || `Status ${res.status}`);
    }
    
    displayResults(data);
  } catch (err) {
    alert('Failed to construct suite: ' + err.message);
  } finally {
    btn.innerText = 'Generate Comprehensive Suite';
    btn.disabled = false;
  }
});

function displayResults(data) {
  // Reveal main output section (contains ONLY test cases grid)
  document.getElementById('output-section').classList.remove('hidden');
  
  // Reveal the small round circle icon named "AI"
  const aiCircleBtn = document.getElementById('ai-round-circle-btn');
  if (aiCircleBtn) {
    aiCircleBtn.classList.remove('hidden');
  }

  const formatCase = (c) => {
    if (!c) return 'N/A';
    if (typeof c === 'object') {
      return `Input:\n${c.input || ''}\n\nOutput:\n${c.output || ''}`;
    }
    return c;
  };

  // Render ONLY Test Cases
  document.getElementById('edge_case_view').innerText = formatCase(data.edgeCase || data.edge_case);
  document.getElementById('base_case_view').innerText = formatCase(data.baseCase || data.base_case);
  document.getElementById('time_limit_case_view').innerText = formatCase(data.timeLimitCase || data.time_limit_case);
  document.getElementById('complex_case_view').innerText = formatCase(data.complexCase || data.complex_case);
  document.getElementById('hard_case_view').innerText = formatCase(data.hardCase || data.hard_case);

  // Store AI Solutions & Approaches data
  currentApproaches = data.approaches || {};
  currentSolutions = data.solutions || {};

  // Default active strategy
  selectStrategy('brute_force');
}

// Open / Close AI Modal
function openAiAgentModal() {
  const modal = document.getElementById('ai-agent-modal');
  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

function closeAiAgentModal() {
  const modal = document.getElementById('ai-agent-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

function handleModalOverlayClick(e) {
  if (e.target.id === 'ai-agent-modal') {
    closeAiAgentModal();
  }
}

// Select strategy: 'brute_force' or 'optimal'
function selectStrategy(strategyKey) {
  activeStrategy = strategyKey;

  const btnBrute = document.getElementById('btn-select-brute');
  const btnOptimal = document.getElementById('btn-select-optimal');

  if (btnBrute) btnBrute.classList.toggle('active', strategyKey === 'brute_force');
  if (btnOptimal) btnOptimal.classList.toggle('active', strategyKey === 'optimal');

  const expLabel = document.getElementById('strategy-explanation-label');
  const expView = document.getElementById('modal_explanation_view');
  const codeTitle = document.getElementById('modal-code-title');

  if (strategyKey === 'brute_force') {
    if (expLabel) expLabel.innerText = '🐢 Brute Force Explanation & Complexity';
    if (codeTitle) codeTitle.innerText = '🐢 Brute Force Code Implementation';
    if (expView) expView.innerText = currentApproaches.brute_force || currentApproaches.bruteForce || 'No brute force explanation provided.';
  } else {
    if (expLabel) expLabel.innerText = '⚡ Optimal Approach Explanation & Complexity';
    if (codeTitle) codeTitle.innerText = '⚡ Optimal Code Implementation';
    if (expView) expView.innerText = currentApproaches.optimal || 'No optimal approach explanation provided.';
  }

  updateModalCodeDisplay();
}

// Language selector inside Modal
function switchModalLang(lang) {
  activeModalLang = lang;

  const cppBtn = document.getElementById('lang-btn-cpp');
  const pyBtn = document.getElementById('lang-btn-python');
  const javaBtn = document.getElementById('lang-btn-java');

  if (cppBtn) cppBtn.classList.toggle('active', lang === 'cpp');
  if (pyBtn) pyBtn.classList.toggle('active', lang === 'python');
  if (javaBtn) javaBtn.classList.toggle('active', lang === 'java');

  updateModalCodeDisplay();
}

// Update Code Display in Modal
function updateModalCodeDisplay() {
  const codeElem = document.getElementById('modal_code_display');
  if (!codeElem) return;

  let codeText = '';

  if (currentSolutions[activeStrategy] && typeof currentSolutions[activeStrategy] === 'object') {
    codeText = currentSolutions[activeStrategy][activeModalLang];
  } else if (currentSolutions[activeModalLang]) {
    codeText = currentSolutions[activeModalLang];
  }

  if (!codeText || codeText.trim() === '') {
    codeText = `// No ${activeStrategy === 'brute_force' ? 'brute force' : 'optimal'} ${activeModalLang.toUpperCase()} solution available.`;
  }

  codeElem.innerText = codeText;
}

// Copy Code from Modal
function copyModalCode() {
  const codeElem = document.getElementById('modal_code_display');
  if (!codeElem) return;

  const codeText = codeElem.innerText;
  if (!codeText || codeText.includes('Select a strategy') || codeText.includes('Loading')) return;

  if (typeof copyTextToClipboard === 'function') {
    copyTextToClipboard(codeText, () => {
      const btn = document.getElementById('modal-copy-code-btn');
      if (btn) {
        const origContent = btn.innerHTML;
        btn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        `;
        btn.classList.add('copied');
        if (typeof showToast === 'function') showToast('Code implementation copied!');
        setTimeout(() => {
          btn.innerHTML = origContent;
          btn.classList.remove('copied');
        }, 2000);
      }
    });
  }
}