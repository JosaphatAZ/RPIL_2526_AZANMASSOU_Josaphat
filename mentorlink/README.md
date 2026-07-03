# IFRI MentorLink — Rattrapage Projet Intégrateur 2025-2026

**Université d'Abomey-Calavi (UAC) · IFRI**

## Description
Application web de matching mentor/mentoré basée sur la compatibilité des compétences et des horaires.

## Stack technique
- **Backend** : Python / Flask
- **Base de données** : SQLite (fichier local, remplaçable par PostgreSQL/MySQL)
- **Frontend** : HTML / CSS / JavaScript (vanilla)

## Installation et lancement

```bash
# 1. Cloner le dépôt
git clone https://github.com/TON_USERNAME/RPIL_2526_AZANMASSOU_Josaphat.git
cd RPIL_2526_nom_prenom

# 2. Créer un environnement virtuel
(Sous Linux/MacOs)
python3 -m venv venv
source venv/bin/activate  

(Sous Windows)
Windows : venv\Scripts\activate

# 3. Acceder au dossier mentorlink
cd /mentorlink 

# 4. Installer les dépendances
pip install -r requirements.txt

# 5. Lancer l'application
python app.py
```

Ouvrir **http://localhost:5000** dans le navigateur.

## Structure du projet
```
mentorlink/
├── app.py              # Backend Flask (routes + algorithme de matching)
├── requirements.txt    # Dépendances Python
├── mentorlink.db       # Base SQLite (auto-créée au premier lancement)
├── templates/
│   └── index.html      # Page unique de recherche
└── static/
    ├── css/style.css   # Styles
    └── js/app.js       # JavaScript frontend
```

## Algorithme de matching (score /100)
| Critère | Points |
|---|---|
| Compétences communes | jusqu'à 60 pts |
| Compatibilité horaire (±1h) | 30 pts |
| Filière | 10 pts |

Un mentor est affiché uniquement s'il a **au moins une compétence en commun**.

## Données pré-remplies
6 mentors avec des profils variés (IA, Web, Réseaux, Java, IoT, BDD).

## Passer à PostgreSQL/MySQL
Remplacer dans `app.py` :
```python
import psycopg2  # pip install psycopg2-binary
conn = psycopg2.connect("postgresql://user:password@localhost/mentorlink")
```
