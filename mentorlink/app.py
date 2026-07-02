from flask import Flask, render_template, request, jsonify
import sqlite3
import os

app = Flask(__name__)
DB_PATH = os.path.join(os.path.dirname(__file__), 'mentorlink.db')


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS mentors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nom TEXT NOT NULL,
            competences TEXT NOT NULL,
            disponibilites TEXT NOT NULL,
            filiere TEXT NOT NULL,
            niveau TEXT NOT NULL,
            format TEXT NOT NULL,
            bio TEXT
        )
    ''')

    c.execute('SELECT COUNT(*) FROM mentors')
    if c.fetchone()[0] == 0:
        mentors_data = [
            (
                'Koffi ADEOLA',
                'Python,Machine Learning,Intelligence Artificielle,Mathématiques',
                '08:00,10:00,14:00,16:00',
                'IA',
                'Master 2',
                'En ligne',
                'Passionné par l\'IA et le ML, j\'accompagne les étudiants en licence et master.'
            ),
            (
                'Fatoumata DIALLO',
                'Développement Web,JavaScript,React,Node.js,HTML/CSS',
                '09:00,11:00,15:00,18:00',
                'GL',
                'Licence 3',
                'Présentiel et En ligne',
                'Développeuse web full-stack, j\'aide à maîtriser les technos modernes du web.'
            ),
            (
                'Romuald GBENOU',
                'Réseaux,Cybersécurité,Linux,Administration système',
                '07:00,13:00,17:00,19:00',
                'SI',
                'Master 1',
                'Présentiel',
                'Expert en sécurité informatique et administration de systèmes Linux.'
            ),
            (
                'Aminata TRAORE',
                'Java,POO,Algorithmes,Structures de données,C++',
                '08:00,10:00,14:00,16:00,20:00',
                'GL',
                'Master 2',
                'En ligne',
                'Ingénieure logiciel, je maîtrise la programmation orientée objet et les algorithmes.'
            ),
            (
                'Sékou MENSAH',
                'IoT,Arduino,Raspberry Pi,Électronique,Capteurs',
                '09:00,11:00,14:00,17:00',
                'SE&IoT',
                'Licence 3',
                'Présentiel et En ligne',
                'Passionné d\'objets connectés, je partage mes projets IoT avec enthousiasme.'
            ),
            (
                'Clarisse HOUNSOU',
                'Base de données,SQL,PostgreSQL,MySQL,Modélisation',
                '10:00,12:00,15:00,18:00',
                'IM',
                'Master 1',
                'En ligne',
                'Spécialiste en bases de données et systèmes d\'information.'
            ),
        ]
        c.executemany(
            'INSERT INTO mentors (nom, competences, disponibilites, filiere, niveau, format, bio) VALUES (?,?,?,?,?,?,?)',
            mentors_data
        )
    conn.commit()
    conn.close()


def compute_score(mentor, competences_user, heure_user, filiere_user):
    """Calcule un score de compatibilité entre 0 et 100."""
    score = 0
    details = {}

    # --- Compétences (60 points max) ---
    mentor_comps = [c.strip().lower() for c in mentor['competences'].split(',')]
    user_comps = [c.strip().lower() for c in competences_user.split(',') if c.strip()]
    common = [c for c in user_comps if any(c in mc or mc in c for mc in mentor_comps)]
    
    if not common:
        return None, {}  # Aucune compétence commune → exclu
    
    comp_score = min(60, int((len(common) / max(len(user_comps), 1)) * 60))
    score += comp_score
    details['competences_communes'] = common
    details['score_competences'] = comp_score

    # --- Horaire (30 points max, tolérance ±1h) ---
    heure_score = 0
    if heure_user:
        try:
            h_user = int(heure_user.split(':')[0])
            dispo_hours = [int(h.split(':')[0]) for h in mentor['disponibilites'].split(',')]
            for h_m in dispo_hours:
                if abs(h_m - h_user) <= 1:
                    heure_score = 30
                    break
                elif abs(h_m - h_user) <= 2:
                    heure_score = max(heure_score, 15)
        except Exception:
            pass
    score += heure_score
    details['score_horaire'] = heure_score

    # --- Filière (10 points) ---
    filiere_score = 0
    if filiere_user and filiere_user.lower() in mentor['filiere'].lower():
        filiere_score = 10
    score += filiere_score
    details['score_filiere'] = filiere_score

    details['score_total'] = score
    return score, details


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/filieres')
def get_filieres():
    conn = get_db()
    rows = conn.execute('SELECT DISTINCT filiere FROM mentors ORDER BY filiere').fetchall()
    conn.close()
    return jsonify([r['filiere'] for r in rows])


@app.route('/api/competences')
def get_competences():
    conn = get_db()
    rows = conn.execute('SELECT competences FROM mentors').fetchall()
    conn.close()
    all_comps = set()
    for row in rows:
        for c in row['competences'].split(','):
            all_comps.add(c.strip())
    return jsonify(sorted(list(all_comps)))


@app.route('/api/search', methods=['POST'])
def search():
    data = request.get_json()
    competences_user = data.get('competences', '')
    heure_user = data.get('heure', '')
    filiere_user = data.get('filiere', '')

    if not competences_user.strip():
        return jsonify({'error': 'Veuillez entrer au moins une compétence.'}), 400

    conn = get_db()
    mentors = conn.execute('SELECT * FROM mentors').fetchall()
    conn.close()

    results = []
    for mentor in mentors:
        score, details = compute_score(mentor, competences_user, heure_user, filiere_user)
        if score is not None:
            results.append({
                'id': mentor['id'],
                'nom': mentor['nom'],
                'competences': mentor['competences'].split(','),
                'disponibilites': mentor['disponibilites'].split(','),
                'filiere': mentor['filiere'],
                'niveau': mentor['niveau'],
                'format': mentor['format'],
                'bio': mentor['bio'],
                'competences_communes': details.get('competences_communes', []),
                'score': details['score_total'],
                'score_competences': details['score_competences'],
                'score_horaire': details['score_horaire'],
                'score_filiere': details['score_filiere'],
            })

    results.sort(key=lambda x: x['score'], reverse=True)
    return jsonify(results)


if __name__ == '__main__':
    init_db()
    app.run(debug=True)
