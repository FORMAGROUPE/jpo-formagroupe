/* Page JPO Formagroupe : filtres, prochaine journée, formulaire d'inscription.
   Aucune bibliothèque externe. Sans JavaScript, la page reste lisible. */
(function () {
  "use strict";

  var DATA = JSON.parse(document.getElementById("donnees-jpo").textContent);
  var CONFIG = window.JPO_CONFIG || {};
  var MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  var JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

  /* Date du jour à Paris, au format AAAA-MM-JJ. */
  function aujourdhui() {
    try {
      return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
    } catch (e) {
      var d = new Date();
      return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
    }
  }
  var AUJ = aujourdhui();

  function dateLongue(iso) {
    var p = iso.split("-").map(Number);
    var d = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
    var j = JOURS[d.getUTCDay()];
    return j.charAt(0).toUpperCase() + j.slice(1) + " " + p[2] + " " + MOIS[p[1] - 1] + " " + p[0];
  }

  function nomCampus(id) {
    var c = DATA.campus[id];
    return c.ecole === "FORMABEAUTÉ" ? c.ecole + " " + c.court : c.ecole;
  }

  function liste(ids) {
    var noms = ids.map(nomCampus);
    if (noms.length <= 1) return noms.join("");
    return noms.slice(0, -1).join(", ") + " et " + noms[noms.length - 1];
  }

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  var upcoming = DATA.jpo.filter(function (j) { return j.date >= AUJ; });

  /* ---------- Prochaine journée ---------- */
  (function () {
    var elDate = $("#prochaine-date");
    var elLieux = $("#prochaine-lieux");
    if (!upcoming.length) {
      elDate.textContent = "Toutes les journées 2026-2027 sont passées";
      elLieux.textContent = "Contactez le campus qui vous intéresse.";
      return;
    }
    var p = upcoming[0];
    elDate.textContent = dateLongue(p.date);
    elLieux.textContent = liste(p.campus);
  })();

  /* ---------- Dates passées et plafond de 4 dates par carte ---------- */
  $$(".carte").forEach(function (carte) {
    var n = 0;
    $$("ul.dates li", carte).forEach(function (li) {
      if (li.dataset.date < AUJ || n >= 4) { li.hidden = true; } else { li.hidden = false; n++; }
    });
    if (!n) {
      var ul = $("ul.dates", carte);
      var li = document.createElement("li");
      li.textContent = "Aucune date à venir. Appelez le campus.";
      ul.appendChild(li);
    }
  });
  $$(".ligne-date").forEach(function (li) {
    li.dataset.passee = li.dataset.date < AUJ ? "1" : "0";
  });

  /* ---------- Filtres ---------- */
  var etat = { campus: "all", domaine: "all" };

  function campusVisibles() {
    return Object.keys(DATA.campus).filter(function (id) {
      var c = DATA.campus[id];
      return (etat.campus === "all" || etat.campus === id) &&
             (etat.domaine === "all" || c.domaines.indexOf(etat.domaine) >= 0);
    });
  }

  function appliquer() {
    var vis = campusVisibles();
    var nbDates = 0;
    $$(".carte").forEach(function (carte) {
      carte.hidden = vis.indexOf(carte.dataset.campus) < 0;
    });
    $$(".ligne-date").forEach(function (li) {
      var ids = li.dataset.campus.split(" ");
      var ok = li.dataset.passee === "0" && ids.some(function (id) { return vis.indexOf(id) >= 0; });
      li.hidden = !ok;
      if (ok) nbDates++;
    });
    $$(".pastille").forEach(function (b) {
      b.setAttribute("aria-pressed", String(etat[b.dataset.filtre] === b.dataset.valeur));
    });
    $("#resume").textContent = vis.length + " campus · " + nbDates + (nbDates > 1 ? " dates" : " date");
    $("#aucun").hidden = vis.length > 0;
  }

  $$(".pastille").forEach(function (b) {
    b.addEventListener("click", function () {
      etat[b.dataset.filtre] = b.dataset.valeur;
      appliquer();
    });
  });
  appliquer();

  /* ---------- Formulaire ---------- */
  var form = $("#form-jpo");
  var selJpo = $("#f-jpo");
  var selCampus = $("#f-campus");
  var statut = $("#etat");
  var bouton = $("#envoi");

  var optionsCampus = $$("option", selCampus).filter(function (o) { return o.value; });

  /* Retire les journées passées de la liste. */
  $$("option", selJpo).forEach(function (o) {
    if (o.value && o.value < AUJ) o.remove();
  });

  /* Limite la liste des campus à ceux de la journée choisie. */
  function majCampus() {
    var courant = selCampus.value;
    var jpo = DATA.jpo.filter(function (j) { return j.date === selJpo.value; })[0];
    $$("option", selCampus).forEach(function (o) { if (o.value) o.remove(); });
    optionsCampus.forEach(function (o) {
      if (!jpo || jpo.campus.indexOf(o.value) >= 0) selCampus.appendChild(o);
    });
    var restants = $$("option", selCampus).filter(function (o) { return o.value; });
    if (restants.some(function (o) { return o.value === courant; })) {
      selCampus.value = courant;
    } else if (jpo && restants.length === 1) {
      selCampus.value = restants[0].value;
    } else {
      selCampus.value = "";
    }
  }
  selJpo.addEventListener("change", majCampus);

  function prochaineDatePour(campusId) {
    var j = upcoming.filter(function (x) { return x.campus.indexOf(campusId) >= 0; })[0];
    return j ? j.date : "";
  }

  function preremplir(jpo, campus) {
    if (jpo) {
      if ($$("option", selJpo).some(function (o) { return o.value === jpo; })) selJpo.value = jpo;
      majCampus();
    }
    if (campus) {
      if (!jpo) {
        selJpo.value = prochaineDatePour(campus);
        majCampus();
      }
      if ($$("option", selCampus).some(function (o) { return o.value === campus; })) selCampus.value = campus;
    }
  }

  /* Boutons « M'inscrire » : préremplissent le formulaire puis y mènent. */
  $$("a[data-inscription]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      var jpo = a.dataset.jpo || "";
      var campus = a.dataset.campus || "";
      if (jpo && etat.campus !== "all") campus = etat.campus;
      preremplir(jpo, campus);
      var cible = $("#inscription");
      cible.scrollIntoView();
      var premier = !selJpo.value ? selJpo : (!selCampus.value ? selCampus : $("#f-prenom"));
      premier.focus({ preventScroll: true });
    });
  });

  /* Lien direct : ?jpo=2026-10-07&campus=formavar */
  (function () {
    var q = new URLSearchParams(window.location.search);
    var jpo = q.get("jpo") || "";
    var campus = q.get("campus") || "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(jpo) || campus) preremplir(/^\d{4}-\d{2}-\d{2}$/.test(jpo) ? jpo : "", campus);
  })();

  function message(texte, erreur) {
    statut.textContent = texte;
    statut.className = "etat" + (erreur ? " erreur" : "");
  }

  function champsManquants() {
    var manque = [];
    $$("[required]", form).forEach(function (c) {
      var vide = c.type === "checkbox" ? !c.checked : !String(c.value).trim();
      if (vide) manque.push(c);
    });
    return manque;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    message("", false);

    /* Champ piège : un robot le remplit, une personne ne le voit pas. */
    if ($("#f-site").value) {
      message("Merci. Votre inscription est enregistrée.", false);
      return;
    }

    var manque = champsManquants();
    if (manque.length) {
      var c = manque[0];
      var libelle = c.type === "checkbox" ? "la case de consentement" : "« " + $("label[for=" + c.id + "]").textContent.replace(/\s*\(obligatoire\)/, "") + " »";
      message("Il manque un champ obligatoire : " + libelle + ".", true);
      c.focus();
      return;
    }
    if (!$("#f-mail").checkValidity()) {
      message("L’adresse email semble incorrecte. Vérifiez-la.", true);
      $("#f-mail").focus();
      return;
    }
    if (!CONFIG.webhook) {
      message("L’inscription en ligne n’est pas encore ouverte. Appelez le campus de votre choix.", true);
      return;
    }

    var jpo = DATA.jpo.filter(function (j) { return j.date === selJpo.value; })[0];
    var charge = {
      jpo: selJpo.value,
      jpoLibelle: dateLongue(selJpo.value) + (jpo ? " — " + DATA.types[jpo.type] + ", " + jpo.horaires : ""),
      campus: DATA.campus[selCampus.value].valeur,
      campusLibelle: nomCampus(selCampus.value),
      prenom: $("#f-prenom").value.trim(),
      nom: $("#f-nom").value.trim(),
      email: $("#f-mail").value.trim(),
      telephone: $("#f-tel").value.trim(),
      profil: $("#f-profil").value,
      accompagnants: $("#f-acc").value,
      formation: $("#f-form").value.trim(),
      consentement: true,
      consentementTexte: $("#lbl-rgpd").textContent.trim(),
      consentementDate: new Date().toISOString(),
      page: window.location.href.split("#")[0]
    };

    var ctrl = typeof AbortController === "function" ? new AbortController() : null;
    var minuteur = ctrl ? setTimeout(function () { ctrl.abort(); }, CONFIG.delai || 15000) : null;

    bouton.disabled = true;
    message("Envoi en cours…", false);

    fetch(CONFIG.webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(charge),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      form.reset();
      majCampus();
      message("Merci. Votre inscription est enregistrée. Vous allez recevoir un email de confirmation.", false);
    }).catch(function () {
      message("L’inscription n’a pas pu être envoyée. Réessayez dans un instant, ou appelez le campus de votre choix.", true);
    }).then(function () {
      if (minuteur) clearTimeout(minuteur);
      bouton.disabled = false;
    });
  });
})();
