(() => {
    const API_CATEGORIES_URL =
        "http://127.0.0.1:8000/api/admin/categories";

    const form =
        document.getElementById(
            "categoryAdminForm"
        );

    const categoryIdInput =
        document.getElementById(
            "categoryIdInput"
        );

    const nameInput =
        document.getElementById(
            "categoryNameInput"
        );

    const descriptionInput =
        document.getElementById(
            "categoryDescriptionInput"
        );

    const positionInput =
        document.getElementById(
            "categoryPositionInput"
        );

    const formTitle =
        document.getElementById(
            "categoryFormTitle"
        );

    const submitButton =
        document.getElementById(
            "categorySubmitButton"
        );

    const cancelEditButton =
        document.getElementById(
            "categoryCancelEditButton"
        );

    const refreshButton =
        document.getElementById(
            "categoryRefreshButton"
        );

    const messageContainer =
        document.getElementById(
            "categoryAdminMessage"
        );

    const loadingContainer =
        document.getElementById(
            "categoryLoading"
        );

    const tableContainer =
        document.getElementById(
            "categoryTableContainer"
        );

    const tableBody =
        document.getElementById(
            "categoryTableBody"
        );

    const emptyMessage =
        document.getElementById(
            "categoryEmptyMessage"
        );

    if (
        !form ||
        !categoryIdInput ||
        !nameInput ||
        !descriptionInput ||
        !positionInput ||
        !formTitle ||
        !submitButton ||
        !cancelEditButton ||
        !refreshButton ||
        !messageContainer ||
        !loadingContainer ||
        !tableContainer ||
        !tableBody ||
        !emptyMessage
    ) {
        console.error(
            "La page d’administration des catégories est incomplète."
        );

        return;
    }

    let categories = [];
    let requestInProgress = false;

    initializePage();

    function initializePage() {
        form.addEventListener(
            "submit",
            saveCategory
        );

        cancelEditButton.addEventListener(
            "click",
            resetForm
        );

        refreshButton.addEventListener(
            "click",
            loadCategories
        );

        loadCategories();
    }

    /**
     * Charge les catégories depuis l’API.
     */
    async function loadCategories() {
        const token =
            getAuthenticationToken();

        if (!token) {
            showMessage(
                "Vous devez être connecté comme administrateur.",
                true
            );

            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                API_CATEGORIES_URL,
                {
                    method: "GET",
                    headers: {
                        "X-AUTH-TOKEN": token,
                        Accept: "application/json",
                    },
                }
            );

            const result =
                await readApiResponse(response);

            if (!response.ok) {
                throw createApiError(
                    response,
                    result
                );
            }

            categories =
                Array.isArray(result.categories)
                    ? result.categories
                    : [];

            renderCategories();
            updateDefaultPosition();
        } catch (error) {
            console.error(
                "Impossible de charger les catégories :",
                error
            );

            showMessage(
                error.message ||
                "Impossible de charger les catégories.",
                true
            );
        } finally {
            setLoading(false);
        }
    }

    /**
     * Affiche les catégories dans le tableau.
     */
    function renderCategories() {
        tableBody.replaceChildren();

        if (categories.length === 0) {
            tableContainer.classList.add(
                "d-none"
            );

            emptyMessage.classList.remove(
                "d-none"
            );

            return;
        }

        emptyMessage.classList.add(
            "d-none"
        );

        tableContainer.classList.remove(
            "d-none"
        );

        const fragment =
            document.createDocumentFragment();

        categories.forEach((category) => {
            fragment.appendChild(
                createCategoryRow(category)
            );
        });

        tableBody.appendChild(fragment);
    }

    function createCategoryRow(category) {
        const row =
            document.createElement("tr");

        const positionCell =
            document.createElement("td");

        const positionBadge =
            document.createElement("span");

        positionBadge.className =
            "badge text-bg-dark";

        positionBadge.textContent =
            String(category.position ?? "");

        positionCell.appendChild(
            positionBadge
        );

        const nameCell =
            document.createElement("td");

        const name =
            document.createElement("strong");

        name.textContent =
            category.name || "Catégorie";

        nameCell.appendChild(name);

        const descriptionCell =
            document.createElement("td");

        descriptionCell.textContent =
            category.description ||
            "Aucune description";

        const foodCountCell =
            document.createElement("td");

        const foodCount =
            Number(category.foodCount) || 0;

        foodCountCell.textContent =
            foodCount === 0
                ? "Aucun plat"
                : foodCount === 1
                    ? "1 plat"
                    : `${foodCount} plats`;

        const actionsCell =
            document.createElement("td");

        actionsCell.className =
            "text-end text-nowrap";

        const editButton =
            document.createElement("button");

        editButton.type = "button";

        editButton.className =
            "btn btn-sm btn-outline-primary me-2";

        editButton.setAttribute(
            "aria-label",
            `Modifier ${category.name}`
        );

        const editIcon =
            document.createElement("i");

        editIcon.className =
            "bi bi-pencil-square";

        editButton.appendChild(editIcon);

        editButton.addEventListener(
            "click",
            () => startEditing(category)
        );

        const deleteButton =
            document.createElement("button");

        deleteButton.type = "button";

        deleteButton.className =
            "btn btn-sm btn-outline-danger";

        deleteButton.setAttribute(
            "aria-label",
            `Supprimer ${category.name}`
        );

        const deleteIcon =
            document.createElement("i");

        deleteIcon.className =
            "bi bi-trash";

        deleteButton.appendChild(
            deleteIcon
        );

        if (foodCount > 0) {
            deleteButton.disabled = true;

            deleteButton.title =
                "Déplacez ou supprimez les plats avant de supprimer cette catégorie.";
        } else {
            deleteButton.addEventListener(
                "click",
                () => deleteCategory(category)
            );
        }

        actionsCell.append(
            editButton,
            deleteButton
        );

        row.append(
            positionCell,
            nameCell,
            descriptionCell,
            foodCountCell,
            actionsCell
        );

        return row;
    }

    /**
     * Crée ou modifie une catégorie.
     */
    async function saveCategory(event) {
        event.preventDefault();

        if (requestInProgress) {
            return;
        }

        const token =
            getAuthenticationToken();

        if (!token) {
            showMessage(
                "Vous devez être connecté comme administrateur.",
                true
            );

            return;
        }

        const categoryId =
            categoryIdInput.value.trim();

        const name =
            nameInput.value.trim();

        const description =
            descriptionInput.value.trim();

        const position =
            Number(positionInput.value);

        if (
            name.length < 2 ||
            name.length > 64
        ) {
            showMessage(
                "Le nom doit contenir entre 2 et 64 caractères.",
                true
            );

            return;
        }

        if (
            description.length > 2000
        ) {
            showMessage(
                "La description ne doit pas dépasser 2000 caractères.",
                true
            );

            return;
        }

        if (
            !Number.isInteger(position) ||
            position < 1 ||
            position > 1000
        ) {
            showMessage(
                "La position doit être comprise entre 1 et 1000.",
                true
            );

            return;
        }

        const body = {
            name,
            description:
                description === ""
                    ? null
                    : description,
            position,
        };

        const isEditing =
            categoryId !== "";

        const requestUrl =
            isEditing
                ? `${API_CATEGORIES_URL}/${categoryId}`
                : API_CATEGORIES_URL;

        const requestMethod =
            isEditing
                ? "PATCH"
                : "POST";

        setRequestInProgress(true);
        hideMessage();

        try {
            const response = await fetch(
                requestUrl,
                {
                    method: requestMethod,
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
                throw createApiError(
                    response,
                    result
                );
            }

            showMessage(
                result.message ||
                (
                    isEditing
                        ? "La catégorie a été modifiée."
                        : "La catégorie a été créée."
                ),
                false
            );

            resetForm();
            await loadCategories();
        } catch (error) {
            console.error(
                "Impossible d’enregistrer la catégorie :",
                error
            );

            showMessage(
                error.message ||
                "Impossible d’enregistrer la catégorie.",
                true
            );
        } finally {
            setRequestInProgress(false);
        }
    }

    function startEditing(category) {
        categoryIdInput.value =
            String(category.id);

        nameInput.value =
            category.name || "";

        descriptionInput.value =
            category.description || "";

        positionInput.value =
            String(category.position ?? 1);

        formTitle.textContent =
            "Modifier la catégorie";

        submitButton.textContent =
            "Enregistrer les modifications";

        cancelEditButton.classList.remove(
            "d-none"
        );

        form.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    }

    function resetForm() {
        form.reset();

        categoryIdInput.value = "";

        formTitle.textContent =
            "Ajouter une catégorie";

        submitButton.textContent =
            "Ajouter la catégorie";

        cancelEditButton.classList.add(
            "d-none"
        );

        updateDefaultPosition();
    }

    function updateDefaultPosition() {
        if (categoryIdInput.value !== "") {
            return;
        }

        const highestPosition =
            categories.reduce(
                (
                    highest,
                    category
                ) => {
                    const position =
                        Number(
                            category.position
                        );

                    if (
                        Number.isInteger(position) &&
                        position > highest
                    ) {
                        return position;
                    }

                    return highest;
                },
                0
            );

        positionInput.value =
            String(highestPosition + 1);
    }

    async function deleteCategory(category) {
        if (
            Number(category.foodCount) > 0
        ) {
            showMessage(
                "Cette catégorie contient encore des plats.",
                true
            );

            return;
        }

        const confirmed =
            globalThis.confirm(
                `Voulez-vous supprimer définitivement la catégorie « ${category.name} » ?`
            );

        if (!confirmed) {
            return;
        }

        const token =
            getAuthenticationToken();

        if (!token) {
            showMessage(
                "Vous devez être connecté comme administrateur.",
                true
            );

            return;
        }

        try {
            const response = await fetch(
                `${API_CATEGORIES_URL}/${category.id}`,
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
                throw createApiError(
                    response,
                    result
                );
            }

            if (
                categoryIdInput.value ===
                String(category.id)
            ) {
                resetForm();
            }

            showMessage(
                "La catégorie a été supprimée.",
                false
            );

            await loadCategories();
        } catch (error) {
            console.error(
                "Impossible de supprimer la catégorie :",
                error
            );

            showMessage(
                error.message ||
                "Impossible de supprimer la catégorie.",
                true
            );
        }
    }

    function setRequestInProgress(
        inProgress
    ) {
        requestInProgress =
            inProgress;

        submitButton.disabled =
            inProgress;

        cancelEditButton.disabled =
            inProgress;

        submitButton.textContent =
            inProgress
                ? "Enregistrement..."
                : (
                    categoryIdInput.value
                        ? "Enregistrer les modifications"
                        : "Ajouter la catégorie"
                );
    }

    function setLoading(isLoading) {
        loadingContainer.classList.toggle(
            "d-none",
            !isLoading
        );

        if (isLoading) {
            tableContainer.classList.add(
                "d-none"
            );

            emptyMessage.classList.add(
                "d-none"
            );
        }
    }

    function getAuthenticationToken() {
        if (
            typeof globalThis.getToken ===
            "function"
        ) {
            return globalThis.getToken();
        }

        return null;
    }

    function createApiError(
        response,
        result
    ) {
        if (response.status === 401) {
            return new Error(
                "Votre session a expiré. Reconnectez-vous."
            );
        }

        if (response.status === 403) {
            return new Error(
                "Cette action est réservée à l’administrateur."
            );
        }

        if (response.status === 404) {
            return new Error(
                result.message ||
                "La catégorie demandée est introuvable."
            );
        }

        if (response.status === 409) {
            return new Error(
                result.message ||
                "Cette opération crée un conflit."
            );
        }

        return new Error(
            result.message ||
            `Erreur HTTP ${response.status}`
        );
    }

    async function readApiResponse(
        response
    ) {
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

    function showMessage(
        message,
        isError
    ) {
        messageContainer.textContent =
            message;

        messageContainer.classList.remove(
            "d-none",
            "alert-danger",
            "alert-success"
        );

        messageContainer.classList.add(
            isError
                ? "alert-danger"
                : "alert-success"
        );
    }

    function hideMessage() {
        messageContainer.textContent = "";

        messageContainer.classList.add(
            "d-none"
        );

        messageContainer.classList.remove(
            "alert-danger",
            "alert-success"
        );
    }
})();