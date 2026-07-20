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
            throw new TypeError("Le format de la réponse est invalide.");
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
    editButton.dataset.bsTarget = "#pictureModal";
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
    deleteButton.dataset.bsTarget = "#deletePictureModal";
    deleteButton.setAttribute(
        "aria-label",
        `Supprimer l’image ${picture.title || ""}`
    );

    const deleteIcon = document.createElement("i");
    deleteIcon.className = "bi bi-trash";
    deleteButton.appendChild(deleteIcon);
    deleteButton.addEventListener("click", () => {
    prepareDeletePicture(picture);
    });

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

const openCreatePictureModal = document.getElementById(
    "openCreatePictureModal"
);

const pictureForm = document.getElementById("pictureForm");
const pictureModalLabel = document.getElementById("pictureModalLabel");
const pictureIdInput = document.getElementById("pictureIdInput");
const pictureTitleInput = document.getElementById(
    "pictureTitleInput"
);
const pictureAltTextInput = document.getElementById(
    "pictureAltTextInput"
);
const picturePositionInput = document.getElementById(
    "picturePositionInput"
);
const pictureFileInput = document.getElementById(
    "pictureFileInput"
);
const pictureFileContainer = document.getElementById(
    "pictureFileContainer"
);
const picturePublishedInput = document.getElementById(
    "picturePublishedInput"
);
const pictureFormMessage = document.getElementById(
    "pictureFormMessage"
);
const savePictureButton = document.getElementById(
    "savePictureButton"
);

if (openCreatePictureModal) {
    openCreatePictureModal.addEventListener("click", () => {
        prepareCreatePictureForm();
    });
}

if (pictureForm) {
    pictureForm.addEventListener("submit", createPicture);
}

function prepareCreatePictureForm() {
    pictureForm.reset();

    pictureIdInput.value = "";
    picturePositionInput.value = "0";
    picturePublishedInput.checked = true;
    pictureFileInput.required = true;
    pictureFileContainer.classList.remove("d-none");

    pictureModalLabel.textContent = "Ajouter une photo";
    savePictureButton.textContent = "Enregistrer";

    hidePictureFormMessage();
}

async function createPicture(event) {
    event.preventDefault();

    const token = getToken();

    if (!token) {
        showPictureFormMessage(
            "Vous devez être connecté comme administrateur.",
            true
        );
        return;
    }

    const image = pictureFileInput.files[0];
    const title = pictureTitleInput.value.trim();

    if (title === "") {
        showPictureFormMessage(
            "Le titre est obligatoire.",
            true
        );
        return;
    }

    if (!image) {
        showPictureFormMessage(
            "Sélectionnez une image.",
            true
        );
        return;
    }

    const formData = new FormData();

    formData.append("title", title);
    formData.append(
        "altText",
        pictureAltTextInput.value.trim()
    );
    formData.append(
        "position",
        picturePositionInput.value
    );
    formData.append(
        "isPublished",
        picturePublishedInput.checked
            ? "true"
            : "false"
    );

    formData.append("restaurantId", "1");
    formData.append("image", image);

    savePictureButton.disabled = true;
    savePictureButton.textContent = "Enregistrement...";

    hidePictureFormMessage();

    try {
        const response = await fetch(API_PICTURES_URL, {
            method: "POST",
            headers: {
                "X-AUTH-TOKEN": token,
                Accept: "application/json",
            },
            body: formData,
        });

        const result = await readApiResponse(response);

        if (!response.ok) {
            throw new Error(
                result.message ||
                `Erreur HTTP ${response.status}`
            );
        }

        const modalElement =
            document.getElementById("pictureModal");

        bootstrap.Modal
            .getOrCreateInstance(modalElement)
            .hide();

        pictureForm.reset();

        await loadPictures();
    } catch (error) {
        console.error(
            "Erreur pendant l’ajout de l’image :",
            error
        );

        showPictureFormMessage(
            error.message ||
            "Impossible d’ajouter l’image.",
            true
        );
    } finally {
        savePictureButton.disabled = false;
        savePictureButton.textContent = "Enregistrer";
    }
}

async function readApiResponse(response) {
    const contentType =
        response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        return response.json();
    }

    return {};
}

function showPictureFormMessage(message, isError = false) {
    pictureFormMessage.textContent = message;

    pictureFormMessage.classList.remove(
        "d-none",
        "alert-danger",
        "alert-success"
    );

    pictureFormMessage.classList.add(
        isError ? "alert-danger" : "alert-success"
    );
}

function hidePictureFormMessage() {
    pictureFormMessage.textContent = "";

    pictureFormMessage.classList.add("d-none");

    pictureFormMessage.classList.remove(
        "alert-danger",
        "alert-success"
    );
}
const deletePictureModalElement = document.getElementById(
    "deletePictureModal"
);

const deletePictureIdInput = document.getElementById(
    "deletePictureIdInput"
);

const deletePictureMessage = document.getElementById(
    "deletePictureMessage"
);

const deletePictureTitle = document.getElementById(
    "deletePictureTitle"
);

const deletePicturePreview = document.getElementById(
    "deletePicturePreview"
);

const confirmDeletePictureButton = document.getElementById(
    "confirmDeletePictureButton"
);

if (confirmDeletePictureButton) {
    confirmDeletePictureButton.addEventListener(
        "click",
        deletePicture
    );
}

/**
 * Prépare la fenêtre de confirmation de suppression.
 */
function prepareDeletePicture(picture) {
    deletePictureIdInput.value = String(picture.id);

    deletePictureTitle.textContent =
        `Confirmer la suppression de « ${
            picture.title || "Image sans titre"
        } » ?`;

    if (picture.url) {
        deletePicturePreview.src = picture.url;

        deletePicturePreview.alt =
            picture.altText ||
            picture.title ||
            "Image à supprimer";

        deletePicturePreview.classList.remove("d-none");
    } else {
        deletePicturePreview.removeAttribute("src");
        deletePicturePreview.alt = "";
        deletePicturePreview.classList.add("d-none");
    }

    hideDeletePictureMessage();

    confirmDeletePictureButton.disabled = false;
    confirmDeletePictureButton.textContent = "Supprimer";
}

/**
 * Envoie la demande de suppression à l’API Symfony.
 */
async function deletePicture() {
    const pictureId = Number(deletePictureIdInput.value);
    const token = getToken();

    if (!Number.isInteger(pictureId) || pictureId <= 0) {
        showDeletePictureMessage(
            "L’identifiant de l’image est invalide.",
            true
        );
        return;
    }

    if (!token) {
        showDeletePictureMessage(
            "Vous devez être connecté comme administrateur.",
            true
        );
        return;
    }

    confirmDeletePictureButton.disabled = true;
    confirmDeletePictureButton.textContent = "Suppression...";

    hideDeletePictureMessage();

    try {
        const response = await fetch(
            `${API_PICTURES_URL}/${pictureId}`,
            {
                method: "DELETE",
                headers: {
                    "X-AUTH-TOKEN": token,
                    Accept: "application/json",
                },
            }
        );

        const result = await readApiResponse(response);

        if (!response.ok) {
            throw new Error(
                result.message ||
                `Erreur HTTP ${response.status}`
            );
        }

        bootstrap.Modal
            .getOrCreateInstance(deletePictureModalElement)
            .hide();

        deletePictureIdInput.value = "";
        deletePictureTitle.textContent = "";
        deletePicturePreview.removeAttribute("src");
        deletePicturePreview.alt = "";
        deletePicturePreview.classList.add("d-none");

        await loadPictures();
    } catch (error) {
        console.error(
            "Erreur pendant la suppression de l’image :",
            error
        );

        showDeletePictureMessage(
            error.message ||
            "Impossible de supprimer l’image.",
            true
        );
    } finally {
        confirmDeletePictureButton.disabled = false;
        confirmDeletePictureButton.textContent = "Supprimer";
    }
}

function showDeletePictureMessage(
    message,
    isError = false
) {
    deletePictureMessage.textContent = message;

    deletePictureMessage.classList.remove(
        "d-none",
        "alert-danger",
        "alert-success"
    );

    deletePictureMessage.classList.add(
        isError ? "alert-danger" : "alert-success"
    );
}

    function hideDeletePictureMessage() {
        deletePictureMessage.textContent = "";

        deletePictureMessage.classList.add("d-none");

        deletePictureMessage.classList.remove(
            "alert-danger",
            "alert-success"
        );
}