let toutesLesCompetences = [];

document.addEventListener('DOMContentLoaded', () => {
  initialiserTheme();
  creerParticules();
  demarrerEffetSaisie();
  animerCompteurs();
  chargerFilieres();
  chargerCompetences();
  configurerAutocompletion();
  configurerLueurCarte();

  document.getElementById('bouton-theme').addEventListener('click', basculerTheme);

  document.getElementById('competences').addEventListener('keydown', e => {
    if (e.key === 'Enter') rechercherMentors();
  });
});

function initialiserTheme() {
  const bouton = document.getElementById('bouton-theme');
  const themeEnregistre = localStorage.getItem('theme-mentorlink');
  const preferSombre = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = themeEnregistre || (preferSombre ? 'sombre' : 'clair');

  appliquerTheme(theme);
}

function appliquerTheme(theme) {
  const bouton = document.getElementById('bouton-theme');
  document.documentElement.setAttribute('data-theme', theme);
  bouton.textContent = theme === 'sombre' ? '☀️' : '🌙';
  localStorage.setItem('theme-mentorlink', theme);
}

function basculerTheme() {
  const themeActuel = document.documentElement.getAttribute('data-theme');
  appliquerTheme(themeActuel === 'sombre' ? 'clair' : 'sombre');
}

function creerParticules() {
  const conteneur = document.getElementById('particules');
  const nombre = 18;
  for (let i = 0; i < nombre; i++) {
    const p = document.createElement('div');
    p.className = 'particule';
    const taille = Math.random() * 12 + 4;
    p.style.cssText = `
      width: ${taille}px;
      height: ${taille}px;
      left: ${Math.random() * 100}%;
      animation-duration: ${Math.random() * 15 + 10}s;
      animation-delay: ${Math.random() * -20}s;
      opacity: ${Math.random() * 0.5 + 0.1};
    `;
    conteneur.appendChild(p);
  }
}

function demarrerEffetSaisie() {
  const el = document.getElementById('texte-animation');
  const phrases = [
    'qui te correspond',
    'en Intelligence Artificielle',
    'en Développement Web',
    'en Cybersécurité',
    'en IoT & Systèmes',
  ];
  let indexPhrase = 0, indexCaractere = 0, suppression = false;

  function saisir() {
    const actuelle = phrases[indexPhrase];
    if (suppression) {
      el.innerHTML = actuelle.slice(0, indexCaractere--) + '<span class="curseur-animation">|</span>';
      if (indexCaractere < 0) { suppression = false; indexPhrase = (indexPhrase + 1) % phrases.length; indexCaractere = 0; setTimeout(saisir, 400); return; }
      setTimeout(saisir, 40);
    } else {
      el.innerHTML = actuelle.slice(0, indexCaractere++) + '<span class="curseur-animation">|</span>';
      if (indexCaractere > actuelle.length) { suppression = true; setTimeout(saisir, 1800); return; }
      setTimeout(saisir, 80);
    }
  }
  setTimeout(saisir, 600);
}

function animerCompteurs() {
  const compteurs = document.querySelectorAll('.nombre-statistique');
  const observateur = new IntersectionObserver(entrees => {
    entrees.forEach(entree => {
      if (!entree.isIntersecting) return;
      const el = entree.target;
      const cible = +el.dataset.target;
      let actuel = 0;
      const pas = cible / 40;
      const minuteur = setInterval(() => {
        actuel = Math.min(actuel + pas, cible);
        el.textContent = Math.floor(actuel);
        if (actuel >= cible) clearInterval(minuteur);
      }, 30);
      observateur.unobserve(el);
    });
  });
  compteurs.forEach(c => observateur.observe(c));
}

function configurerLueurCarte() {
  document.addEventListener('mousemove', e => {
    document.querySelectorAll('.carte-mentor').forEach(carte => {
      const rect = carte.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      carte.style.setProperty('--mx', x + '%');
      carte.style.setProperty('--my', y + '%');
    });
  });
}

async function chargerFilieres() {
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

async function chargerCompetences() {
  try {
    const res = await fetch('/api/competences');
    toutesLesCompetences = await res.json();
  } catch (e) { console.error('Erreur competences:', e); }
}

function configurerAutocompletion() {
  const champ = document.getElementById('competences');
  const boite = document.getElementById('suggestions');

  champ.addEventListener('input', () => {
    const brut = champ.value;
    const parties = brut.split(',');
    const derniere = parties[parties.length - 1].trim().toLowerCase();

    if (derniere.length < 2) { boite.classList.add('masque'); return; }

    const correspondances = toutesLesCompetences.filter(c => c.toLowerCase().includes(derniere)).slice(0, 7);
    if (!correspondances.length) { boite.classList.add('masque'); return; }

    boite.innerHTML = '';
    correspondances.forEach(m => {
      const div = document.createElement('div');
      div.className = 'element-suggestion';
      div.textContent = m;
      div.addEventListener('mousedown', () => {
        const prefixe = parties.slice(0, -1).join(', ');
        champ.value = prefixe ? prefixe + ', ' + m + ', ' : m + ', ';
        boite.classList.add('masque');
        champ.focus();
      });
      boite.appendChild(div);
    });
    boite.classList.remove('masque');
  });

  document.addEventListener('click', e => {
    if (!champ.contains(e.target) && !boite.contains(e.target)) boite.classList.add('masque');
  });
}

async function rechercherMentors() {
  const competences = document.getElementById('competences').value.trim();
  const heure = document.getElementById('heure').value;
  const filiere = document.getElementById('filiere').value;

  if (!competences) {
    afficherErreur('Veuillez entrer au moins une compétence ou matière.');
    return;
  }

  const bouton = document.getElementById('bouton-recherche');
  bouton.disabled = true;
  bouton.innerHTML = '<span class="effet-onde"></span><span class="chargement"></span><span class="texte-bouton">Recherche en cours...</span>';

  masquerTout();

  try {
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ competences, heure, filiere })
    });
    const data = await res.json();

    if (!res.ok) { afficherErreur(data.error || 'Une erreur est survenue.'); return; }
    if (!data.length) { document.getElementById('etat-vide').classList.remove('masque'); return; }

    afficherResultats(data);

  } catch (e) {
    afficherErreur('Impossible de contacter le serveur.');
  } finally {
    bouton.disabled = false;
    bouton.innerHTML = '<span class="effet-onde"></span><span class="icone-bouton">⚡</span><span class="texte-bouton">Rechercher un mentor</span>';
  }
}

function afficherResultats(mentors) {
  const section = document.getElementById('section-resultats');
  const grille = document.getElementById('grille-resultats');
  const compteur = document.getElementById('nombre-resultats');

  compteur.textContent = `${mentors.length} résultat${mentors.length > 1 ? 's' : ''}`;
  grille.innerHTML = '';

  mentors.forEach((m, i) => {
    const carte = construireCarte(m, i);
    carte.style.animationDelay = `${i * 0.1}s`;
    grille.appendChild(carte);
  });

  section.classList.remove('masque');
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });

  setTimeout(configurerLueurCarte, 100);
}

function construireCarte(m, rang) {
  const carte = document.createElement('div');
  carte.className = 'carte-mentor';

  const initiales = m.nom.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const couleurScore = m.score >= 70
    ? 'linear-gradient(90deg, #22C55E, #16A34A)'
    : m.score >= 40
    ? 'linear-gradient(90deg, #F59E0B, #D97706)'
    : 'linear-gradient(90deg, #4F8EF7, #3B82F6)';

  const libelleScore = m.score >= 70 ? '🔥 Excellent match' : m.score >= 40 ? '👍 Bon match' : '💡 Match partiel';
  const emojiRang = ['🥇','🥈','🥉'][rang] || '';

  const etiquettesCommunes = m.competences_communes.length
    ? m.competences_communes.map(c => `<span class="etiquette etiquette-correspondance">✓ ${capitaliser(c)}</span>`).join('')
    : '<span class="etiquette" style="background:#F3F4F6;color:#6B7280">Aucune commune</span>';

  const etiquettesDispo = m.disponibilites.map(h => `<span class="etiquette etiquette-dispo">🕐 ${h}</span>`).join('');

  carte.innerHTML = `
    ${emojiRang ? `<div class="badge-rang">${emojiRang}</div>` : ''}
    <div class="entete-carte">
      <div class="avatar">${initiales}</div>
      <div>
        <div class="nom-carte">${m.nom}</div>
        <div class="info-carte">${m.filiere} · ${m.niveau}</div>
      </div>
    </div>

    <div class="section-score">
      <div class="libelle-score">
        <span>${libelleScore}</span>
        <span class="valeur-score" style="color:${m.score >= 70 ? '#16A34A' : m.score >= 40 ? '#D97706' : '#4F8EF7'}">${m.score}<small style="font-size:0.7em;font-weight:500">/100</small></span>
      </div>
      <div class="barre-score">
        <div class="remplissage-score" style="width:${m.score}%;background:${couleurScore}"></div>
      </div>
      <div class="detail-score">
        <span class="mini-note">📚 ${m.score_competences}/60</span>
        <span class="mini-note">🕐 ${m.score_horaire}/30</span>
        <span class="mini-note">🎓 ${m.score_filiere}/10</span>
      </div>
    </div>

    <div class="section-etiquettes">
      <div class="libelle-etiquettes">Compétences communes</div>
      <div class="etiquettes">${etiquettesCommunes}</div>
    </div>

    <div class="section-etiquettes">
      <div class="libelle-etiquettes">Disponibilités</div>
      <div class="etiquettes">${etiquettesDispo}</div>
    </div>

    <div class="section-etiquettes">
      <div class="libelle-etiquettes">Format</div>
      <div class="etiquettes"><span class="etiquette etiquette-format">📍 ${m.format}</span></div>
    </div>

    ${m.bio ? `<div class="bio-carte">"${m.bio}"</div>` : ''}
  `;
  return carte;
}

function capitaliser(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

function masquerTout() {
  ['section-resultats','etat-vide','etat-erreur'].forEach(id =>
    document.getElementById(id).classList.add('masque')
  );
}

function afficherErreur(msg) {
  const el = document.getElementById('etat-erreur');
  document.getElementById('message-erreur').textContent = msg;
  el.classList.remove('masque');
}
