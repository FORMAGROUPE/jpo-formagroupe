#!/usr/bin/env python3
"""Génère index.html à partir de donnees.json.

Usage : python3 build.py
Quand une date, un horaire ou un campus change dans Notion, mettez à jour
donnees.json puis relancez ce script. index.html est réécrit.
"""
import json, html, datetime, urllib.parse
from zoneinfo import ZoneInfo

SITE = "https://jpo.formagroupe.fr/"
JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]
MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet",
        "août", "septembre", "octobre", "novembre", "décembre"]
MOIS_COURT = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.",
              "août", "sept.", "oct.", "nov.", "déc."]
JOURS_COURT = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."]

D = json.load(open("donnees.json", encoding="utf-8"))
CAMPUS = {c["id"]: c for c in D["campus"]}
TYPES = D["types"]
esc = html.escape


def d_(iso):
    return datetime.date.fromisoformat(iso)


def long_date(iso):
    d = d_(iso)
    return f"{JOURS[d.weekday()].capitalize()} {d.day} {MOIS[d.month-1]} {d.year}"


def court_date(iso):
    d = d_(iso)
    return f"{JOURS_COURT[d.weekday()]} {d.day} {MOIS_COURT[d.month-1]} {d.year}"


def nom_campus(c):
    return f'{c["ecole"]} · {c["court"]}'


def br(t):
    return esc(t).replace("\n", "<br>")


def plan_url(c):
    q = f'{c["adresse"]}, {c["cp"]} {c["ville"]}'
    return "https://www.google.com/maps/search/?api=1&query=" + urllib.parse.quote(q)


def tel_href(t):
    return "tel:" + t.replace(" ", "")


def repere(c):
    return (f'<span class="repere" style="border-color:{c["bord"]};background:{c["fond"]};color:{c["encre"]}">'
            f'<strong>{esc(c["ecole"])}</strong> · {esc(c["court"])}</span>')


jpo = sorted(D["jpo"], key=lambda j: j["date"])

# ---------- cartes campus ----------
cartes = []
for c in D["campus"]:
    suiv = [j for j in jpo if c["id"] in j["campus"]]
    dates = []
    for i, j in enumerate(suiv):
        masque = " hidden" if i >= 4 else ""
        dates.append(
            f'<li data-date="{j["date"]}"{masque}><strong>{esc(court_date(j["date"]))}</strong> · '
            f'{esc(j["horaires"])}<br>{esc(TYPES[j["type"]])}</li>')
    formations = "\n".join(f"<li>{esc(f)}</li>" for f in c["formations"])
    cartes.append(f'''<article class="carte" data-campus="{c["id"]}" data-domaines="{" ".join(c["domaines"])}" aria-labelledby="carte-{c["id"]}">
<div class="bande" style="background:{c["couleur"]}"></div>
<div class="corps">
<p class="ecole" style="color:{c["texte"]}">{esc(c["ecole"])}</p>
<h3 id="carte-{c["id"]}">{esc(c["ville"])}</h3>
<p class="presentation">{br(c["presentation"])}</p>
<p class="rubrique">Adresse</p>
<p class="valeur">{esc(c["adresse"])}, {esc(c["cp"])} {esc(c["ville"])}</p>
<p class="rubrique">Contact</p>
<p class="valeur"><a href="{tel_href(c["tel"])}">{esc(c["tel"])}</a><br><a href="mailto:{esc(c["email"])}">{esc(c["email"])}</a></p>
<p class="rubrique">Accès</p>
<p class="valeur">{esc(c["acces"])}</p>
<p class="rubrique">Formations présentées</p>
<ul class="formations">
{formations}
</ul>
<p class="rubrique">Prochaines dates</p>
<ul class="dates">
{chr(10).join(dates)}
</ul>
<p class="note">Les horaires sont indiqués pour chaque date.</p>
<div class="boutons">
<a class="bouton-rouge" href="#inscription" data-inscription data-campus="{c["id"]}">M’inscrire<span class="sr-only"> à une journée {esc(c["ecole"])} {esc(c["court"])}</span></a>
<a class="bouton-contour" href="{plan_url(c)}" target="_blank" rel="noopener">Voir le plan d’accès<span class="sr-only"> de {esc(c["ecole"])} {esc(c["court"])} (nouvelle fenêtre)</span></a>
</div>
</div>
</article>''')

# ---------- calendrier ----------
lignes = []
for j in jpo:
    d = d_(j["date"])
    badges = "".join(repere(CAMPUS[i]) for i in j["campus"])
    statut = ""
    if j.get("statut") != "Confirmé":
        statut = '<p class="statut"><strong>À confirmer</strong></p>'
    lignes.append(f'''<li class="ligne-date" data-date="{j["date"]}" data-campus="{" ".join(j["campus"])}">
<div class="quand">
<p class="jour">{d.day}</p>
<p class="mois">{MOIS[d.month-1].upper()}</p>
<p class="annee">{JOURS[d.weekday()].capitalize()} {d.year}</p>
</div>
<div class="detail">
<p class="type">{esc(TYPES[j["type"]])}</p>
<div class="reperes">{badges}</div>
{statut}
</div>
<div class="droite">
<p class="horaires">Horaires : <strong>{esc(j["horaires"])}</strong></p>
<a class="bouton-rouge petit" href="?jpo={j["date"]}#inscription" data-inscription data-jpo="{j["date"]}">M’inscrire<span class="sr-only"> le {esc(long_date(j["date"]))}</span></a>
</div>
</li>''')

# ---------- formulaire ----------
options_jpo = "\n".join(
    f'<option value="{j["date"]}">{esc(long_date(j["date"]))} — {esc(TYPES[j["type"]])}</option>' for j in jpo)
options_campus = "\n".join(
    f'<option value="{c["id"]}">{esc(c["ecole"])} · {esc(c["ville"])}</option>' for c in D["campus"])

pastilles_campus = ['<button type="button" class="pastille" data-filtre="campus" data-valeur="all" aria-pressed="true">Tous les campus</button>']
for c in D["campus"]:
    pastilles_campus.append(
        f'<button type="button" class="pastille" data-filtre="campus" data-valeur="{c["id"]}" aria-pressed="false">'
        f'{esc(c["ecole"])} · {esc(c["court"])}</button>')
DOM = [("all", "Tous les domaines"),
       ("tert", "Commerce, gestion, communication et services"),
       ("beaute", "Esthétique, coiffure et diététique")]
pastilles_domaine = [
    f'<button type="button" class="pastille" data-filtre="domaine" data-valeur="{v}" aria-pressed="{"true" if v=="all" else "false"}">{esc(l)}</button>'
    for v, l in DOM]

# ---------- données structurées (Event) ----------
paris = ZoneInfo("Europe/Paris")


def iso_dt(iso, hhmm):
    h, m = hhmm.split("h")
    d = d_(iso)
    dt = datetime.datetime(d.year, d.month, d.day, int(h), int(m or 0), tzinfo=paris)
    return dt.isoformat()


events = []
for j in jpo:
    if j.get("statut") != "Confirmé":
        continue
    deb, fin = [x.strip() for x in j["horaires"].split("-")]
    for cid in j["campus"]:
        c = CAMPUS[cid]
        events.append({
            "@type": "EducationEvent",
            "name": f'{TYPES[j["type"]]} – {c["ecole"]} {c["court"]}',
            "startDate": iso_dt(j["date"], deb),
            "endDate": iso_dt(j["date"], fin),
            "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
            "eventStatus": "https://schema.org/EventScheduled",
            "location": {"@type": "Place", "name": f'{c["ecole"]} {c["court"]}',
                         "address": {"@type": "PostalAddress", "streetAddress": c["adresse"],
                                     "postalCode": c["cp"], "addressLocality": c["ville"],
                                     "addressCountry": "FR"}},
            "organizer": {"@type": "Organization", "name": "FORMAGROUPE", "url": "https://www.formagroupe.fr"},
            "url": SITE,
        })
jsonld = json.dumps({"@context": "https://schema.org", "@graph": events}, ensure_ascii=False)

donnees_js = json.dumps({
    "types": TYPES,
    "campus": {c["id"]: {"ecole": c["ecole"], "court": c["court"], "domaines": c["domaines"], "valeur": c["valeurForm"]} for c in D["campus"]},
    "jpo": [{"date": j["date"], "campus": j["campus"], "type": j["type"], "horaires": j["horaires"]} for j in jpo],
}, ensure_ascii=False)

gabarit = open("gabarit.html", encoding="utf-8").read()
out = (gabarit
       .replace("{{PASTILLES_CAMPUS}}", "\n".join(pastilles_campus))
       .replace("{{PASTILLES_DOMAINE}}", "\n".join(pastilles_domaine))
       .replace("{{CARTES}}", "\n".join(cartes))
       .replace("{{LIGNES}}", "\n".join(lignes))
       .replace("{{OPTIONS_JPO}}", options_jpo)
       .replace("{{OPTIONS_CAMPUS}}", options_campus)
       .replace("{{JSONLD}}", jsonld.replace("</", "<\\/"))
       .replace("{{DONNEES}}", donnees_js.replace("</", "<\\/"))
       .replace("{{SITE}}", SITE))
open("index.html", "w", encoding="utf-8").write(out)
print("index.html écrit :", len(out), "octets,", len(events), "événements structurés")
