// app.js - frontend logic to submit reports and simulate sensor readings
// You can override API host if needed (e.g., use machine IP) by changing API_BASE
const API_BASE = 'http://127.0.0.1:5000/api'; // backend base
const SERVER_STATUS = document.getElementById('serverStatus');

// Demo / simulate offline state (useful to show 'backend unreachable' in demos)
let simulateOffline = false;
const simulateBtn = document.getElementById('simulateOfflineBtn');
const offlineBanner = document.getElementById('offlineBanner');
const onlineBanner = document.getElementById('onlineBanner');
let onlineBannerTimeout = null;
function showOnlineBanner(){
  if(!onlineBanner) return;
  onlineBanner.style.display = 'block';
  // auto-dismiss after 4 seconds
  if(onlineBannerTimeout) clearTimeout(onlineBannerTimeout);
  onlineBannerTimeout = setTimeout(()=>{ if(onlineBanner) onlineBanner.style.display = 'none'; onlineBannerTimeout = null; }, 4000);
}
function hideOnlineBanner(){ if(onlineBanner){ onlineBanner.style.display = 'none'; if(onlineBannerTimeout){ clearTimeout(onlineBannerTimeout); onlineBannerTimeout = null; } } }
function updateSimulateUI(){
  if(!simulateBtn) return;
  if(simulateOffline){
    simulateBtn.textContent = 'Simulated: offline (click to resume)';
    simulateBtn.style.background = '#fee2e2';
    simulateBtn.style.color = '#9f1239';
    if(offlineBanner) offlineBanner.style.display = 'block';
    hideOnlineBanner();
  }else{
    simulateBtn.textContent = 'Simulate offline';
    simulateBtn.style.background = '';
    simulateBtn.style.color = '';
    if(offlineBanner) offlineBanner.style.display = 'none';
  }
}
if(simulateBtn){
  simulateBtn.addEventListener('click', ()=>{
    simulateOffline = !simulateOffline;
    updateSimulateUI();
    if(simulateOffline){
      setServerStatus(false, 'Simulated offline');
    }else{
      checkHealth();
    }
  });
}

const form = document.getElementById('reportForm');
const result = document.getElementById('result');
const clearBtn = document.getElementById('clearBtn');
const reportsList = document.getElementById('reportsList');

async function fetchReports(){
  try{
    const res = await fetch(`${API_BASE}/issues`);
    if(!res.ok) throw new Error('API not available');
    const data = await res.json();
    renderReports(data);
    setServerStatus(true);
  }catch(e){
    reportsList.innerHTML = '<li class="muted">Backend not running (reports unavailable)</li>';
    setServerStatus(false, e.message);
  }
}

async function checkHealth(){
  try{
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    const ok = res.ok && data.status === 'ok' && data.db === true;
    setServerStatus(ok);
  }catch(e){
    setServerStatus(false, e.message);
  }
}

function setServerStatus(ok, errMsg){
  if(!SERVER_STATUS) return;
  // If demo-simulated offline mode is enabled, force offline UI regardless of health
  if(simulateOffline){
    SERVER_STATUS.textContent = 'Server: offline (simulated)';
    SERVER_STATUS.style.background = '#fff1f2';
    SERVER_STATUS.style.color = '#9f1239';
    SERVER_STATUS.title = errMsg || 'Simulated offline';
    // disable interactive controls when offline
    const submit = document.getElementById('submitBtn'); if(submit) submit.disabled = true;
    const sendBtn = document.getElementById('sendSensor'); if(sendBtn) sendBtn.disabled = true;
    const dl = document.getElementById('downloadData'); if(dl) dl.disabled = true;
    document.querySelectorAll('.btn.accept').forEach(b=>{ b.disabled = true; });
    const serverMsg = document.getElementById('serverMessage'); if(serverMsg){ serverMsg.style.display='inline-block'; serverMsg.innerHTML = '<strong style="color:#9f1239">Backend unreachable</strong> — Simulated offline mode'; serverMsg.style.background='#fff1f2'; serverMsg.style.color='#9f1239'; }
    if(offlineBanner) offlineBanner.style.display = 'block';
    return;
  }

  if(ok){
    SERVER_STATUS.textContent = 'Server: online';
    SERVER_STATUS.style.background = '#e6fffa';
    SERVER_STATUS.style.color = '#065f46';
    // enable controls
    document.getElementById('submitBtn').disabled = false;
    const sendBtn = document.getElementById('sendSensor'); if(sendBtn) sendBtn.disabled = false;
    const dl = document.getElementById('downloadData'); if(dl) dl.disabled = false;
    const serverMsg = document.getElementById('serverMessage'); if(serverMsg){ serverMsg.style.display='inline-block'; serverMsg.textContent = 'Backend is online'; serverMsg.style.color='#065f46'; serverMsg.style.background='#ecfdf5'; }
    if(offlineBanner) offlineBanner.style.display = 'none';
    // show temporary online banner
    if(!simulateOffline) showOnlineBanner();
  }else{
    SERVER_STATUS.textContent = 'Server: offline';
    SERVER_STATUS.style.background = '#fff1f2';
    SERVER_STATUS.style.color = '#9f1239';
    if(errMsg) SERVER_STATUS.title = errMsg;
    // disable interactive controls when offline
    const submit = document.getElementById('submitBtn'); if(submit) submit.disabled = true;
    const sendBtn = document.getElementById('sendSensor'); if(sendBtn) sendBtn.disabled = true;
    const dl = document.getElementById('downloadData'); if(dl) dl.disabled = true;
    // disable accept buttons
    document.querySelectorAll('.btn.accept').forEach(b=>{ b.disabled = true; });
    const serverMsg = document.getElementById('serverMessage'); if(serverMsg){ serverMsg.style.display='inline-block'; serverMsg.innerHTML = '<strong style="color:#9f1239">Backend unreachable</strong> — Run <code>python app.py</code> in backend'; serverMsg.style.background='#fff1f2'; serverMsg.style.color='#9f1239'; }
    if(offlineBanner) offlineBanner.style.display = 'block';
  }
}

function renderReports(items=[]){
  if(!items.length){ reportsList.innerHTML = '<li>No reports yet</li>'; return; }
  reportsList.innerHTML = items.slice().reverse().map(r => {
    const statusClass = r.status === 'verified' ? 'status-verified' : 'status-open';
    const actionBtn = r.status === 'open' ? ` <button data-ref="${r.ref_id}" class="btn accept">Accept</button>` : '';
    const viewBtn = ` <button data-ref="${r.ref_id}" class="btn view">View</button>`;
    return `<li><strong>${r.ref_id}</strong> — ${r.street} <div style="display:inline-block;margin-left:8px" class="${statusClass}">${r.status}</div> ${actionBtn}${viewBtn}</li>`;
  }).join('');

  // attach accept handlers
  document.querySelectorAll('.btn.accept').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const ref = btn.dataset.ref;
      const notes = prompt('Enter action notes (e.g., Assigned to maintenance team)');
      if(notes === null) return; // cancelled
      try{
        const res = await fetch(`${API_BASE}/issues/${ref}/accept`, {method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({action_notes: notes})});
        const data = await res.json();
        if(res.ok){
            // show suggestion box
            const sol = document.getElementById('solutionBox');
            sol.classList.remove('hidden');
            sol.innerHTML = `<strong>Issue accepted</strong><p>Ref: <code>${ref}</code></p>`;
            if(data.suggested_actions){
              sol.innerHTML += `<div class="solution-list"><strong>Suggested actions:</strong><ul>${data.suggested_actions.map(a=>`<li>${a}</li>`).join('')}</ul></div>`;
            }
            // disable the accept button
            btn.disabled = true; btn.textContent = 'Accepted';
            fetchReports();
        }else{
          alert(data.error || 'Accept failed');
        }
      }catch(err){
        alert('Backend not reachable — ensure Flask server is running.');
      }
    });
  });

  // attach view handlers
  document.querySelectorAll('.btn.view').forEach(btn => {
    btn.addEventListener('click', async () => {
      const ref = btn.dataset.ref;
      try{
        const res = await fetch(`${API_BASE}/issues/${ref}`);
        const data = await res.json();
        if(res.ok){
          const sol = document.getElementById('solutionBox');
          sol.classList.remove('hidden');
          sol.innerHTML = `<strong>Report details</strong><p><code>${data.ref_id}</code> — ${data.street}</p><p>Status: <strong>${data.status}</strong></p><p>Reported: ${new Date(data.created_at).toLocaleString()}</p>`;
          if(data.status === 'verified'){
            sol.innerHTML += `<div class="solution-list"><strong>Standard solution:</strong><ul><li>Raise priority</li><li>Assign maintenance</li><li>Schedule repair</li></ul></div>`;
          }
        }else{
          alert('Could not fetch report details');
        }
      }catch(e){
        alert('Backend unreachable — ensure Flask server is running.');
      }
    });
  });
}

function generateRef(){
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  const rnd = Math.floor(1000 + Math.random()*9000);
  return `SC-${yyyy}${mm}${dd}-${rnd}`;
}

form.addEventListener('submit', async (ev)=>{
  ev.preventDefault();
  const payload = {
    ref_id: generateRef(),
    city: document.getElementById('city').value.trim(),
    area: document.getElementById('area').value.trim(),
    street: document.getElementById('street').value.trim(),
    issue_type: document.getElementById('issueType').value.trim(),
    description: document.getElementById('description').value.trim(),
    email: document.getElementById('email').value.trim(),
    timestamp: new Date().toISOString()
  };

  // basic validation
  if(!payload.city || !payload.area || !payload.street || !payload.email){
    alert('Please fill required fields'); return;
  }

  // send to backend
  try{
    const res = await fetch(`${API_BASE}/issues`, {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)
    });
    let data = null;
    try{ data = await res.json(); }catch(e){ data = null; }
    if(res.ok){
      result.classList.remove('hidden');
      result.innerHTML = `<strong class="badge">Submitted</strong>
        <p>Reference ID: <code>${data?.ref_id ?? payload.ref_id}</code></p>
        <p>Response: <pre style="white-space:pre-wrap">${JSON.stringify(data, null, 2)}</pre></p>
        <p>We attempted to send a confirmation email to <strong>${payload.email}</strong> (check backend/emails/ for .eml files when SMTP is not configured).</p>`;
      form.reset();
      fetchReports();
    }else{
      const msg = data?.error || data?.message || 'Submission failed';
      result.classList.remove('hidden');
      result.innerHTML = `<strong style="color:#b45309">Submission failed</strong><p>${msg}</p><pre>${JSON.stringify(data, null, 2)}</pre>`;
    }
  }catch(err){
    // show clearer guidance
    result.classList.remove('hidden');
    result.innerHTML = `<strong style="color:#9f1239">Backend unreachable</strong>
      <p>Ensure the Flask server is running (backend/app.py). Try from PowerShell:</p>
      <pre>cd backend
python -m venv .venv
.\\.venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
python app.py</pre>
      <p>Error: ${err.message}</p>`;
    console.error('Fetch error:', err);
  }
});

clearBtn.addEventListener('click', ()=> form.reset());

// Sensor simulator
document.getElementById('sendSensor').addEventListener('click', async ()=>{
  const ref = document.getElementById('simRef').value.trim();
  const lux = Number(document.getElementById('lux').value);
  const timestamp = document.getElementById('timestamp').value || new Date().toISOString();
  if(!ref){ alert('Enter ref id to target a report'); return; }
  try{
    const res = await fetch(`${API_BASE}/sensor`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ref_id: ref, lux, timestamp})
    });
    const data = await res.json();
    if(res.ok){
        const sensorResult = document.getElementById('sensorResult');
        sensorResult.classList.remove('hidden');
        sensorResult.innerHTML = `<strong>Sensor Result</strong>
          <p>${data.message}</p>`;
        // Show what we sent (lux + local timestamp)
        try{
          const sentTime = new Date(timestamp).toLocaleString();
          sensorResult.innerHTML += `<p>Reading sent: <strong>${lux}</strong> lux at ${sentTime}</p>`;
        }catch(e){ /* ignore */ }
        // Show server-processed timestamp and verification flag if available
        if(data.debug){
          if(data.debug.timestamp){
            const serverTime = new Date(data.debug.timestamp).toLocaleString();
            sensorResult.innerHTML += `<p>Server processed timestamp: ${serverTime}</p>`;
          }
          if(typeof data.debug.verified !== 'undefined'){
            sensorResult.innerHTML += `<p>Verified by sensor: <strong>${data.debug.verified}</strong></p>`;
          }
        }
        if(data.suggested_actions){
          sensorResult.innerHTML += `<div class="solution-list"><strong>Suggested actions:</strong><ul>${data.suggested_actions.map(a=>`<li>${a}</li>`).join('')}</ul></div>`;
        }
        fetchReports();
    }else{
      alert(data.error || 'Sensor processing failed');
    }
  }catch(e){
      const sensorResult = document.getElementById('sensorResult');
      sensorResult.classList.remove('hidden');
      sensorResult.innerHTML = `<strong style="color:#9f1239">Backend unreachable</strong><p>Ensure Flask server is running (backend/app.py). Error: ${e.message}</p>`;
      console.error(e);
  }
});

// Initial load
fetchReports();
checkHealth();
setInterval(checkHealth, 8000);

// Download / view issues JSON
document.getElementById('downloadData').addEventListener('click', async ()=>{
  try{
    const res = await fetch(`${API_BASE}/data/issues`);
    if(!res.ok) throw new Error('Failed');
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'issues.json'; a.click();
    URL.revokeObjectURL(url);
  }catch(e){
    alert('Could not download issues JSON. Is the backend running?');
  }
});
