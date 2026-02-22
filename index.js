// Configuration
const WEBHOOK_URL = "https://n8n.srv1156867.hstgr.cloud/webhook/referral";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

// Liste des membres Cap Business avec leurs emails
/** @type {Record<string, string>} */
const MEMBRES = {
  "Aurélie Debord": "aurelie.debord@fidal.com",
  "Grégory Doranges": "contact@doranges-avocat.fr",
  "Guillaume Durand": "gdurand@ixina.com",
  "Geoffrey Leduc": "hello@agence-basalte.fr",
  "Gaetan Gousseau": "contact.volttech@gmail.com",
  "Aude Mayaud": "contact@serenaservices.fr",
  "Aurélie Doranges": "aurelie.doranges@avocat-doranges.fr",
  "Cyrille Gallais": "info@portraitscygal.fr",
  "Vincent Mauvillain": "Vincent.mauvillain@outlook.fr",
  "Stéphane Cayez": "scayez@freedomboatclub.fr",
  "Denis Dufeu": "denis.dufeu@safti.fr",
  "Stanislas Delanoue": "sdelanoue@exaltconseil.com",
  "Ava Telisman": "ava.bspc@gmail.com",
  "Kenny Bouzon": "le.peintre@outlook.fr",
  "Tarik Arich": "medianeart@gmail.com",
  "Mickael Maingard": "contact@ecologisclean.com",
  "Michael Virginius": "m.virginius@delvie.fr",
  "Sylvain Cordier": "sylvain.cordier@syco-conseil.com",
  "Léo Picon": "l.picon@renvy.fr",
  "Quentin Bletoux": "qbletoux@laboiteaoutia.fr",
  "Jérémy Dos Santos": "jeremy@cjmat.eu",
  "Romain Chuburu": "chaudfroid17@gmail.com",
  "Jérémy Baty": "jeremy.baty17@gmail.com",
  "Sabine Cantal": "sabinecantal.avocat@outlook.fr",
  "Jennifer David": "j.david@financeconseil.fr",
};

// Initialisation au chargement du DOM
document.addEventListener("DOMContentLoaded", function () {
  initializeForm();
});

function getTodayLocalISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function initializeForm() {
  const origineSelect = /** @type {HTMLSelectElement|null} */ (
    document.getElementById("origine")
  );
  const destinataireSelect = /** @type {HTMLSelectElement|null} */ (
    document.getElementById("destinataire")
  );
  setTodayDate();

  if (origineSelect && destinataireSelect) {
    Object.keys(MEMBRES).forEach((membre) => {
      const optionOrigine = document.createElement("option");
      optionOrigine.value = membre;
      optionOrigine.textContent = membre;
      origineSelect.appendChild(optionOrigine);

      const optionDestinataire = document.createElement("option");
      optionDestinataire.value = membre;
      optionDestinataire.textContent = membre;
      destinataireSelect.appendChild(optionDestinataire);
    });
  }

  const form = /** @type {HTMLFormElement|null} */ (
    document.getElementById("recommendationForm")
  );
  if (form) {
    form.addEventListener("submit", handleSubmit);
  }

  const consentCheckbox = /** @type {HTMLInputElement|null} */ (
    document.getElementById("consent")
  );
  const checkboxGroup = document.querySelector(".checkbox-group");
  if (consentCheckbox && checkboxGroup) {
    consentCheckbox.addEventListener("change", function () {
      if (consentCheckbox.checked) {
        checkboxGroup.classList.add("checked");
      } else {
        checkboxGroup.classList.remove("checked");
      }
    });
  }
}

function setTodayDate() {
  const dateInput = /** @type {HTMLInputElement|null} */ (
    document.getElementById("date")
  );
  if (dateInput) {
    dateInput.value = getTodayLocalISO();
  }
}

/** @param {SubmitEvent} event */
async function handleSubmit(event) {
  event.preventDefault();

  const form =
    event.currentTarget instanceof HTMLFormElement ? event.currentTarget : null;
  if (!form) {
    showMessage("❌ Erreur technique : formulaire invalide.", "error");
    return;
  }

  const consentCheckbox = /** @type {HTMLInputElement|null} */ (
    document.getElementById("consent")
  );
  const messageDiv = document.getElementById("message");
  const submitButton = /** @type {HTMLButtonElement|null} */ (
    form.querySelector('button[type="submit"]')
  );
  if (!submitButton) {
    showMessage("❌ Erreur technique : bouton d'envoi introuvable.", "error");
    return;
  }
  const btnText = /** @type {HTMLElement|null} */ (
    submitButton.querySelector(".btn-text")
  );
  const btnLoader = /** @type {HTMLElement|null} */ (
    submitButton.querySelector(".btn-loader")
  );

  if (!consentCheckbox?.checked) {
    showMessage(
      "⚠️ Vous devez confirmer le consentement du contact avant d'envoyer.",
      "error",
    );
    return;
  }

  const elOrigine = /** @type {HTMLSelectElement|null} */ (
    document.getElementById("origine")
  );
  const elDestinataire = /** @type {HTMLSelectElement|null} */ (
    document.getElementById("destinataire")
  );
  const elContact = /** @type {HTMLInputElement|null} */ (
    document.getElementById("contact") || document.getElementById("prospect")
  );
  const elEmail = /** @type {HTMLInputElement|null} */ (
    document.getElementById("email")
  );
  const elTelephone = /** @type {HTMLInputElement|null} */ (
    document.getElementById("telephone")
  );
  const elDate = /** @type {HTMLInputElement|null} */ (
    document.getElementById("date")
  );

  const elCommentaires =
    /** @type {(HTMLInputElement|HTMLTextAreaElement|null)} */ (
      document.getElementById("commentaires")
    );
  if (!elOrigine || !elDestinataire || !elContact || !elDate) {
    showMessage("❌ Erreur technique : formulaire incomplet.", "error");
    return;
  }

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const origine = elOrigine.value;
  const origineEmail = MEMBRES[origine] || "";
  const destinataire = elDestinataire.value;
  const destinataireEmail = MEMBRES[destinataire] || "";

  if (origine && destinataire && origine === destinataire) {
    showMessage(
      "⚠️ L'origine et le destinataire doivent être différents.",
      "error",
    );
    return;
  }

  if (!origineEmail) {
    showMessage(
      `⚠️ Erreur : votre adresse email (${origine}) n'est pas configurée.`,
      "error",
    );
    return;
  }
  if (!destinataireEmail) {
    showMessage(
      `⚠️ Impossible d'envoyer : ${destinataire} n'a pas d'adresse email configurée.`,
      "error",
    );
    return;
  }

  const email = elEmail ? elEmail.value.trim() : "";
  const telephone = elTelephone ? elTelephone.value.trim() : "";

  if (elEmail) {
    elEmail.setCustomValidity("");
  }
  if (email && !EMAIL_REGEX.test(email)) {
    if (elEmail) {
      elEmail.setCustomValidity("Veuillez saisir une adresse email valide.");
      elEmail.reportValidity();
    }
    showMessage("⚠️ Format email invalide.", "error");
    return;
  }

  const formData = {
    origine,
    origineEmail,
    destinataire,
    destinataireEmail,
    contact: elContact.value.trim(),
    email,
    telephone,
    commentaires: elCommentaires ? elCommentaires.value.trim() : "",
    date: new Date(elDate.value).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
  };

  submitButton.disabled = true;
  if (btnText) btnText.style.display = "none";
  if (btnLoader) btnLoader.style.display = "inline";
  if (messageDiv) messageDiv.style.display = "none";

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      showMessage("✅ Recommandation bien envoyée", "success");
      form.reset();
      setTodayDate();
    } else {
      throw new Error(`Erreur serveur (${response.status})`);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";
    showMessage(
      `❌ Erreur lors de l'envoi : ${errorMessage}. Veuillez réessayer.`,
      "error",
    );
  } finally {
    submitButton.disabled = false;
    if (btnText) btnText.style.display = "inline";
    if (btnLoader) btnLoader.style.display = "none";
  }
}

/** @param {string} text @param {"error"|"success"} type */
function showMessage(text, type) {
  const messageDiv = document.getElementById("message");
  if (messageDiv) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = "block";
    setTimeout(() => {
      messageDiv.style.display = "none";
    }, 5000);
  }
}
