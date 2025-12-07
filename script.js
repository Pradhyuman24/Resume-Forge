document.addEventListener('DOMContentLoaded', () => {

  // ---------------- Utilities ----------------
  const $ = sel => document.querySelector(sel);
  const safe = str => {
    if (str === undefined || str === null) return '';
    return String(str).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  };
  const debounce = (fn, t = 300) => {
    let id;
    return (...a) => { clearTimeout(id); id = setTimeout(() => fn(...a), t); };
  };

  // ---------------- State ----------------
  let state = {
    template: 'modern',
    color: '#4f46e5',
    font: 'Inter',
    spacing: 1,
    zoom: 1,
    autoSave: true,
    profileImage: '',
    data: {
      name: '', title: '', email: '', phone: '', link: '',
      skills: '', summary: '',
      experiences: [], projects: [], educations: []
    }
  };

  // ---------------- DOM Elements ----------------
  const dom = {
    form: $('#resumeForm'),
    preview: $('#resumePreview'),
    template: $('#templateSelector'),
    color: $('#colorPicker'),
    font: $('#fontSelector'),
    spacing: $('#spacingRange'),
    zoomIn: $('#zoomIn'),
    zoomOut: $('#zoomOut'),
    zoomVal: $('#zoomVal'),
    imgInput: $('#imageInput'),
    avatarImg: $('#avatarImg'),
    avatarName: $('#avatarName'),
    removeImg: $('#removeImg'),
    expList: $('#experiences'),
    projList: $('#projects'),
    eduList: $('#educations'),
    jsonInput: $('#jsonInput')
  };

  // ---------------- Render Function ----------------
  function render() {
    const d = state.data;
    const t = state.template;
    const col = state.color;
    const fnt = state.font;
    
    // Apply Global Vars to CSS
    dom.preview.className = `resume ${t}`;
    dom.preview.style.fontFamily = fnt;
    dom.preview.style.setProperty('--accent', col);
    
    // Calculate density
    const gap = 12 + (parseFloat(state.spacing) * 6);
    const fontSize = 13 + (parseFloat(state.spacing) * 0.5);
    dom.preview.style.setProperty('--gap', `${gap}px`);
    
    let html = '';
    const imgTag = state.profileImage ? `<img class="profile-pic" src="${state.profileImage}" alt="Profile">` : '';

    // Helper: Skills
    const skillsMarkup = d.skills.split(',').filter(x => x.trim()).map(x => `<span class="skill-tag">${safe(x.trim())}</span>`).join('');
    
    // Helper: List Generator
    const renderList = (arr, type) => arr.map(item => {
      const h = safe(item.head || item.company || item.name || item.school);
      const sub = safe(item.sub || item.position || item.degree);
      const txt = safe(item.desc || '');
      return `
        <div class="item" style="margin-bottom:${gap}px">
          <h4>${h}</h4>
          <div class="sub" style="color:${col}">${sub}</div>
          <p style="font-size:${fontSize}px">${txt.replace(/\n/g, '<br>')}</p>
        </div>
      `;
    }).join('');

    // --- Template Logic ---
    
    // 1. Modern Split
    if (t === 'modern') {
      html = `
        <div class="left">
          ${imgTag}
          <div style="margin-top:20px;text-align:center">
             <h2>Contact</h2>
             <div style="font-size:12px;margin-bottom:5px">${safe(d.email)}</div>
             <div style="font-size:12px;margin-bottom:5px">${safe(d.phone)}</div>
             <div style="font-size:12px">${safe(d.link)}</div>
          </div>
          <div style="margin-top:30px;text-align:center">
             <h2>Education</h2>
             ${renderList(d.educations)}
          </div>
          <div style="margin-top:30px;text-align:center">
             <h2>Skills</h2>
             <div>${skillsMarkup}</div>
          </div>
        </div>
        <div class="right">
          <div style="border-bottom:2px solid ${col};padding-bottom:15px;margin-bottom:20px">
            <h1>${safe(d.name || 'Your Name')}</h1>
            <div class="job-title">${safe(d.title)}</div>
            <p>${safe(d.summary)}</p>
          </div>
          <h2>Experience</h2>
          ${renderList(d.experiences)}
          <h2 style="margin-top:30px">Projects</h2>
          ${renderList(d.projects)}
        </div>
      `;
    }
    // 2. Classic
    else if (t === 'classic' || t === 'minimal' || t === 'ats') {
      // General single column layout
      html = `
        <div style="text-align:center;border-bottom:1px solid #ddd;padding-bottom:20px;margin-bottom:20px">
          ${t !== 'ats' ? imgTag : ''}
          <h1 style="color:${t==='ats'?'black':col}">${safe(d.name)}</h1>
          <div class="job-title">${safe(d.title)}</div>
          <div style="font-size:12px;color:#666">${safe(d.email)} | ${safe(d.phone)} | ${safe(d.link)}</div>
        </div>
        
        <h2>Summary</h2>
        <p>${safe(d.summary)}</p>
        
        <h2>Experience</h2>
        ${renderList(d.experiences)}
        
        <h2>Projects</h2>
        ${renderList(d.projects)}
        
        <h2>Education</h2>
        ${renderList(d.educations)}
        
        <h2>Skills</h2>
        <div>${skillsMarkup}</div>
      `;
    } 
    // 3. Fallback for others (Simplified for brevity, but functional)
    else {
      html = `
        <div style="padding:40px">
          ${imgTag}
          <h1 style="color:${col}">${safe(d.name)}</h1>
          <div class="job-title">${safe(d.title)}</div>
          <hr style="border-color:${col};margin:20px 0">
          <div style="display:flex;gap:15px;font-size:12px;margin-bottom:20px">
            <span>${safe(d.email)}</span><span>${safe(d.phone)}</span><span>${safe(d.link)}</span>
          </div>
          
          <h2>Summary</h2>
          <p>${safe(d.summary)}</p>
          
          <div style="display:grid;grid-template-columns:1fr;gap:20px;margin-top:20px">
             <div><h2>Experience</h2>${renderList(d.experiences)}</div>
             <div><h2>Projects</h2>${renderList(d.projects)}</div>
          </div>
          
          <div style="margin-top:20px"><h2>Skills</h2>${skillsMarkup}</div>
        </div>
      `;
    }

    dom.preview.innerHTML = html;
    saveState();
  }

  // ---------------- Data Management ----------------
  
  // Generic helper to create input fields
  function createEntryHTML(type, data, index) {
    const h = safe(data.head || data.company || data.name || data.school || '');
    const s = safe(data.sub || data.position || data.degree || '');
    const t = safe(data.desc || '');
    
    const div = document.createElement('div');
    div.className = 'entry';
    div.innerHTML = `
      <div class="row">
        <input class="e-head small" placeholder="Company/Project" value="${h}">
        <input class="e-sub small" placeholder="Role/Degree" value="${s}">
      </div>
      <textarea class="e-desc" rows="2" placeholder="Description" style="width:100%;margin-top:5px">${t}</textarea>
      <div class="entry-actions">
        <button type="button" class="ghost" onclick="moveItem('${type}', ${index}, -1)">⬆</button>
        <button type="button" class="ghost" onclick="moveItem('${type}', ${index}, 1)">⬇</button>
        <button type="button" class="ghost" style="color:#ef4444" onclick="deleteItem('${type}', ${index})">Delete</button>
      </div>
    `;
    
    // Bind Events immediately
    const inputs = div.querySelectorAll('input, textarea');
    inputs.forEach(inp => {
      inp.addEventListener('input', () => {
        // Update State Directly
        data.head = div.querySelector('.e-head').value;
        data.sub = div.querySelector('.e-sub').value;
        data.desc = div.querySelector('.e-desc').value;
        
        // Map back to specific keys for backward compat if needed
        if(type==='experiences') { data.company = data.head; data.position = data.sub; }
        if(type==='projects') { data.name = data.head; }
        if(type==='educations') { data.school = data.head; data.degree = data.sub; }
        
        render(); // Debounce happens in render call if needed, but direct is fine here
      });
    });
    
    return div;
  }

  // Refresh the UI lists based on state.data
  function refreshLists() {
    dom.expList.innerHTML = '';
    state.data.experiences.forEach((item, i) => dom.expList.appendChild(createEntryHTML('experiences', item, i)));
    
    dom.projList.innerHTML = '';
    state.data.projects.forEach((item, i) => dom.projList.appendChild(createEntryHTML('projects', item, i)));
    
    dom.eduList.innerHTML = '';
    state.data.educations.forEach((item, i) => dom.eduList.appendChild(createEntryHTML('educations', item, i)));
  }

  // Global functions for inline onclick handlers
  window.deleteItem = (type, index) => {
    state.data[type].splice(index, 1);
    refreshLists();
    render();
  };
  
  window.moveItem = (type, index, direction) => {
    const arr = state.data[type];
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < arr.length) {
      [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]]; // Swap
      refreshLists();
      render();
    }
  };

  // ---------------- Add Buttons ----------------
  $('#addExperience').onclick = () => { state.data.experiences.push({company:'New Company', position:'Role', desc:''}); refreshLists(); render(); };
  $('#addProject').onclick = () => { state.data.projects.push({name:'New Project', desc:'Details...'}); refreshLists(); render(); };
  $('#addEducation').onclick = () => { state.data.educations.push({school:'University', degree:'Degree', desc:''}); refreshLists(); render(); };

  // ---------------- Input Bindings ----------------
  const bindTxt = (id, key) => {
    const el = $(id);
    if(el) el.addEventListener('input', (e) => { state.data[key] = e.target.value; render(); });
  };
  bindTxt('#nameField', 'name');
  bindTxt('#titleField', 'title');
  bindTxt('#emailField', 'email');
  bindTxt('#phoneField', 'phone');
  bindTxt('#linkField', 'link');
  bindTxt('#skillsInput', 'skills');
  bindTxt('#summaryField', 'summary');

  // Style Inputs
  dom.template.addEventListener('change', e => { state.template = e.target.value; render(); });
  dom.color.addEventListener('input', e => { state.color = e.target.value; render(); });
  dom.font.addEventListener('change', e => { state.font = e.target.value; render(); });
  dom.spacing.addEventListener('input', e => { state.spacing = e.target.value; render(); });

  // ---------------- Image Handling ----------------
  $('#uploadLabel').onclick = () => dom.imgInput.click();
  dom.imgInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        state.profileImage = ev.target.result;
        dom.avatarImg.src = state.profileImage;
        dom.avatarImg.style.display = 'block';
        dom.avatarName.textContent = file.name;
        dom.removeImg.style.display = 'block';
        render();
      };
      reader.readAsDataURL(file);
    }
  });
  dom.removeImg.onclick = (e) => {
    e.stopPropagation();
    state.profileImage = '';
    dom.avatarImg.src = '';
    dom.avatarImg.style.display = 'none';
    dom.avatarName.textContent = 'No image';
    dom.removeImg.style.display = 'none';
    dom.imgInput.value = '';
    render();
  };

  // ---------------- AI & Utilities ----------------
  $('#generateAI').onclick = () => {
    const btn = $('#generateAI');
    const originalText = btn.innerHTML;
    const title = state.data.title;
    if(!title) return alert('Please enter a Job Title first.');
    
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Writing...';
    btn.disabled = true;
    
    // Simulate AI
    setTimeout(() => {
      state.data.summary = `Passionate ${title} with experience in ${state.data.skills || 'industry standards'}. Proven track record of delivering results and improving processes. Adept at collaborating with cross-functional teams to drive project success.`;
      $('#summaryField').value = state.data.summary;
      render();
      btn.innerHTML = originalText;
      btn.disabled = false;
    }, 1000);
  };

  $('#insertDefault').onclick = () => {
    state.data = {
      name: 'Alex Morgan', title: 'Senior Product Designer', email: 'alex@example.com', phone: '+1 (555) 0199', link: 'linkedin.com/in/alexmorgan',
      skills: 'Figma, Adobe XD, HTML/CSS, User Research, Prototyping',
      summary: 'Creative designer with 6+ years of experience in building user-centric digital products. Expert in translating business requirements into intuitive interfaces.',
      experiences: [
        {company:'TechFlow Inc.', position:'Lead UX Designer', desc:'Led the redesign of the core SaaS platform, increasing user retention by 25%.'},
        {company:'Creative Studio', position:'UI Designer', desc:'Designed marketing assets and websites for Fortune 500 clients.'}
      ],
      projects: [{name:'E-Commerce App', desc:'Designed a mobile-first shopping experience with 4.8 star rating.'}],
      educations: [{school:'Design Institute', degree:'BFA Interaction Design'}]
    };
    // Update inputs
    $('#nameField').value = state.data.name;
    $('#titleField').value = state.data.title;
    $('#emailField').value = state.data.email;
    $('#phoneField').value = state.data.phone;
    $('#linkField').value = state.data.link;
    $('#skillsInput').value = state.data.skills;
    $('#summaryField').value = state.data.summary;
    refreshLists();
    render();
  };

  // ---------------- Persistence & Backup ----------------
  function saveState() {
    if(state.autoSave) {
      localStorage.setItem('resumeForge_v2', JSON.stringify({ state: state }));
      $('#lastSaved').textContent = '(saved ' + new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) + ')';
    }
  }

  function loadState() {
    const raw = localStorage.getItem('resumeForge_v2');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if(parsed.state) {
          state = { ...state, ...parsed.state }; // Merge
          // Restore inputs
          $('#nameField').value = state.data.name || '';
          $('#titleField').value = state.data.title || '';
          $('#emailField').value = state.data.email || '';
          $('#phoneField').value = state.data.phone || '';
          $('#linkField').value = state.data.link || '';
          $('#skillsInput').value = state.data.skills || '';
          $('#summaryField').value = state.data.summary || '';
          
          if(state.profileImage) {
             dom.avatarImg.src = state.profileImage;
             dom.avatarImg.style.display='block';
             dom.removeImg.style.display='block';
          }
          
          dom.template.value = state.template;
          dom.color.value = state.color;
          dom.font.value = state.font;
          dom.spacing.value = state.spacing;
        }
      } catch(e) { console.error('Load failed', e); }
    }
    refreshLists();
    render();
  }

  $('#clearLocal').onclick = () => {
    if(confirm('Are you sure? This deletes local data.')) {
      localStorage.removeItem('resumeForge_v2');
      location.reload();
    }
  };

  $('#saveLocal').onclick = () => {
    state.autoSave = !state.autoSave;
    $('#saveLocal').textContent = state.autoSave ? 'Auto-Save: On' : 'Auto-Save: Off';
  };
  
  // JSON Backup/Restore
  $('#backupData').onclick = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = "resume-backup.json";
    a.click();
  };
  
  $('#restoreDataBtn').onclick = () => dom.jsonInput.click();
  dom.jsonInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        state = imported;
        // Re-populate everything
        $('#nameField').value = state.data.name;
        // ... (simplified: reloading page is easiest to trigger full re-bind, but lets just call loadState logic)
        localStorage.setItem('resumeForge_v2', JSON.stringify({state: state}));
        location.reload(); 
      } catch(err) { alert('Invalid JSON file'); }
    };
    reader.readAsText(file);
  });

  // ---------------- Export ----------------
  $('#downloadPDF').onclick = () => window.print();
  $('#exportPNG').onclick = () => {
    alert('For PNG, please use a screenshot tool for best quality, or stick to PDF for print.');
    // html2canvas implementation omitted for brevity/reliability, standard Print to PDF is preferred.
  };

  // ---------------- UI Toggles ----------------
  $('#themeBtn').onclick = () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    $('#themeBtn').innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  };
  
  $('#collapseBtn').onclick = () => {
    const sb = document.querySelector('.sidebar');
    const btn = $('#collapseBtn i');
    const isMobile = window.innerWidth <= 850;
    
    // Determine target width based on screen size
    const targetWidth = isMobile ? '100%' : '400px';

    if (sb.style.width === '0px' || sb.style.display === 'none') {
      sb.style.width = targetWidth;
      sb.style.padding = '20px';
      sb.style.display = 'flex'; // Ensure it's visible
      btn.classList.replace('fa-chevron-right', 'fa-chevron-left');
    } else {
      sb.style.width = '0px';
      sb.style.padding = '0px';
      // distinct timeout to hide it after transition if needed, 
      // or simply rely on CSS overflow hidden
      btn.classList.replace('fa-chevron-left', 'fa-chevron-right');
    }
  };


  // Zoom
  const updateZoom = () => {
    dom.zoomVal.textContent = Math.round(state.zoom * 100) + '%';
    dom.preview.style.transform = `scale(${state.zoom})`;
  };
  dom.zoomIn.onclick = () => { state.zoom = Math.min(1.5, state.zoom + 0.1); updateZoom(); };
  dom.zoomOut.onclick = () => { state.zoom = Math.max(0.5, state.zoom - 0.1); updateZoom(); };

  // Init
  loadState();
});

