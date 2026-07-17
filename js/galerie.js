const API_PICTURES_URL = "http://127.0.0.1:8000/api/pictures";

const galerieImages = document.getElementById("allImages");

if (!galerieImages) {
    console.error("Le conteneur #allImages est introuvable.");
} else {
    loadPictures();
}

/**
 * Charge les images publiées depuis l’API Symfony.
 */
async function loadPictures() {
    displayMessage("Chargement de la galerie...");

    try {
        const response = await fetch(API_PICTURES_URL, {
            method: "GET",
            headers: {
                Accept: "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP ${response.status}`);
        }

        const pictures = await response.json();

        if (!Array.isArray(pictures)) {
            throw new Error("Le format de la réponse est invalide.");
        }

        galerieImages.replaceChildren();

        if (pictures.length === 0) {
            displayMessage("Aucune image n’est disponible dans la galerie.");
            return;
        }

        pictures.forEach((picture) => {
            galerieImages.appendChild(createPictureCard(picture));
        });
    } catch (error) {
        console.error("Impossible de charger la galerie :", error);

        displayMessage(
            "La galerie est momentanément indisponible.",
            true
        );
    }
}

/**
 * Construit une carte d’image sans injecter de contenu HTML provenant de l’API.
 */
function createPictureCard(picture) {
    const column = document.createElement("div");
    column.className = "col p-3";

    const card = document.createElement("div");
    card.className = "image-card text-white";

    const image = document.createElement("img");
    image.className = "rounded w-100";
    image.src = picture.url;
    image.alt =
        picture.altText ||
        picture.title ||
        "Image du restaurant";
    image.loading = "lazy";

    const title = document.createElement("p");
    title.className = "titre-image";
    title.textContent = picture.title || "Sans titre";

    const actions = document.createElement("div");
    actions.className = "action-image-buttons";
    actions.dataset.show = "admin";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "btn btn-outline-light edit-btn";
    editButton.dataset.pictureId = picture.id;
    editButton.dataset.bsToggle = "modal";
    editButton.dataset.bsTarget = "#exampleModal";
    editButton.setAttribute(
        "aria-label",
        `Modifier l’image ${picture.title || ""}`
    );

    const editIcon = document.createElement("i");
    editIcon.className = "bi bi-pencil-square";
    editButton.appendChild(editIcon);

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "btn btn-outline-light";
    deleteButton.dataset.pictureId = picture.id;
    deleteButton.dataset.bsToggle = "modal";
    deleteButton.dataset.bsTarget = "#DeletePhotoModal";
    deleteButton.setAttribute(
        "aria-label",
        `Supprimer l’image ${picture.title || ""}`
    );

    const deleteIcon = document.createElement("i");
    deleteIcon.className = "bi bi-trash";
    deleteButton.appendChild(deleteIcon);

    actions.append(editButton, deleteButton);
    card.append(image, title, actions);
    column.appendChild(card);

    return column;
}

/**
 * Affiche un message dans la zone de galerie.
 */
function displayMessage(message, isError = false) {
    galerieImages.replaceChildren();

    const paragraph = document.createElement("p");
    paragraph.className = isError
        ? "text-danger text-center py-5"
        : "text-center py-5";

    paragraph.textContent = message;

    galerieImages.appendChild(paragraph);
}