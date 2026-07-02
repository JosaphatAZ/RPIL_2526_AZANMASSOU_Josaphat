// ============================
// IFRI MentorLink - Frontend JS
// ============================

let allCompetences = [];

// ============================
// INIT
// ============================
document.addEventListener('DOMContentLoaded', () => {
  createParticles();
  startTypingEffect();
  animateCounters();
  loadFilieres();
  loadCompetences();
  setupAutocomplete();
  setupCardMouseGlow();

  document.getElementById('competences').addEventListener('keydown', e => {
    if (e.key === 'Enter') searchMentors();
  });
});

// ============================
// PARTICULES
// ============================
function createParticles() {
  const container = document.getElementById('particles');
  const count = 18;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 12 + 4;
    p.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${Math.random() * 100}%;
      animation-duration: ${Math.random() * 15 + 10}s;
      animation-delay: ${Math.random() * -20}s;
      opacity: ${Math.random() * 0.5 + 0.1};
    `;
    container.appendChild(p);
  }
}

// ============================
// TYPING EFFECT
// ============================
function startTypingEffect() {
  const el = document.getElementById('typing');
  const phrases = [
    'qui te correspond',
    'en Intelligence Artificielle',
    'en Développement Web',
    'en Cybersécurité',
    'en IoT & Systèmes',
  ];
  let phraseIdx = 0, charIdx = 0, deleting = false;

  function type() {
    const current = phrases[phraseIdx];
    if (deleting) {
      el.innerHTML = current.slice(0, charIdx--) + '<span class="typing-cursor">|</span>';
      if (charIdx < 0) { deleting = false; phraseIdx = (phraseIdx + 1) % phrases.length; charIdx = 0; setTimeout(type, 400); return; }
      setTimeout(type, 40);
    } else {
      el.innerHTML = current.slice(0, charIdx++) + '<span class="typing-cursor">|</span>';
      if (charIdx > current.length) { deleting = true; setTimeout(type, 1800); return; }
      setTimeout(type, 80);
    }
  }
  setTimeout(type, 600);
}

// ============================
// COUNTER ANIMATION
// ============================
function animateCounters() {
  const counters = document.querySelectorAll('.stat-num');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = +el.dataset.target;
      let current = 0;
      const step = target / 40;
      const timer = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = Math.floor(current);
        if (current >= target) clearInterval(timer);
      }, 30);
      observer.unobserve(el);
    });
  });
  counters.forEach(c => observer.observe(c));
}

// ============================
// CARD MOUSE GLOW
// ============================
function setupCardMouseGlow() {
  document.addEventListener('mousemove', e => {
    document.querySelectorAll('.mentor-card').forEach(card => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mx', x + '%');
      card.style.setProperty('--my', y + '%');
    });
  });
}

// ============================
// DATA LOADING
// ============================
async function loadFilieres() {
  try {
    const res = await fetch('/api/filieres');
    const filieres = await res.json();
    const select = document.getElementById('filiere');
    filieres.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f; opt.textContent = f;
      select.appendChild(opt);
    });
  } catch (e) { console.error('Erreur filieres:', e); }
}

async function loadCompetences() {
  try {
    const res = await fetch('/api/competences');
    allCompetences = await res.json();
  } catch (e) { console.error('Erreur competences:', e); }
}

// ============================
// AUTOCOMPLETE
// ============================
function setupAutocomplete() {
  const input = document.getElementById('competences');
  const box = document.getElementById('suggestions');

  input.addEventListener('input', () => {
    const raw = input.value;
    const parts = raw.split(',');
    const last = parts[parts.length - 1].trim().toLowerCase();

    if (last.length < 2) { box.classList.add('hidden'); return; }

    const matches = allCompetences.filter(c => c.toLowerCase().includes(last)).slice(0, 7);
    if (!matches.length) { box.classList.add('hidden'); return; }

    box.innerHTML = '';
    matches.forEach(m => {
      const div = document.createElement('div');
      div.className = 'suggestion-item';
      div.textContent = m;
      div.addEventListener('mousedown', () => {
        const prefix = parts.slice(0, -1).join(', ');
        input.value = prefix ? prefix + ', ' + m + ', ' : m + ', ';
        box.classList.add('hidden');
        input.focus();
      });
      box.appendChild(div);
    });
    box.classList.remove('hidden');
  });

  document.addEventListener('click', e => {
    if (!input.contains(e.target) && !box.contains(e.target)) box.classList.add('hidden');
  });
}

// ============================
// SEARCH
// ============================
async function searchMentors() {
  const competences = document.getElementById('competences').value.trim();
  const heure = document.getElementById('heure').value;
  const filiere = document.getElementById('filiere').value;

  if (!competences) {
    showError('Veuillez entrer au moins une compétence ou matière.');
    return;
  }

  const btn = document.getElementById('btn-search');
  btn.disabled = true;
  btn.innerHTML = '<span class="btn-ripple"></span><span class="spinner"></span><span class="btn-text">Recherche en cours...</span>';

  hideAll();

  try {
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ competences, heure, filiere })
    });
    const data = await res.json();

    if (!res.ok) { showError(data.error || 'Une erreur est survenue.'); return; }
    if (!data.length) { document.getElementById('empty-state').classList.remove('hidden'); return; }

    renderResults(data);

  } catch (e) {
    showError('Impossible de contacter le serveur.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span class="btn-ripple"></span><span class="btn-icon">⚡</span><span class="btn-text">Rechercher un mentor</span>';
  }
}

// ============================
// RENDER RESULTS
// ============================
function renderResults(mentors) {
  const section = document.getElementById('results-section');
  const grid = document.getElementById('results-grid');
  const count = document.getElementById('results-count');

  count.textContent = `${mentors.length} résultat${mentors.length > 1 ? 's' : ''}`;
  grid.innerHTML = '';

  mentors.forEach((m, i) => {
    const card = buildCard(m, i);
    card.style.animationDelay = `${i * 0.1}s`;
    grid.appendChild(card);
  });

  section.classList.remove('hidden');
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Activer le glow après rendu
  setTimeout(setupCardMouseGlow, 100);
}

// ============================
// BUILD CARD
// ============================
function buildCard(m, rank) {
  const card = document.createElement('div');
  card.className = 'mentor-card';

  const initials = m.nom.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const scoreColor = m.score >= 70
    ? 'linear-gradient(90deg, #22C55E, #16A34A)'
    : m.score >= 40
    ? 'linear-gradient(90deg, #F59E0B, #D97706)'
    : 'linear-gradient(90deg, #4F8EF7, #3B82F6)';

  const scoreLabel = m.score >= 70 ? '🔥 Excellent match' : m.score >= 40 ? '👍 Bon match' : '💡 Match partiel';
  const rankEmoji = ['🥇','🥈','🥉'][rank] || '';

  const commonTags = m.competences_communes.length
    ? m.competences_communes.map(c => `<span class="tag tag-match">✓ ${capitalize(c)}</span>`).join('')
    : '<span class="tag" style="background:#F3F4F6;color:#6B7280">Aucune commune</span>';

  const dispoTags = m.disponibilites.map(h => `<span class="tag tag-dispo">🕐 ${h}</span>`).join('');

  card.innerHTML = `
    ${rankEmoji ? `<div class="rank-badge">${rankEmoji}</div>` : ''}
    <div class="card-header">
      <div class="avatar">${initials}</div>
      <div>
        <div class="card-name">${m.nom}</div>
        <div class="card-meta">${m.filiere} · ${m.niveau}</div>
      </div>
    </div>

    <div class="score-section">
      <div class="score-label">
        <span>${scoreLabel}</span>
        <span class="score-value" style="color:${m.score >= 70 ? '#16A34A' : m.score >= 40 ? '#D97706' : '#4F8EF7'}">${m.score}<small style="font-size:0.7em;font-weight:500">/100</small></span>
      </div>
      <div class="score-bar">
        <div class="score-fill" style="width:${m.score}%;background:${scoreColor}"></div>
      </div>
      <div class="score-breakdown">
        <span class="mini-score">📚 ${m.score_competences}/60</span>
        <span class="mini-score">🕐 ${m.score_horaire}/30</span>
        <span class="mini-score">🎓 ${m.score_filiere}/10</span>
      </div>
    </div>

    <div class="tags-section">
      <div class="tags-label">Compétences communes</div>
      <div class="tags">${commonTags}</div>
    </div>

    <div class="tags-section">
      <div class="tags-label">Disponibilités</div>
      <div class="tags">${dispoTags}</div>
    </div>

    <div class="tags-section">
      <div class="tags-label">Format</div>
      <div class="tags"><span class="tag tag-format">📍 ${m.format}</span></div>
    </div>

    ${m.bio ? `<div class="card-bio">"${m.bio}"</div>` : ''}
  `;
  return card;
}

// ============================
// UTILS
// ============================
function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

function hideAll() {
  ['results-section','empty-state','error-state'].forEach(id =>
    document.getElementById(id).classList.add('hidden')
  );
}

function showError(msg) {
  const el = document.getElementById('error-state');
  document.getElementById('error-msg').textContent = msg;
  el.classList.remove('hidden');
}
