// ── STORAGE ──
const STORAGE_KEY = 'workflow_pwa_data';

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveData(workflows) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
  } catch (e) {
    console.warn('Storage save failed:', e);
  }
}

// ── DEFAULT WORKFLOWS ──
const DEFAULTS = [
  {
    id: 'wf_daily', icon: '📊', name: 'Daily Bookkeeping', freq: 'Daily',
    steps: [
      { text: 'Check and record all receipts and invoices received', note: 'Keep physical + digital copies' },
      { text: 'Record sales transactions for the day' },
      { text: 'Record purchases and expenses' },
      { text: 'Check cash on hand vs. recorded balance', note: 'Report any discrepancy immediately' },
      { text: 'Update accounts payable and receivable logs' },
      { text: 'Save and back up all files for the day' }
    ],
    checked: {}
  },
  {
    id: 'wf_recon', icon: '🏦', name: 'Bank Reconciliation', freq: 'Monthly',
    steps: [
      { text: 'Download/print the bank statement for the period' },
      { text: 'Compare opening balance with last month\'s closing balance' },
      { text: 'Match each bank transaction to the books entry by entry' },
      { text: 'List outstanding checks not yet cleared by the bank' },
      { text: 'List deposits in transit not yet reflected in bank', note: 'Common source of discrepancies' },
      { text: 'Identify and record bank charges, fees, and interest' },
      { text: 'Adjust book balance for any unrecorded items' },
      { text: 'Confirm adjusted bank balance = adjusted book balance' },
      { text: 'Document the completed reconciliation and file it' }
    ],
    checked: {}
  },
  {
    id: 'wf_ap', icon: '🧾', name: 'Accounts Payable Processing', freq: 'As needed',
    steps: [
      { text: 'Receive and log the supplier invoice' },
      { text: 'Verify invoice details match PO or delivery receipt', note: '3-way match: PO + DR + Invoice' },
      { text: 'Code the expense to the correct account' },
      { text: 'Route invoice for approval if required' },
      { text: 'Schedule payment based on due date' },
      { text: 'Process payment and record in the books' },
      { text: 'File the paid invoice with proof of payment' }
    ],
    checked: {}
  },
  {
    id: 'wf_ar', icon: '💰', name: 'Accounts Receivable Collection', freq: 'Weekly',
    steps: [
      { text: 'Print or open the AR aging report' },
      { text: 'Flag invoices that are 30, 60, and 90+ days overdue' },
      { text: 'Send statement of account to overdue clients', note: 'Be professional and firm' },
      { text: 'Follow up by call or message for no-response accounts' },
      { text: 'Record any partial or full payments received' },
      { text: 'Update the AR ledger and aging schedule' }
    ],
    checked: {}
  }
];

// ── STATE ──
let workflows = loadData() || JSON.parse(JSON.stringify(DEFAULTS));
let openStates = {};
let stepInputCount = 0;
let deferredInstallPrompt = null;

// ── PWA INSTALL ──
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstallPrompt = e;
  document.getElementById('installBanner').classList.add('visible');
});

function installApp() {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  deferredInstallPrompt.userChoice.then(() => {
    deferredInstallPrompt = null;
    dismissInstall();
  });
}

function dismissInstall() {
  document.getElementById('installBanner').classList.remove('visible');
}

// ── RENDER ──
function render() {
  const list = document.getElementById('workflowList');

  if (workflows.length === 0) {
    list.innerHTML = '<div class="empty-hint">No workflows yet.<br>Add your first one below ↓</div>';
    return;
  }

  list.innerHTML = '';
  workflows.forEach(wf => {
    const total = wf.steps.length;
    const done = Object.values(wf.checked || {}).filter(Boolean).length;
    const isOpen = !!openStates[wf.id];
    const allDone = total > 0 && done === total;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    const card = document.createElement('div');
    card.className = 'workflow-card';

    let stepsHtml = '';
    if (isOpen) {
      stepsHtml = wf.steps.map((s, i) => {
        const isChecked = !!(wf.checked || {})[i];
        return `
          <div class="step-row">
            <div class="step-num">${i + 1}.</div>
            <div class="step-check ${isChecked ? 'checked' : ''}"
                 onclick="toggleStep('${wf.id}', ${i})"></div>
            <div class="step-text-wrap">
              <div class="step-text ${isChecked ? 'done' : ''}">${esc(s.text)}</div>
              ${s.note ? `<div class="step-note">💡 ${esc(s.note)}</div>` : ''}
            </div>
          </div>`;
      }).join('');
    }

    card.innerHTML = `
      <div class="workflow-header ${isOpen ? 'open' : ''}" onclick="toggleWf('${wf.id}')">
        <div class="wf-icon">${wf.icon}</div>
        <div class="wf-title-group">
          <div class="wf-title">${esc(wf.name)}</div>
          <div class="wf-sub">${esc(wf.freq)} · ${total} step${total !== 1 ? 's' : ''}</div>
        </div>
        <div class="wf-badge ${allDone ? 'all-done' : ''}">${done}/${total}</div>
        <button class="delete-wf-btn" onclick="deleteWf(event,'${wf.id}')" title="Delete workflow">✕</button>
        <span class="wf-chevron ${isOpen ? 'open' : ''}">▶</span>
      </div>
      ${isOpen ? `
        <div class="steps-body open">
          <div class="progress-wrap">
            <div class="progress-bar-bg">
              <div class="progress-bar-fill ${allDone ? 'complete' : ''}" style="width:${pct}%"></div>
            </div>
          </div>
          ${stepsHtml}
          <button class="reset-btn" onclick="resetWf(event,'${wf.id}')">↺ Reset checklist</button>
        </div>` : ''}
    `;

    list.appendChild(card);
  });
}

// ── ACTIONS ──
function toggleWf(id) {
  openStates[id] = !openStates[id];
  render();
}

function toggleStep(id, idx) {
  const wf = workflows.find(w => w.id === id);
  if (!wf) return;
  if (!wf.checked) wf.checked = {};
  wf.checked[idx] = !wf.checked[idx];
  saveData(workflows);

  const total = wf.steps.length;
  const done = Object.values(wf.checked).filter(Boolean).length;
  if (done === total) showToast(`✓ ${wf.name} complete!`);

  render();
}

function resetWf(e, id) {
  e.stopPropagation();
  const wf = workflows.find(w => w.id === id);
  if (!wf) return;
  wf.checked = {};
  saveData(workflows);
  render();
}

function deleteWf(e, id) {
  e.stopPropagation();
  if (!confirm('Delete this workflow?')) return;
  workflows = workflows.filter(w => w.id !== id);
  delete openStates[id];
  saveData(workflows);
  render();
}

// ── ADD WORKFLOW ──
function addStepInput(text = '', note = '') {
  stepInputCount++;
  const list = document.getElementById('stepsInputList');
  const row = document.createElement('div');
  row.className = 'step-input-row';

  const num = list.children.length + 1;
  row.innerHTML = `
    <span class="step-input-num">${num}.</span>
    <div style="flex:1;display:flex;flex-direction:column;gap:3px">
      <input type="text" placeholder="Describe this step…" value="${esc(text)}" class="step-main-input">
      <input type="text" placeholder="Tip / note (optional)" value="${esc(note)}" class="step-note-input">
    </div>
    <button class="remove-step-btn" onclick="removeStep(this)" title="Remove step">✕</button>
  `;
  list.appendChild(row);
  renumberSteps();
}

function removeStep(btn) {
  btn.closest('.step-input-row').remove();
  renumberSteps();
}

function renumberSteps() {
  document.querySelectorAll('#stepsInputList .step-input-row').forEach((r, i) => {
    r.querySelector('.step-input-num').textContent = (i + 1) + '.';
  });
}

function saveWorkflow() {
  const name = document.getElementById('newName').value.trim();
  const icon = document.getElementById('newIcon').value;
  const freq = document.getElementById('newFreq').value;
  const rows = document.querySelectorAll('#stepsInputList .step-input-row');

  if (!name) { showToast('⚠ Enter a workflow name'); return; }
  if (rows.length === 0) { showToast('⚠ Add at least one step'); return; }

  const steps = [];
  let valid = true;
  rows.forEach(r => {
    const t = r.querySelector('.step-main-input').value.trim();
    const n = r.querySelector('.step-note-input').value.trim();
    if (!t) { valid = false; return; }
    steps.push({ text: t, note: n });
  });

  if (!valid) { showToast('⚠ Fill in all step descriptions'); return; }

  const newWf = {
    id: 'wf_' + Date.now(),
    icon, name, freq, steps, checked: {}
  };

  workflows.push(newWf);
  openStates[newWf.id] = true;
  saveData(workflows);
  render();

  // Reset form
  document.getElementById('newName').value = '';
  document.getElementById('stepsInputList').innerHTML = '';
  stepInputCount = 0;
  addStepInput(); // one blank ready

  showToast('✓ Workflow saved!');
  document.getElementById('workflowList').scrollIntoView({ behavior: 'smooth' });
}

// ── UTILS ──
function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ── CLOCK ──
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const el = document.getElementById('clockDisplay');
  if (el) el.innerHTML = `${days[now.getDay()]}  ${h}:${m}<br>Accounting Edition`;
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  updateClock();
  setInterval(updateClock, 30000);
  addStepInput(); // start with one blank step input
  render();
});
