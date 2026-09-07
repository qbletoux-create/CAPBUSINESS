// Configuration
const WEBHOOK_URL = "https://n8n.laboiteaoutia.fr/webhook/referral";

// Liste des membres Cap Business (noms uniquement - les emails sont gérés
// côté serveur par le workflow n8n, jamais exposés au client)
const MEMBRES = [
  "Aurélie Debord",
  "Grégory Doranges",
  "Guillaume Durand",
  "Geoffrey Leduc",
  "Gaetan Gousseau",
  "Aude Mayaud",
  "Aurélie Doranges",
  "Cyrille Gallais",
  "Vincent Mauvillain",
  "Stéphane Cayez",
  "Denis Dufeu",
  "Stanislas Delanoue",
  "Ava Telisman",
  "Kenny Bouzon",
  "Tarik Arich",
  "Mickael Maingard",
  "Michael Virginius",
  "Sylvain Cordier",
  "Léo Picon",
  "Quentin Bletoux",
  "Jérémy Dos Santos",
  "Romain Chuburu",
  "Jérémy Baty",
  "Sabine Cantal",
  "Jennifer David",
  "Kévin Louis",
];

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
    MEMBRES.forEach((membre) => {
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
  const destinataire = elDestinataire.value;

  if (origine && destinataire && origine === destinataire) {
    showMessage(
      "⚠️ L'origine et le destinataire doivent être différents.",
      "error",
    );
    return;
  }

  if (!MEMBRES.includes(origine)) {
    showMessage(`⚠️ Membre "${origine}" inconnu.`, "error");
    return;
  }
  if (!MEMBRES.includes(destinataire)) {
    showMessage(`⚠️ Membre "${destinataire}" inconnu.`, "error");
    return;
  }

  const email = elEmail ? elEmail.value.trim() : "";
  const telephone = elTelephone ? elTelephone.value.trim() : "";

  // Les emails des membres ne sont plus envoyés depuis le client : le
  // workflow n8n retrouve destinataireEmail/origineEmail lui-même à partir
  // du nom, sur la base de sa propre liste (jamais exposée au navigateur).
  const formData = {
    origine,
    destinataire,
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
      let serverMessage = "";
      try {
        const errorPayload = await response.json();
        serverMessage = errorPayload && errorPayload.error ? errorPayload.error : "";
      } catch {
        // Pas de corps JSON exploitable, on garde le message générique.
      }
      throw new Error(serverMessage || `Erreur serveur (${response.status})`);
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
