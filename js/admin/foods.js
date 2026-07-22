(() => {
    const API_URL =
        "/backend/api";

    const form =
        document.getElementById(
            "foodAdminForm"
        );

    const foodIdInput =
        document.getElementById(
            "foodIdInput"
        );

    const nameInput =
        document.getElementById(
            "foodNameInput"
        );

    const categoryInput =
        document.getElementById(
            "foodCategoryInput"
        );

    const descriptionInput =
        document.getElementById(
            "foodDescriptionInput"
        );

    const priceInput =
        document.getElementById(
            "foodPriceInput"
        );

    const availableInput =
        document.getElementById(
            "foodAvailableInput"
        );

    const formTitle =
        document.getElementById(
            "foodFormTitle"
        );

    const submitButton =
        document.getElementById(
            "foodSubmitButton"
        );

    const cancelEditButton =
        document.getElementById(
            "foodCancelEditButton"
        );

    const refreshButton =
        document.getElementById(
            "foodRefreshButton"
        );

    const messageContainer =
        document.getElementById(
            "foodAdminMessage"
        );

    const loadingContainer =
        document.getElementById(
            "foodLoading"
        );

    const tableContainer =
        document.getElementById(
            "foodTableContainer"
        );

    const tableBody =
        document.getElementById(
            "foodTableBody"
        );

    const emptyMessage =
        document.getElementById(
            "foodEmptyMessage"
        );

    if (
        !form ||
        !foodIdInput ||
        !nameInput ||
        !categoryInput ||
        !descriptionInput ||
        !priceInput ||
        !availableInput ||
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
            "La page d’administration des plats est incomplète."
        );

        return;
    }

    let foods = [];
    let categories = [];
    let requestInProgress = false;

    initializePage();

    async function initializePage() {
        addEventListeners();

        await Promise.all([
            loadCategories(),
            loadFoods(),
        ]);
    }

    function addEventListeners() {
        form.addEventListener(
            "submit",
            saveFood
        );

        cancelEditButton.addEventListener(
            "click",
            resetForm
        );

        refreshButton.addEventListener(
            "click",
            loadFoods
        );
    }

    /**
     * Charge les catégories depuis le catalogue public.
     */
    async function loadCategories() {
        try {
            const response = await fetch(
                `${API_URL}/catalog`,
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

            categories =
                Array.isArray(result.categories)
                    ? result.categories
                    : [];

            renderCategoryOptions();
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
        }
    }

    /**
     * Charge tous les plats depuis l’API administrateur.
     */
    async function loadFoods() {
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
                `${API_URL}/admin/foods`,
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

            foods =
                Array.isArray(result.foods)
                    ? result.foods
                    : [];

            renderFoods();
        } catch (error) {
            console.error(
                "Impossible de charger les plats :",
                error
            );

            showMessage(
                error.message ||
                "Impossible de charger les plats.",
                true
            );
        } finally {
            setLoading(false);
        }
    }

    function renderCategoryOptions() {
        const currentValue =
            categoryInput.value;

        categoryInput.replaceChildren();

        const defaultOption =
            document.createElement("option");

        defaultOption.value = "";

        defaultOption.textContent =
            "Sélectionnez une catégorie";

        categoryInput.appendChild(
            defaultOption
        );

        categories.forEach((category) => {
            const option =
                document.createElement("option");

            option.value =
                String(category.id);

            option.textContent =
                category.name ||
                "Catégorie";

            categoryInput.appendChild(
                option
            );
        });

        if (
            currentValue &&
            categories.some(
                (category) =>
                    String(category.id) ===
                    currentValue
            )
        ) {
            categoryInput.value =
                currentValue;
        }
    }

    function renderFoods() {
        tableBody.replaceChildren();

        if (foods.length === 0) {
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

        foods.forEach((food) => {
            fragment.appendChild(
                createFoodRow(food)
            );
        });

        tableBody.appendChild(fragment);
    }

    function createFoodRow(food) {
        const row =
            document.createElement("tr");

        const nameCell =
            document.createElement("td");

        const name =
            document.createElement("strong");

        name.textContent =
            food.name || "Plat";

        nameCell.appendChild(name);

        if (food.description) {
            const description =
                document.createElement("div");

            description.className =
                "small text-muted mt-1";

            description.textContent =
                food.description;

            nameCell.appendChild(
                description
            );
        }

        const categoryCell =
            document.createElement("td");

        categoryCell.textContent =
            food.category?.name ||
            "Sans catégorie";

        const priceCell =
            document.createElement("td");

        priceCell.textContent =
            formatPrice(food.price);

        const availabilityCell =
            document.createElement("td");

        const availabilityBadge =
            document.createElement("span");

        availabilityBadge.className =
            food.isAvailable
                ? "badge text-bg-success"
                : "badge text-bg-secondary";

        availabilityBadge.textContent =
            food.isAvailable
                ? "Disponible"
                : "Indisponible";

        availabilityCell.appendChild(
            availabilityBadge
        );

        const menusCell =
            document.createElement("td");

        const menuCount =
            Array.isArray(food.menuIds)
                ? food.menuIds.length
                : 0;

        menusCell.textContent =
            menuCount === 0
                ? "Aucun"
                : String(menuCount);

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
            `Modifier ${food.name}`
        );

        const editIcon =
            document.createElement("i");

        editIcon.className =
            "bi bi-pencil-square";

        editButton.appendChild(editIcon);

        editButton.addEventListener(
            "click",
            () => startEditing(food)
        );

        const availabilityButton =
            document.createElement("button");

        availabilityButton.type =
            "button";

        availabilityButton.className =
            food.isAvailable
                ? "btn btn-sm btn-outline-secondary me-2"
                : "btn btn-sm btn-outline-success me-2";

        availabilityButton.setAttribute(
            "aria-label",
            food.isAvailable
                ? `Rendre ${food.name} indisponible`
                : `Rendre ${food.name} disponible`
        );

        const availabilityIcon =
            document.createElement("i");

        availabilityIcon.className =
            food.isAvailable
                ? "bi bi-eye-slash"
                : "bi bi-eye";

        availabilityButton.appendChild(
            availabilityIcon
        );

        availabilityButton.addEventListener(
            "click",
            () => toggleAvailability(food)
        );

        const deleteButton =
            document.createElement("button");

        deleteButton.type = "button";

        deleteButton.className =
            "btn btn-sm btn-outline-danger";

        deleteButton.setAttribute(
            "aria-label",
            `Supprimer ${food.name}`
        );

        const deleteIcon =
            document.createElement("i");

        deleteIcon.className =
            "bi bi-trash";

        deleteButton.appendChild(
            deleteIcon
        );

        deleteButton.addEventListener(
            "click",
            () => deleteFood(food)
        );

        actionsCell.append(
            editButton,
            availabilityButton,
            deleteButton
        );

        row.append(
            nameCell,
            categoryCell,
            priceCell,
            availabilityCell,
            menusCell,
            actionsCell
        );

        return row;
    }

    /**
     * Crée ou modifie un plat selon la présence d’un identifiant.
     */
    async function saveFood(event) {
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

        const foodId =
            foodIdInput.value.trim();

        const name =
            nameInput.value.trim();

        const description =
            descriptionInput.value.trim();

        const price =
            Number(priceInput.value);

        const categoryId =
            Number(categoryInput.value);

        const isAvailable =
            availableInput.checked;

        if (
            name.length < 2 ||
            name.length > 100
        ) {
            showMessage(
                "Le nom doit contenir entre 2 et 100 caractères.",
                true
            );

            return;
        }

        if (
            !Number.isInteger(categoryId) ||
            categoryId < 1
        ) {
            showMessage(
                "Sélectionnez une catégorie.",
                true
            );

            return;
        }

        if (
            !Number.isFinite(price) ||
            price <= 0 ||
            price > 9999.99
        ) {
            showMessage(
                "Le prix doit être compris entre 0,01 € et 9 999,99 €.",
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
            price,
            categoryId,
            isAvailable,
        };

        const isEditing =
            foodId !== "";

        const requestUrl =
            isEditing
                ? `${API_URL}/admin/foods/${foodId}`
                : `${API_URL}/admin/foods`;

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
                        ? "Le plat a été modifié."
                        : "Le plat a été créé."
                ),
                false
            );

            resetForm();
            await loadFoods();
        } catch (error) {
            console.error(
                "Impossible d’enregistrer le plat :",
                error
            );

            showMessage(
                error.message ||
                "Impossible d’enregistrer le plat.",
                true
            );
        } finally {
            setRequestInProgress(false);
        }
    }

    function startEditing(food) {
        foodIdInput.value =
            String(food.id);

        nameInput.value =
            food.name || "";

        descriptionInput.value =
            food.description || "";

        priceInput.value =
            food.price || "";

        categoryInput.value =
            food.category?.id
                ? String(food.category.id)
                : "";

        availableInput.checked =
            Boolean(food.isAvailable);

        formTitle.textContent =
            "Modifier le plat";

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

        foodIdInput.value = "";

        availableInput.checked = true;

        formTitle.textContent =
            "Ajouter un plat";

        submitButton.textContent =
            "Ajouter le plat";

        cancelEditButton.classList.add(
            "d-none"
        );
    }

    async function toggleAvailability(food) {
        const actionLabel =
            food.isAvailable
                ? "rendre indisponible"
                : "rendre disponible";

        const confirmed =
            globalThis.confirm(
                `Voulez-vous ${actionLabel} le plat « ${food.name} » ?`
            );

        if (!confirmed) {
            return;
        }

        await patchFood(
            food.id,
            {
                isAvailable:
                    !food.isAvailable,
            }
        );
    }

    async function patchFood(
        foodId,
        body
    ) {
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
                `${API_URL}/admin/foods/${foodId}`,
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
                throw createApiError(
                    response,
                    result
                );
            }

            showMessage(
                result.message ||
                "Le plat a été modifié.",
                false
            );

            await loadFoods();
        } catch (error) {
            console.error(
                "Impossible de modifier le plat :",
                error
            );

            showMessage(
                error.message ||
                "Impossible de modifier le plat.",
                true
            );
        }
    }

    async function deleteFood(food) {
        const confirmed =
            globalThis.confirm(
                `Voulez-vous supprimer définitivement le plat « ${food.name} » ?`
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
                `${API_URL}/admin/foods/${food.id}`,
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
                foodIdInput.value ===
                String(food.id)
            ) {
                resetForm();
            }

            showMessage(
                "Le plat a été supprimé.",
                false
            );

            await loadFoods();
        } catch (error) {
            console.error(
                "Impossible de supprimer le plat :",
                error
            );

            showMessage(
                error.message ||
                "Impossible de supprimer le plat.",
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
                    foodIdInput.value
                        ? "Enregistrer les modifications"
                        : "Ajouter le plat"
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
                "Le plat demandé est introuvable."
            );
        }

        return new Error(
            result.message ||
            `Erreur HTTP ${response.status}`
        );
    }

    function formatPrice(value) {
        const numericValue =
            Number(value);

        if (!Number.isFinite(numericValue)) {
            return "Non renseigné";
        }

        return new Intl.NumberFormat(
            "fr-FR",
            {
                style: "currency",
                currency: "EUR",
            }
        ).format(numericValue);
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