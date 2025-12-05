// Clean separated JS for ResumeForge (Option B)
// Assumes: index.html IDs exist exactly as provided

// ---------------- Utilities ----------------
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const safe = str => {
  if (str === undefined || str === null) return '';
  return String(str).replace(/[&<>'"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]));
};
function debounce(fn, t=250){ let id; return (...a)=>{ clearTimeout(id); id=setTimeout(()=>fn(...a), t); }; }

// ---------------- State ----------------
const state = {
  profileImage: '',
  autoSave: true,
  zoom: 1,
  template: 'modern'
};

// ---------------- Elements ----------------
const form = $('#resumeForm');
const resumePreview = $('#resumePreview');
const templateSelector = $('#templateSelector');
const themeBtn = $('#themeBtn');
const imageInput = $('#imageInput');
const uploadLabel = $('#uploadLabel');
const avatarImg = $('#avatarImg');
const avatarName = $('#avatarName');
const skillsInput = $('#skillsInput');
const summaryField = $('#summaryField');
const saveLocalBtn = $('#saveLocal');
const clearLocalBtn = $('#clearLocal');
const lastSaved = $('#lastSaved');
const expContainer = $('#experiences');
const projContainer = $('#projects');
const eduContainer = $('#educations');
const zoomIn = $('#zoomIn');
const zoomOut = $('#zoomOut');
const zoomVal = $('#zoomVal');
const downloadPDF = $('#downloadPDF');
const exportPNG = $('#exportPNG');
const generateAI = $('#generateAI');
const insertDefault = $('#insertDefault');

// ---------------- Dynamic entry creators ----------------
function makeExpEntry(data={company:'Company',position:'Role',desc:'Achievements and responsibilities'}) {
  const wrap = document.createElement('div');
  wrap.className = 'entry';
  wrap.innerHTML = `
    <div class="row" style="gap:8px;margin-bottom:8px">
      <input placeholder="Company" class="exp-company" value="${safe(data.company||'')}">
      <input placeholder="Role" class="exp-role" value="${safe(data.position||'')}">
    </div>
    <textarea class="exp-desc" rows="2" placeholder="Description">${safe(data.desc||'')}</textarea>
    <div style="display:flex;gap:8px;margin-top:8px"><button class="ghost exp-del" type="button">Delete</button></div>
  `;
  wrap.querySelector('.exp-del').addEventListener('click', ()=>{ wrap.remove(); render(); saveIfNeeded(); });
  wrap.querySelectorAll('input,textarea').forEach(el=>el.addEventListener('input', debounce(()=>{ render(); saveIfNeeded(); },250)));
  return wrap;
}
function makeProjectEntry(data={name:'Project',desc:'Details'}) {
  const wrap = document.createElement('div'); wrap.className='entry';
  wrap.innerHTML = `
    <input placeholder="Project name" class="proj-name" value="${safe(data.name||'')}">
    <textarea class="proj-desc" rows="2" placeholder="Description">${safe(data.desc||'')}</textarea>
    <div style="display:flex;gap:8px;margin-top:8px"><button class="ghost proj-del" type="button">Delete</button></div>
  `;
  wrap.querySelector('.proj-del').addEventListener('click', ()=>{ wrap.remove(); render(); saveIfNeeded(); });
  wrap.querySelectorAll('input,textarea').forEach(el=>el.addEventListener('input', debounce(()=>{ render(); saveIfNeeded(); },250)));
  return wrap;
}
function makeEduEntry(data={school:'School',degree:'Degree'}) {
  const wrap = document.createElement('div'); wrap.className='entry';
  wrap.innerHTML = `
    <input placeholder="University / School" class="edu-school" value="${safe(data.school||'')}">
    <input placeholder="Degree & Year" class="edu-degree" value="${safe(data.degree||'')}">
    <div style="display:flex;gap:8px;margin-top:8px"><button class="ghost edu-del" type="button">Delete</button></div>
  `;
  wrap.querySelector('.edu-del').addEventListener('click', ()=>{ wrap.remove(); render(); saveIfNeeded(); });
  wrap.querySelectorAll('input').forEach(el=>el.addEventListener('input', debounce(()=>{ render(); saveIfNeeded(); },250)));
  return wrap;
}

// ---------------- Wiring events ----------------
themeBtn.addEventListener('click', ()=>{ document.body.classList.toggle('dark-mode'); themeBtn.querySelector('i').classList.toggle('fa-sun'); themeBtn.querySelector('i').classList.toggle('fa-moon'); });

$('#collapseBtn').addEventListener('click', ()=>{ const aside = document.querySelector('aside'); if(aside.style.display!=='none'){ aside.style.display='none'; document.querySelector('.preview-wrap').style.flex='1 1 auto'; $('#collapseBtn i').classList.replace('fa-chevron-left','fa-chevron-right'); } else{ aside.style.display='flex'; $('#collapseBtn i').classList.replace('fa-chevron-right','fa-chevron-left'); } });

templateSelector.addEventListener('change', ()=>{ state.template = templateSelector.value; render(); saveIfNeeded(); });
$('#colorPicker').addEventListener('input', e=>{ document.documentElement.style.setProperty('--accent', e.target.value); render(); saveIfNeeded(); });
$('#fontSelector').addEventListener('change', e=>{ document.body.style.fontFamily = e.target.value+ ', Inter, system-ui'; render(); saveIfNeeded(); });

uploadLabel.addEventListener('click', ()=> imageInput.click());
imageInput.addEventListener('change', ev=> handleFiles(ev.target.files));
function handleFiles(files){ const f = files[0]; if(!f) return; const reader = new FileReader(); reader.onload = e=>{ state.profileImage = e.target.result; avatarImg.src = state.profileImage; avatarImg.style.display='block'; avatarName.textContent = f.name; render(); saveIfNeeded(); }; reader.readAsDataURL(f); }
uploadLabel.addEventListener('dragover', e=>{ e.preventDefault(); uploadLabel.style.opacity=.8; });
uploadLabel.addEventListener('dragleave', e=>{ uploadLabel.style.opacity=1; });
uploadLabel.addEventListener('drop', e=>{ e.preventDefault(); uploadLabel.style.opacity=1; const dt = e.dataTransfer; if(dt && dt.files && dt.files.length) handleFiles(dt.files); });

saveLocalBtn.addEventListener('click', ()=>{ state.autoSave = !state.autoSave; saveLocalBtn.textContent = state.autoSave ? 'Auto-Save: On' : 'Auto-Save: Off'; if(state.autoSave) saveIfNeeded(); });
clearLocalBtn.addEventListener('click', ()=>{ localStorage.removeItem('resumeForge_v1'); lastSaved.textContent='(cleared)'; });

$('#addExperience').addEventListener('click', ()=>{ expContainer.appendChild(makeExpEntry({})); render(); saveIfNeeded(); });
$('#addProject').addEventListener('click', ()=>{ projContainer.appendChild(makeProjectEntry({})); render(); saveIfNeeded(); });
$('#addEducation').addEventListener('click', ()=>{ eduContainer.appendChild(makeEduEntry({})); render(); saveIfNeeded(); });

generateAI.addEventListener('click', ()=> {
  const title = $('#titleField').value.trim(); const skills = $('#skillsInput').value.trim();
  if(!title || !skills){ alert('Please enter a job title and some skills to generate.'); return; }
  const btn = generateAI; const orig = btn.innerHTML; btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Writing...'; btn.disabled = true;
  setTimeout(()=>{ const s = `Experienced ${title} skilled in ${skills}. Focused on delivering high-quality solutions that drive measurable results. Strong collaborator, problem solver, and fast learner.`; summaryField.value = s; render(); btn.innerHTML = orig; btn.disabled = false; saveIfNeeded(); }, 900);
});

insertDefault.addEventListener('click', ()=>{ $('#nameField').value='Alex Morgan'; $('#titleField').value='Product Designer'; $('#emailField').value='alex@example.com'; $('#skillsInput').value='Figma, React, UX Research'; $('#summaryField').value='Creative product designer with 5+ years of experience in SaaS products.'; render(); saveIfNeeded(); });

// Zoom controls
zoomIn.addEventListener('click', ()=> changeZoom(0.1));
zoomOut.addEventListener('click', ()=> changeZoom(-0.1));
function changeZoom(delta){ state.zoom = Math.min(1.6, Math.max(0.5, +(state.zoom+delta).toFixed(2))); zoomVal.textContent = Math.round(state.zoom*100)+'%'; resumePreview.style.transform = `scale(${state.zoom})`; }

// Download/print
downloadPDF.addEventListener('click', ()=> window.print());

// PNG export (load html2canvas if needed)
exportPNG.addEventListener('click', async ()=>{
  if(!window.html2canvas){
    try {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    } catch(e) { alert('Could not load html2canvas.'); return; }
  }
  html2canvas(resumePreview, {scale:2, useCORS:true}).then(canvas=>{
    const url = canvas.toDataURL('image/png');
    const a=document.createElement('a'); a.href=url; a.download='resume.png'; a.click();
  }).catch(()=>alert('Export failed.'));
});

function loadScript(src){
  return new Promise((res, rej)=>{
    const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s);
  });
}

// ---------------- Persistence ----------------
function gatherState(){
  const data = {
    template: templateSelector.value,
    name: $('#nameField').value,
    title: $('#titleField').value,
    email: $('#emailField').value,
    phone: $('#phoneField').value,
    link: $('#linkField').value,
    skills: $('#skillsInput').value,
    summary: $('#summaryField').value,
    profileImage: state.profileImage,
    templateSkin: $('#colorPicker').value,
    font: $('#fontSelector').value,
    experiences: [],
    projects: [],
    educations: []
  };
  expContainer.querySelectorAll('.entry').forEach(e=>{ data.experiences.push({company:e.querySelector('.exp-company').value, position:e.querySelector('.exp-role').value, desc:e.querySelector('.exp-desc').value}); });
  projContainer.querySelectorAll('.entry').forEach(e=>{ data.projects.push({name:e.querySelector('.proj-name').value, desc:e.querySelector('.proj-desc').value}); });
  eduContainer.querySelectorAll('.entry').forEach(e=>{ data.educations.push({school:e.querySelector('.edu-school').value, degree:e.querySelector('.edu-degree').value}); });
  return data;
}
function saveIfNeeded(){
  if(!state.autoSave) return;
  try{ localStorage.setItem('resumeForge_v1', JSON.stringify(gatherState())); lastSaved.textContent = '(saved) '+ new Date().toLocaleTimeString(); }catch(e){ console.warn('save failed',e); }
}
function loadSaved(){
  try{
    const raw = localStorage.getItem('resumeForge_v1'); if(!raw) return false;
    const d = JSON.parse(raw);
    $('#nameField').value=d.name||''; $('#titleField').value=d.title||''; $('#emailField').value=d.email||''; $('#phoneField').value=d.phone||''; $('#linkField').value=d.link||''; $('#skillsInput').value=d.skills||''; $('#summaryField').value=d.summary||'';
    if(d.profileImage){ state.profileImage=d.profileImage; avatarImg.src=state.profileImage; avatarImg.style.display='block'; avatarName.textContent='Saved image'; }
    $('#colorPicker').value=d.templateSkin||'#4f46e5'; document.documentElement.style.setProperty('--accent', $('#colorPicker').value);
    $('#fontSelector').value=d.font||'Inter';
    expContainer.innerHTML=''; (d.experiences||[]).forEach(it=>expContainer.appendChild(makeExpEntry(it)));
    projContainer.innerHTML=''; (d.projects||[]).forEach(it=>projContainer.appendChild(makeProjectEntry(it)));
    eduContainer.innerHTML=''; (d.educations||[]).forEach(it=>eduContainer.appendChild(makeEduEntry(it)));
    templateSelector.value=d.template||'modern'; state.template=d.template||'modern';
    render();
    return true;
  }catch(e){ console.warn('load failed',e); return false; }
}

// ---------------- Render ----------------
function render(){
  const data = gatherState();
  // sanitize strings
  for(const k in data) if(typeof data[k]==='string') data[k]=safe(data[k]);
  const templ = state.template || data.template || templateSelector.value;
  resumePreview.className = 'resume '+templ;

  // Build html depending on template
  let html = '';
  function skillsHTML(list){
    return (list||'').split(',').map(s=>s.trim()).filter(Boolean).map(s=>`<span class="skill-chip">${safe(s)}</span>`).join('');
  }
  const imgHTML = state.profileImage ? `<img class="profile-pic" src="${state.profileImage}" alt="profile">` : '';

  if(templ==='modern'){
    const skills = (data.skills||'').split(',').map(s=>s.trim()).filter(Boolean).map(s=>`<span class="skill-chip">${escapeHTML(s)}</span>`).join('');
    const imgHTML = state.profileImage ? `<img class="profile-pic" src="${state.profileImage}" alt="profile">` : '';
    // left and right panel
    html = `<div class="left">
        <div style="display:flex;flex-direction:column;align-items:center">${imgHTML}<div style="height:12px"></div><div class="h1">${data.name||'Your Name'}</div><div class="job">${data.title||'Title'}</div></div>
        <div class="section"><div class="h2">Contact</div><div class="contact-item">${data.email||''}</div><div class="contact-item">${data.phone||''}</div><div class="contact-item">${data.link||''}</div></div>
        <div class="section"><div class="h2">Education</div>${(data.educations||[]).map(e=>`<div class="job-block"><h4>${escapeHTML(e.degree||'')}</h4><div>${escapeHTML(e.school||'')}</div></div>`).join('')}</div>
        <div class="section"><div class="h2">Skills</div><div>${skills}</div></div>
      </div>
      <div class="right">
        <div class="section"><div class="h2">Summary</div><div style="margin-top:6px">${data.summary||''}</div></div>
        <div class="section"><div class="h2">Experience</div>${(data.experiences||[]).map(x=>`<div class="job-block"><h4>${escapeHTML(x.position||'')}</h4><div><strong>${escapeHTML(x.company||'')}</strong></div><p style="margin-top:6px">${escapeHTML(x.desc||'')}</p></div>`).join('')}</div>
        <div class="section"><div class="h2">Projects</div>${(data.projects||[]).map(p=>`<div class="job-block"><h4>${escapeHTML(p.name||'')}</h4><p>${escapeHTML(p.desc||'')}</p></div>`).join('')}</div>
      </div>`;
  } else if(templ==='classic'){
    html = `<div style="text-align:center">${imgHTML}<div class="h1">${data.name||'Your Name'}</div><div class="job">${data.title||''}</div><div style="margin-top:8px;color:var(--muted)">${data.email||''} | ${data.phone||''} | ${data.link||''}</div></div>
      <div style="margin-top:18px"><div class="h2">Professional Summary</div><p>${data.summary||''}</p></div>
      <div style="margin-top:12px"><div class="h2">Experience</div>${(data.experiences||[]).map(x=>`<div style="margin-bottom:12px"><h4>${safe(x.position||'')}</h4><div style="color:var(--muted)">${safe(x.company||'')}</div><p>${safe(x.desc||'')}</p></div>`).join('')}</div>
      <div style="margin-top:12px"><div class="h2">Projects</div>${(data.projects||[]).map(p=>`<div style="margin-bottom:8px"><h4>${safe(p.name||'')}</h4><p>${safe(p.desc||'')}</p></div>`).join('')}</div>
      <div style="margin-top:12px"><div class="h2">Education</div>${(data.educations||[]).map(e=>`<div style="margin-bottom:8px"><h4>${safe(e.school||'')}</h4><div>${safe(e.degree||'')}</div></div>`).join('')}</div>`;
  } else if(templ==='minimal'){
    html = `<div style="text-align:center;margin-bottom:20px">${imgHTML}<div class="h1">${data.name}</div><div class="job">${data.title}</div></div>
      <div class="section"><div class="h2">Summary</div><p>${data.summary}</p></div>
      <div class="section"><div class="h2">Experience</div>${(data.experiences||[]).map(x=>`<div class='job-block'><h4>${safe(x.position)}</h4><p>${safe(x.company)}</p><p>${safe(x.desc)}</p></div>`).join('')}</div>
      <div class="section"><div class="h2">Education</div>${(data.educations||[]).map(e=>`<div class='job-block'><h4>${safe(e.school)}</h4><p>${safe(e.degree)}</p></div>`).join('')}</div>
      <div class="section"><div class="h2">Skills</div>${skillsHTML(data.skills)}</div>`;
  } else if(templ==='elegant'){
    html = `<div style='display:flex;gap:20px;align-items:center;margin-bottom:20px'>${imgHTML}<div><div class='h1'>${data.name}</div><div class='job'>${data.title}</div></div></div>
      <div class='section'><div class='h2'>Bio</div><p>${data.summary}</p></div>
      <div class='section'><div class='h2'>Work</div>${(data.experiences||[]).map(x=>`<div class='job-block' style='border-left:4px solid var(--accent);padding-left:10px'><h4>${safe(x.position)}</h4><p>${safe(x.company)}</p><p>${safe(x.desc)}</p></div>`).join('')}</div>
      <div class='section'><div class='h2'>Projects</div>${(data.projects||[]).map(p=>`<div class='job-block'><h4>${safe(p.name)}</h4><p>${safe(p.desc)}</p></div>`).join('')}</div>
      <div class='section'><div class='h2'>Education</div>${(data.educations||[]).map(e=>`<div class='job-block'><h4>${safe(e.school)}</h4><p>${safe(e.degree)}</p></div>`).join('')}</div>`;
  } else if(templ==='timeline'){
    html = `<div class='h1' style='text-align:center;margin-bottom:20px'>${data.name}</div><div class='job' style='text-align:center;margin-bottom:20px'>${data.title}</div>
      <div class='section'><div class='h2'>Career Timeline</div><div style='border-left:3px solid var(--accent);padding-left:15px'>${(data.experiences||[]).map(x=>`<div style='margin-bottom:20px'><h4>${safe(x.position)}</h4><p><strong>${safe(x.company)}</strong></p><p>${safe(x.desc)}</p></div>`).join('')}</div></div>
      <div class='section'><div class='h2'>Projects</div>${(data.projects||[]).map(p=>`<div class='job-block'><h4>${safe(p.name)}</h4><p>${safe(p.desc)}</p></div>`).join('')}</div>
      <div class='section'><div class='h2'>Education</div>${(data.educations||[]).map(e=>`<div class='job-block'><h4>${safe(e.school)}</h4><p>${safe(e.degree)}</p></div>`).join('')}</div>
      <div class='section'><div class='h2'>Skills</div>${skillsHTML(data.skills)}</div>`;
  } else if(templ==='glass'){
    html = `<div style='backdrop-filter:blur(12px);padding:40px;border-radius:20px;background:rgba(255,255,255,0.25);box-shadow:0 8px 30px rgba(0,0,0,0.15);'>
      <div class='h1' style='text-align:center;'>${data.name}</div><div class='job' style='text-align:center;'>${data.title}</div><hr style='margin:20px 0;border-color:rgba(255,255,255,0.4)'>
      <div class='section'><div class='h2'>Summary</div><p>${data.summary}</p></div>
      <div class='section'><div class='h2'>Experience</div>${(data.experiences||[]).map(e=>`<div class='job-block'><h4>${safe(e.position)}</h4><p>${safe(e.company)}</p><p>${safe(e.desc)}</p></div>`).join('')}</div>
      <div class='section'><div class='h2'>Skills</div>${skillsHTML(data.skills)}</div></div>`;
  } else if(templ==='cyber'){
    html = `<div style='background:black;color:#00ffff;padding:40px;font-family:monospace;border:3px solid #00ffff;'>
      <div style='font-size:32px;text-shadow:0 0 10px #00ffff;'>${data.name}</div>
      <div style='font-size:18px;margin-bottom:20px;color:#ff00ff;text-shadow:0 0 10px #ff00ff;'>${data.title}</div>
      <div class='section'><div class='h2'>PROFILE</div><p>${data.summary}</p></div>
      <div class='section'><div class='h2'>EXPERIENCE</div>${(data.experiences||[]).map(e=>`<div style='margin-bottom:20px;border-left:3px solid #ff00ff;padding-left:10px'><h4>${safe(e.position)}</h4><p>${safe(e.company)}</p><p>${safe(e.desc)}</p></div>`).join('')}</div>
    </div>`;
  } else if(templ==='softui'){
    html = `<div style='padding:40px;background:#e0e5ec;border-radius:20px;box-shadow:9px 9px 20px #bcbfc4,-9px -9px 20px #ffffff;'>
      <div class='h1'>${data.name}</div><div class='job'>${data.title}</div>
      <div class='section'><div class='h2'>Summary</div><p>${data.summary}</p></div>
      <div class='section'><div class='h2'>Experience</div>${(data.experiences||[]).map(e=>`<div style='background:#e0e5ec;margin-bottom:15px;padding:12px;border-radius:12px;box-shadow:inset 3px 3px 8px #bcbfc4,inset -3px -3px 8px #ffffff'><h4>${safe(e.position)}</h4><p>${safe(e.company)}</p><p>${safe(e.desc)}</p></div>`).join('')}</div>
    </div>`;
  } else if(templ==='boxed'){
    html = `<div style='display:grid;grid-template-columns:30% 70%;height:100%'>
      <div style='background:#1e293b;color:white;padding:30px;'>
        <div class='h1' style="color:white">${data.name}</div><div class='job' style="color:lightgray">${data.title}</div><hr style='margin:20px 0;border-color:#475569'>
        <h3>Contact</h3><p>${data.email}</p><p>${data.phone}</p><p>${data.link}</p><h3>Skills</h3>${(data.skills||'').split(',').map(s=>`<div>${safe(s)}</div>`).join('')}
      </div>
      <div style='padding:40px'>
        <h3>Summary</h3><p>${data.summary}</p><h3>Experience</h3>${(data.experiences||[]).map(e=>`<div><h4>${safe(e.position)}</h4><p>${safe(e.company)}</p><p>${safe(e.desc)}</p></div>`).join('')}
      </div>
    </div>`;
  } else if(templ==='ats'){
    html = `<div style='padding:30px;font-family:Arial;'><h1 style='font-size:22px;'>${data.name}</h1><p>${data.title}</p><p>${data.email} | ${data.phone} | ${data.link}</p><h2>Summary</h2><p>${data.summary}</p><h2>Experience</h2>${(data.experiences||[]).map(e=>`<div><strong>${safe(e.position)}</strong> - ${safe(e.company)}<br>${safe(e.desc)}</div>`).join('')}<h2>Skills</h2><p>${safe(data.skills)}</p></div>`;
  } else if(templ==='portfolio'){
    html = `<div style='padding:40px;font-family:Inter;'><div style='display:flex;gap:20px;align-items:center;'>${state.profileImage?`<img src='${state.profileImage}' style='width:120px;height:120px;border-radius:10px;'>`:''}<div><div class='h1'>${data.name}</div><div class='job'>${data.title}</div></div></div><h2 style='margin-top:20px'>Case Studies</h2>${(data.projects||[]).map(p=>`<div style='margin-bottom:20px;border:1px solid #ddd;padding:15px;border-radius:10px;'><h3>${safe(p.name)}</h3><p>${safe(p.desc)}</p></div>`).join('')}</div>`;
  } else if(templ==='split'){
    html = `<div style='display:grid;grid-template-columns:45% 55%;height:100%'><div style='background:#f1f1f1;padding:30px;'><div class='h1'>${data.name}</div><div class='job'>${data.title}</div><h3>Contact</h3><p>${data.email}</p><p>${data.phone}</p><h3>Skills</h3>${(data.skills||'').split(',').map(s=>`<div>${safe(s)}</div>`).join('')}</div><div style='padding:40px;'><h3>Summary</h3><p>${data.summary}</p><h3>Experience</h3>${(data.experiences||[]).map(e=>`<div><h4>${safe(e.position)}</h4><p>${safe(e.company)}</p><p>${safe(e.desc)}</p></div>`).join('')}<h3>Projects</h3>${(data.projects||[]).map(p=>`<div><h4>${safe(p.name)}</h4><p>${safe(p.desc)}</p></div>`).join('')}</div></div>`;
  } else {
    html = `<div><h2>Template not found</h2></div>`;
  }

  resumePreview.innerHTML = html;
}

// ---------------- Start-up ----------------
function ensureEntriesOnStart(){
  if(!expContainer.children.length) expContainer.appendChild(makeExpEntry({company:'Acme Inc',position:'Senior Developer',desc:'Built features and improved performance.'}));
  if(!projContainer.children.length) projContainer.appendChild(makeProjectEntry({name:'SaaS Dashboard',desc:'Delivered +30% retention.'}));
  if(!eduContainer.children.length) eduContainer.appendChild(makeEduEntry({school:'MIT',degree:'B.Sc Computer Science, 2020'}));
}
(function init(){
  ensureEntriesOnStart();
  const loaded = loadSaved();
  if(!loaded){ render(); } else { render(); }
  state.zoom = 1; zoomVal.textContent='100%'; resumePreview.style.transform = `scale(${state.zoom})`;
  // wire inputs to render
  ['#nameField','#titleField','#emailField','#phoneField','#linkField','#skillsInput','#summaryField'].forEach(s=>{
    const el = document.querySelector(s);
    if(el) el.addEventListener('input', debounce(()=>{ render(); saveIfNeeded(); },250));
  });
  // load html2canvas for quicker future export (non-blocking)
  loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js').catch(()=>{/*optional*/});
})();

// Expose for debugging
window.ResumeForge = { render, gatherState, loadSaved };
// Wait for DOM to be ready before running anything
document.addEventListener('DOMContentLoaded', () => {
    
    // ---------------- Utilities ----------------
    const $ = sel => document.querySelector(sel);
    // ... rest of your utilities ...

    // ---------------- State ----------------
    const state = {
      profileImage: '',
      autoSave: true,
      zoom: 1,
      template: 'modern'
    };

    // ---------------- Elements ----------------
    const form = $('#resumeForm');
    const resumePreview = $('#resumePreview');
    // ... rest of your const definitions ...

    // ... ALL YOUR EVENT LISTENERS HERE ...
    
    // ... ALL YOUR FUNCTIONS HERE ...

    // Start the app
    init();
});

