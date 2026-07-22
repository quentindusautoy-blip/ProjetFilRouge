(() => {
    const API_PICTURES_URL =
        "/backend/api/pictures";

    const galerieImages =
        document.getElementById("allImages");

    const openCreatePictureModal =
        document.getElementById(
            "openCreatePictureModal"
        );

    const pictureForm =
        document.getElementById("pictureForm");

    const pictureModalLabel =
        document.getElementById(
            "pictureModalLabel"
        );

    const pictureIdInput =
        document.getElementById(
            "pictureIdInput"
        );

    const pictureTitleInput =
        document.getElementById(
            "pictureTitleInput"
        );

    const pictureAltTextInput =
        document.getElementById(
            "pictureAltTextInput"
        );

    const picturePositionInput =
        document.getElementById(
            "picturePositionInput"
        );

    const pictureFileInput =
        document.getElementById(
            "pictureFileInput"
        );

    const pictureFileContainer =
        document.getElementById(
            "pictureFileContainer"
        );

    const picturePublishedInput =
        document.getElementById(
            "picturePublishedInput"
        );

    const pictureFormMessage =
        document.getElementById(
            "pictureFormMessage"
        );

    const savePictureButton =
        document.getElementById(
            "savePictureButton"
        );

    const pictureModalElement =
        document.getElementById(
            "pictureModal"
        );

    const deletePictureModalElement =
        document.getElementById(
            "deletePictureModal"
        );

    const deletePictureIdInput =
        document.getElementById(
            "deletePictureIdInput"
        );

    const deletePictureMessage =
        document.getElementById(
            "deletePictureMessage"
        );

    const deletePictureTitle =
        document.getElementById(
            "deletePictureTitle"
        );

    const deletePicturePreview =
        document.getElementById(
            "deletePicturePreview"
        );

    const confirmDeletePictureButton =
        document.getElementById(
            "confirmDeletePictureButton"
        );

    if (!galerieImages) {
        console.error(
            "Le conteneur #allImages est introuvable."
        );
        return;
    }

    initializeGallery();

    /**
     * Initialise la galerie et ses événements.
     */
    function initializeGallery() {
        if (openCreatePictureModal) {
            openCreatePictureModal.addEventListener(
                "click",
                prepareCreatePictureForm
            );
        }

        if (pictureForm) {
            pictureForm.addEventListener(
                "submit",
                handlePictureFormSubmit
            );
        }

        if (confirmDeletePictureButton) {
            confirmDeletePictureButton.addEventListener(
                "click",
                deletePicture
            );
        }

        applyRoleVisibility();
        loadPictures();
    }

    /**
     * Charge les images publiées depuis l’API.
     */
    async function loadPictures() {
        displayGalleryMessage(
            "Chargement de la galerie..."
        );

        try {
            const response = await fetch(
                API_PICTURES_URL,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                    },
                }
            );

            const result =
                await readApiResponse(response);

            if (!response.ok) {
                throw new Error(
                    result.message ||
                    `Erreur HTTP ${response.status}`
                );
            }

            if (!Array.isArray(result)) {
                throw new TypeError(
                    "Le format de la réponse est invalide."
                );
            }

            galerieImages.replaceChildren();

            if (result.length === 0) {
                displayGalleryMessage(
                    "Aucune image n’est disponible dans la galerie."
                );
                return;
            }

            result.forEach((picture) => {
                galerieImages.appendChild(
                    createPictureCard(picture)
                );
            });

            applyRoleVisibility(galerieImages);
        } catch (error) {
            console.error(
                "Impossible de charger la galerie :",
                error
            );

            displayGalleryMessage(
                error.message ||
                "La galerie est momentanément indisponible.",
                true
            );
        }
    }

    /**
     * Construit une carte d’image.
     */
    function createPictureCard(picture) {
        const column =
            document.createElement("div");

        column.className = "col p-3";

        const card =
            document.createElement("div");

        card.className =
            "image-card text-white";

        const image =
            document.createElement("img");

        image.className = "rounded w-100";
        image.src = picture.url || "";
        image.alt =
            picture.altText ||
            picture.title ||
            "Image du restaurant";
        image.loading = "lazy";

        const title =
            document.createElement("p");

        title.className = "titre-image";
        title.textContent =
            picture.title || "Sans titre";

        card.append(
            image,
            title
        );

        /*
         * Les boutons ne sont créés que pour
         * l’administrateur connecté.
         */
        if (isAdminUser()) {
            const actions =
                createPictureActions(picture);

            card.appendChild(actions);
        }

        column.appendChild(card);

        return column;
    }

    /**
     * Construit les boutons Modifier et Supprimer.
     */
    function createPictureActions(picture) {
        const actions =
            document.createElement("div");

        actions.className =
            "action-image-buttons";

        actions.dataset.show = "admin";

        const editButton =
            document.createElement("button");

        editButton.type = "button";
        editButton.className =
            "btn btn-outline-light edit-btn";

        editButton.dataset.pictureId =
            String(picture.id ?? "");

        editButton.dataset.bsToggle = "modal";
        editButton.dataset.bsTarget =
            "#pictureModal";

        editButton.setAttribute(
            "aria-label",
            `Modifier l’image ${
                picture.title || ""
            }`
        );

        const editIcon =
            document.createElement("i");

        editIcon.className =
            "bi bi-pencil-square";

        editButton.appendChild(editIcon);

        editButton.addEventListener(
            "click",
            () => {
                prepareEditPictureForm(picture);
            }
        );

        const deleteButton =
            document.createElement("button");

        deleteButton.type = "button";
        deleteButton.className =
            "btn btn-outline-light";

        deleteButton.dataset.pictureId =
            String(picture.id ?? "");

        deleteButton.dataset.bsToggle = "modal";
        deleteButton.dataset.bsTarget =
            "#deletePictureModal";

        deleteButton.setAttribute(
            "aria-label",
            `Supprimer l’image ${
                picture.title || ""
            }`
        );

        const deleteIcon =
            document.createElement("i");

        deleteIcon.className =
            "bi bi-trash";

        deleteButton.appendChild(deleteIcon);

        deleteButton.addEventListener(
            "click",
            () => {
                prepareDeletePicture(picture);
            }
        );

        actions.append(
            editButton,
            deleteButton
        );

        return actions;
    }

    /**
     * Prépare le formulaire d’ajout.
     */
    function prepareCreatePictureForm() {
        if (!pictureForm) {
            return;
        }

        pictureForm.reset();

        pictureIdInput.value = "";
        picturePositionInput.value = "0";
        picturePublishedInput.checked = true;

        pictureFileInput.required = true;
        pictureFileInput.value = "";

        pictureFileContainer.classList.remove(
            "d-none"
        );

        pictureModalLabel.textContent =
            "Ajouter une photo";

        savePictureButton.textContent =
            "Enregistrer";

        hidePictureFormMessage();
    }

    /**
     * Prépare le formulaire de modification.
     */
    function prepareEditPictureForm(picture) {
        if (!pictureForm || !isAdminUser()) {
            return;
        }

        pictureForm.reset();

        pictureIdInput.value =
            String(picture.id);

        pictureTitleInput.value =
            picture.title || "";

        pictureAltTextInput.value =
            picture.altText || "";

        picturePositionInput.value =
            String(picture.position ?? 0);

        picturePublishedInput.checked =
            picture.isPublished === true;

        pictureFileInput.required = false;
        pictureFileInput.value = "";

        pictureFileContainer.classList.add(
            "d-none"
        );

        pictureModalLabel.textContent =
            "Modifier une photo";

        savePictureButton.textContent =
            "Enregistrer les modifications";

        hidePictureFormMessage();
    }

    /**
     * Choisit entre l’ajout et la modification.
     */
    async function handlePictureFormSubmit(event) {
        event.preventDefault();

        if (!isAdminUser()) {
            showPictureFormMessage(
                "Cette action est réservée à l’administrateur.",
                true
            );
            return;
        }

        const pictureId =
            Number(pictureIdInput.value);

        if (
            Number.isInteger(pictureId) &&
            pictureId > 0
        ) {
            await updatePicture(pictureId);
            return;
        }

        await createPicture();
    }

    /**
     * Ajoute une image.
     */
    async function createPicture() {
        const token =
            getAuthenticationToken();

        if (!token || !isAdminUser()) {
            showPictureFormMessage(
                "Vous devez être connecté comme administrateur.",
                true
            );
            return;
        }

        const image =
            pictureFileInput.files[0];

        const title =
            pictureTitleInput.value.trim();

        const position =
            Number(picturePositionInput.value);

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

        if (
            !Number.isInteger(position) ||
            position < 0
        ) {
            showPictureFormMessage(
                "La position doit être un entier positif ou nul.",
                true
            );
            return;
        }

        const formData = new FormData();

        formData.append(
            "title",
            title
        );

        formData.append(
            "altText",
            pictureAltTextInput.value.trim()
        );

        formData.append(
            "position",
            String(position)
        );

        formData.append(
            "isPublished",
            picturePublishedInput.checked
                ? "true"
                : "false"
        );

        formData.append(
            "restaurantId",
            "1"
        );

        formData.append(
            "image",
            image
        );

        setSaveButtonState(
            true,
            "Enregistrement..."
        );

        hidePictureFormMessage();

        try {
            const response = await fetch(
                API_PICTURES_URL,
                {
                    method: "POST",
                    headers: {
                        "X-AUTH-TOKEN": token,
                        Accept: "application/json",
                    },
                    body: formData,
                }
            );

            const result =
                await readApiResponse(response);

            if (!response.ok) {
                throw new Error(
                    result.message ||
                    `Erreur HTTP ${response.status}`
                );
            }

            closeBootstrapModal(
                pictureModalElement
            );

            pictureForm.reset();
            pictureIdInput.value = "";

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
            setSaveButtonState(
                false,
                "Enregistrer"
            );
        }
    }

    /**
     * Modifie une image.
     */
    async function updatePicture(pictureId) {
        const token =
            getAuthenticationToken();

        const title =
            pictureTitleInput.value.trim();

        const position =
            Number(picturePositionInput.value);

        if (!token || !isAdminUser()) {
            showPictureFormMessage(
                "Vous devez être connecté comme administrateur.",
                true
            );
            return;
        }

        if (title === "") {
            showPictureFormMessage(
                "Le titre est obligatoire.",
                true
            );
            return;
        }

        if (
            !Number.isInteger(position) ||
            position < 0
        ) {
            showPictureFormMessage(
                "La position doit être un entier positif ou nul.",
                true
            );
            return;
        }

        const body = {
            title,
            altText:
                pictureAltTextInput.value.trim(),
            position,
            isPublished:
                picturePublishedInput.checked,
        };

        setSaveButtonState(
            true,
            "Modification..."
        );

        hidePictureFormMessage();

        try {
            const response = await fetch(
                `${API_PICTURES_URL}/${pictureId}`,
                {
                    method: "PATCH",
                    headers: {
                        "X-AUTH-TOKEN": token,
                        Accept: "application/json",
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify(body),
                }
            );

            const result =
                await readApiResponse(response);

            if (!response.ok) {
                throw new Error(
                    result.message ||
                    `Erreur HTTP ${response.status}`
                );
            }

            closeBootstrapModal(
                pictureModalElement
            );

            pictureForm.reset();
            pictureIdInput.value = "";

            await loadPictures();
        } catch (error) {
            console.error(
                "Erreur pendant la modification de l’image :",
                error
            );

            showPictureFormMessage(
                error.message ||
                "Impossible de modifier l’image.",
                true
            );
        } finally {
            setSaveButtonState(
                false,
                "Enregistrer"
            );
        }
    }

    /**
     * Prépare la confirmation de suppression.
     */
    function prepareDeletePicture(picture) {
        if (!isAdminUser()) {
            return;
        }

        deletePictureIdInput.value =
            String(picture.id);

        deletePictureTitle.textContent =
            `Confirmer la suppression de « ${
                picture.title ||
                "Image sans titre"
            } » ?`;

        if (picture.url) {
            deletePicturePreview.src =
                picture.url;

            deletePicturePreview.alt =
                picture.altText ||
                picture.title ||
                "Image à supprimer";

            deletePicturePreview.classList.remove(
                "d-none"
            );
        } else {
            deletePicturePreview.removeAttribute(
                "src"
            );

            deletePicturePreview.alt = "";

            deletePicturePreview.classList.add(
                "d-none"
            );
        }

        hideDeletePictureMessage();

        confirmDeletePictureButton.disabled =
            false;

        confirmDeletePictureButton.textContent =
            "Supprimer";
    }

    /**
     * Supprime une image.
     */
    async function deletePicture() {
        const pictureId =
            Number(deletePictureIdInput.value);

        const token =
            getAuthenticationToken();

        if (
            !Number.isInteger(pictureId) ||
            pictureId <= 0
        ) {
            showDeletePictureMessage(
                "L’identifiant de l’image est invalide.",
                true
            );
            return;
        }

        if (!token || !isAdminUser()) {
            showDeletePictureMessage(
                "Vous devez être connecté comme administrateur.",
                true
            );
            return;
        }

        confirmDeletePictureButton.disabled =
            true;

        confirmDeletePictureButton.textContent =
            "Suppression...";

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

            const result =
                await readApiResponse(response);

            if (!response.ok) {
                throw new Error(
                    result.message ||
                    `Erreur HTTP ${response.status}`
                );
            }

            closeBootstrapModal(
                deletePictureModalElement
            );

            resetDeletePictureModal();

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
            confirmDeletePictureButton.disabled =
                false;

            confirmDeletePictureButton.textContent =
                "Supprimer";
        }
    }

    /**
     * Réinitialise la fenêtre de suppression.
     */
    function resetDeletePictureModal() {
        deletePictureIdInput.value = "";
        deletePictureTitle.textContent = "";

        deletePicturePreview.removeAttribute(
            "src"
        );

        deletePicturePreview.alt = "";

        deletePicturePreview.classList.add(
            "d-none"
        );

        hideDeletePictureMessage();
    }

    /**
     * Lit une réponse JSON, y compris une réponse 204.
     */
    async function readApiResponse(response) {
        if (response.status === 204) {
            return {};
        }

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";

        if (
            contentType.includes(
                "application/json"
            )
        ) {
            return response.json();
        }

        return {};
    }

    /**
     * Affiche un message dans la galerie.
     */
    function displayGalleryMessage(
        message,
        isError = false
    ) {
        galerieImages.replaceChildren();

        const paragraph =
            document.createElement("p");

        paragraph.className = isError
            ? "text-danger text-center py-5"
            : "text-center py-5";

        paragraph.textContent = message;

        galerieImages.appendChild(paragraph);
    }

    function showPictureFormMessage(
        message,
        isError = false
    ) {
        if (!pictureFormMessage) {
            return;
        }

        pictureFormMessage.textContent =
            message;

        pictureFormMessage.classList.remove(
            "d-none",
            "alert-danger",
            "alert-success"
        );

        pictureFormMessage.classList.add(
            isError
                ? "alert-danger"
                : "alert-success"
        );
    }

    function hidePictureFormMessage() {
        if (!pictureFormMessage) {
            return;
        }

        pictureFormMessage.textContent = "";

        pictureFormMessage.classList.add(
            "d-none"
        );

        pictureFormMessage.classList.remove(
            "alert-danger",
            "alert-success"
        );
    }

    function showDeletePictureMessage(
        message,
        isError = false
    ) {
        if (!deletePictureMessage) {
            return;
        }

        deletePictureMessage.textContent =
            message;

        deletePictureMessage.classList.remove(
            "d-none",
            "alert-danger",
            "alert-success"
        );

        deletePictureMessage.classList.add(
            isError
                ? "alert-danger"
                : "alert-success"
        );
    }

    function hideDeletePictureMessage() {
        if (!deletePictureMessage) {
            return;
        }

        deletePictureMessage.textContent = "";

        deletePictureMessage.classList.add(
            "d-none"
        );

        deletePictureMessage.classList.remove(
            "alert-danger",
            "alert-success"
        );
    }

    function setSaveButtonState(
        disabled,
        text
    ) {
        if (!savePictureButton) {
            return;
        }

        savePictureButton.disabled = disabled;
        savePictureButton.textContent = text;
    }

    /**
     * Ferme une fenêtre Bootstrap.
     */
    function closeBootstrapModal(modalElement) {
        if (
            !modalElement ||
            !globalThis.bootstrap?.Modal
        ) {
            return;
        }

        globalThis.bootstrap.Modal
            .getOrCreateInstance(modalElement)
            .hide();
    }

    /**
     * Renvoie le jeton stocké dans le cookie.
     */
    function getAuthenticationToken() {
        if (
            typeof globalThis.getToken ===
            "function"
        ) {
            return globalThis.getToken();
        }

        return null;
    }

    /**
     * Vérifie que le compte connecté est administrateur.
     */
    function isAdminUser() {
        const role =
            typeof globalThis.getRole ===
            "function"
                ? globalThis.getRole()
                : null;

        const connected =
            typeof globalThis.isConnected ===
            "function"
                ? globalThis.isConnected()
                : Boolean(
                    getAuthenticationToken()
                );

        return connected && role === "admin";
    }

    /**
     * Applique la visibilité data-show.
     */
    function applyRoleVisibility(
        rootElement = document
    ) {
        if (
            typeof globalThis
                .showAndhideElementsForRoles ===
            "function"
        ) {
            globalThis
                .showAndhideElementsForRoles(
                    rootElement
                );
        }
    }
})();