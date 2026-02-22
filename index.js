// Configuration
const WEBHOOK_URL = "https://n8n.srv1156867.hstgr.cloud/webhook/referral";

// Liste des membres Cap Business avec leurs emails
const MEMBRES = {
  "Aurélie Debord": "aurelie.debord@fidal.com",
  "Grégory Doranges": "contact@doranges-avocat.fr",
  "Guillaume Durand": "larochelle@ixina.com",
  "Geoffrey Leduc": "hello@agence-basalte.fr",
  "Gaetan Gousseau": "contact@volttech.fr",
  "Aude Mayaud": "contact@serenaservices.fr",
  "Aurélie Doranges": "aurelie.doranges@avocat-doranges.fr",
  "Cyrille Gallais": "info@portraitscygal.fr",
  "Vincent Mauvillain": "Vincent.mauvillain@outlook.fr",
  "Stéphane Cayez": "larochelle-iledere@freedomboatclub.fr",
  "Denis Dufeu": "denis.dufeu@safti.fr",
  "Stanislas Delanoue": "sdelanoue@exaltconseil.com",
  "Ava Telisman": "contact@bspcpoele.pro",
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
};

// Initialisation au chargement du DOM
document.addEventListener("DOMContentLoaded", function () {
  initializeForm();
});

function initializeForm() {
  const origineSelect = document.getElementById("origine");
  const destinataireSelect = document.getElementById("destinataire");
  const dateInput = document.getElementById("date");

  if (dateInput) {
    const today = new Date().toISOString().split("T")[0];
    dateInput.value = today;
  }

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

  const form = document.getElementById("recommendationForm");
  if (form) {
    form.addEventListener("submit", handleSubmit);
  }

  const consentCheckbox = document.getElementById("consent");
  const checkboxGroup = document.querySelector(".checkbox-group");
  if (consentCheckbox && checkboxGroup) {
    consentCheckbox.addEventListener("change", function () {
      if (this.checked) {
        checkboxGroup.classList.add("checked");
      } else {
        checkboxGroup.classList.remove("checked");
      }
    });
  }
}

function setTodayDate() {
  const dateInput = document.getElementById("date");
  if (dateInput) {
    const today = new Date().toISOString().split("T")[0];
    dateInput.value = today;
  }
}

async function handleSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const consentCheckbox = document.getElementById("consent");
  const messageDiv = document.getElementById("message");
  const submitButton = form.querySelector('button[type="submit"]');
  const btnText = submitButton.querySelector(".btn-text");
  const btnLoader = submitButton.querySelector(".btn-loader");

  if (!consentCheckbox.checked) {
    showMessage(
      "⚠️ Vous devez confirmer le consentement du contact avant d'envoyer.",
      "error",
    );
    return;
  }

  const elOrigine = document.getElementById("origine");
  const elDestinataire = document.getElementById("destinataire");
  const elContact =
    document.getElementById("contact") || document.getElementById("prospect");
  const elEmail = document.getElementById("email");
  const elTelephone = document.getElementById("telephone");
  const elDate = document.getElementById("date");

  const elCommentaires = document.getElementById("commentaires");
  if (!elOrigine || !elDestinataire || !elContact || !elDate) {
    showMessage("❌ Erreur technique : formulaire incomplet.", "error");
    return;
  }

  const origine = elOrigine.value;
  const origineEmail = MEMBRES[origine] || "";
  const destinataire = elDestinataire.value;
  const destinataireEmail = MEMBRES[destinataire] || "";

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

  const formData = {
    origine: origine,
    origineEmail: origineEmail,
    destinataire: destinataire,
    destinataireEmail: destinataireEmail,
    contact: elContact.value,
    email: elEmail.value,
    telephone: elTelephone.value,
    commentaires: elCommentaires ? elCommentaires.value : "",
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
    showMessage(
      `❌ Erreur lors de l'envoi : ${error.message}. Veuillez réessayer.`,
      "error",
    );
  } finally {
    submitButton.disabled = false;
    if (btnText) btnText.style.display = "inline";
    if (btnLoader) btnLoader.style.display = "none";
  }
}

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
