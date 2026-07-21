(() => {
    const API_URL =
        "http://127.0.0.1:8000/api";

    const RESTAURANT_ID = 1;

    const form =
        document.getElementById(
            "menuAdminForm"
        );

    const menuIdInput =
        document.getElementById(
            "menuIdInput"
        );

    const nameInput =
        document.getElementById(
            "menuNameInput"
        );

    const descriptionInput =
        document.getElementById(
            "menuDescriptionInput"
        );

    const priceInput =
        document.getElementById(
            "menuPriceInput"
        );

    const activeInput =
        document.getElementById(
            "menuActiveInput"
        );

    const foodChoicesContainer =
        document.getElementById(
            "menuFoodChoices"
        );

    const foodEmptyMessage =
        document.getElementById(
            "menuFoodEmptyMessage"
        );

    const formTitle =
        document.getElementById(
            "menuFormTitle"
        );

    const submitButton =
        document.getElementById(
            "menuSubmitButton"
        );

    const cancelEditButton =
        document.getElementById(
            "menuCancelEditButton"
        );

    const refreshButton =
        document.getElementById(
            "menuRefreshButton"
        );

    const messageContainer =
        document.getElementById(
            "menuAdminMessage"
        );

    const loadingContainer =
        document.getElementById(
            "menuLoading"
        );

    const menuList =
        document.getElementById(
            "menuList"
        );

    const menuEmptyMessage =
        document.getElementById(
            "menuEmptyMessage"
        );

    if (
        !form ||
        !menuIdInput ||
        !nameInput ||
        !descriptionInput ||
        !priceInput ||
        !activeInput ||
        !foodChoicesContainer ||
        !foodEmptyMessage ||
        !formTitle ||
        !submitButton ||
        !cancelEditButton ||
        !refreshButton ||
        !messageContainer ||
        !loadingContainer ||
        !menuList ||
        !menuEmptyMessage
    ) {
        console.error(
            "La page d’administration des menus est incomplète."
        );

        return;
    }

    let menus = [];
    let foods = [];
    let requestInProgress = false;

    initializePage();

    async function initializePage() {
        addEventListeners();

        await Promise.all([
            loadFoods(),
            loadMenus(),
        ]);
    }

    function addEventListeners() {
        form.addEventListener(
            "submit",
            saveMenu
        );

        cancelEditButton.addEventListener(
            "click",
            resetForm
        );

        refreshButton.addEventListener(
            "click",
            async () => {
                await Promise.all([
                    loadFoods(),
                    loadMenus(),
                ]);
            }
        );
    }

    /**
     * Charge tous les plats,
     * y compris les indisponibles.
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

            renderFoodChoices();
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
        }
    }

    /**
     * Charge tous les menus administrateur.
     */
    async function loadMenus() {
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
                `${API_URL}/admin/menus`,
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

            menus =
                Array.isArray(result.menus)
                    ? result.menus
                    : [];

            renderMenus();
        } catch (error) {
            console.error(
                "Impossible de charger les menus :",
                error
            );

            showMessage(
                error.message ||
                "Impossible de charger les menus.",
                true
            );
        } finally {
            setLoading(false);
        }
    }

    /**
     * Affiche les plats regroupés par catégorie.
     */
    function renderFoodChoices() {
        foodChoicesContainer.replaceChildren();

        if (foods.length === 0) {
            foodEmptyMessage.classList.remove(
                "d-none"
            );

            return;
        }

        foodEmptyMessage.classList.add(
            "d-none"
        );

        const groupedFoods =
            groupFoodsByCategory(foods);

        const fragment =
            document.createDocumentFragment();

        groupedFoods.forEach(
            (categoryFoods, categoryName) => {
                fragment.appendChild(
                    createFoodCategoryColumn(
                        categoryName,
                        categoryFoods
                    )
                );
            }
        );

        foodChoicesContainer.appendChild(
            fragment
        );
    }

    function groupFoodsByCategory(
        foodCollection
    ) {
        const groups = new Map();

        foodCollection.forEach((food) => {
            const categoryName =
                food.category?.name ||
                "Sans catégorie";

            if (!groups.has(categoryName)) {
                groups.set(
                    categoryName,
                    []
                );
            }

            groups
                .get(categoryName)
                .push(food);
        });

        return groups;
    }

    function createFoodCategoryColumn(
        categoryName,
        categoryFoods
    ) {
        const column =
            document.createElement("div");

        column.className =
            "col-12 col-md-6 col-lg-4";

        const card =
            document.createElement("div");

        card.className =
            "border rounded p-3 h-100";

        const title =
            document.createElement("h3");

        title.className =
            "h5 text-primary";

        title.textContent =
            categoryName;

        card.appendChild(title);

        categoryFoods.forEach((food) => {
            card.appendChild(
                createFoodCheckbox(food)
            );
        });

        column.appendChild(card);

        return column;
    }

    function createFoodCheckbox(food) {
        const wrapper =
            document.createElement("div");

        wrapper.className =
            "form-check mb-2";

        const checkbox =
            document.createElement("input");

        checkbox.type = "checkbox";
        checkbox.className =
            "form-check-input menu-food-checkbox";

        checkbox.id =
            `menuFoodInput-${food.id}`;

        checkbox.value =
            String(food.id);

        const label =
            document.createElement("label");

        label.className =
            "form-check-label";

        label.htmlFor =
            checkbox.id;

        label.textContent =
            `${food.name} — ${formatPrice(food.price)}`;

        if (!food.isAvailable) {
            const unavailable =
                document.createElement("span");

            unavailable.className =
                "badge text-bg-secondary ms-2";

            unavailable.textContent =
                "Indisponible";

            label.appendChild(
                unavailable
            );
        }

        wrapper.append(
            checkbox,
            label
        );

        return wrapper;
    }

    function renderMenus() {
        menuList.replaceChildren();

        if (menus.length === 0) {
            menuList.classList.add(
                "d-none"
            );

            menuEmptyMessage.classList.remove(
                "d-none"
            );

            return;
        }

        menuEmptyMessage.classList.add(
            "d-none"
        );

        menuList.classList.remove(
            "d-none"
        );

        const fragment =
            document.createDocumentFragment();

        menus.forEach((menu) => {
            fragment.appendChild(
                createMenuCard(menu)
            );
        });

        menuList.appendChild(fragment);
    }

    function createMenuCard(menu) {
        const column =
            document.createElement("div");

        column.className =
            "col-12 col-lg-6";

        const card =
            document.createElement("article");

        card.className =
            "card h-100";

        const cardBody =
            document.createElement("div");

        cardBody.className =
            "card-body d-flex flex-column";

        const titleContainer =
            document.createElement("div");

        titleContainer.className =
            "d-flex justify-content-between align-items-start gap-3";

        const title =
            document.createElement("h3");

        title.className =
            "card-title h4 text-primary";

        title.textContent =
            menu.name || "Menu";

        const statusBadge =
            document.createElement("span");

        statusBadge.className =
            menu.isActive
                ? "badge text-bg-success"
                : "badge text-bg-secondary";

        statusBadge.textContent =
            menu.isActive
                ? "Actif"
                : "Inactif";

        titleContainer.append(
            title,
            statusBadge
        );

        const price =
            document.createElement("p");

        price.className =
            "fs-4 fw-bold mb-2";

        price.textContent =
            formatPrice(menu.price);

        const description =
            document.createElement("p");

        description.className =
            "text-muted";

        description.textContent =
            menu.description ||
            "Aucune description.";

        const foodTitle =
            document.createElement("h4");

        foodTitle.className =
            "h6 mt-2";

        foodTitle.textContent =
            "Plats associés";

        const foodList =
            document.createElement("ul");

        foodList.className =
            "mb-4";

        const menuFoods =
            Array.isArray(menu.foods)
                ? menu.foods
                : [];

        if (menuFoods.length === 0) {
            const item =
                document.createElement("li");

            item.textContent =
                "Aucun plat associé";

            foodList.appendChild(item);
        } else {
            menuFoods.forEach((food) => {
                const item =
                    document.createElement("li");

                item.textContent =
                    `${food.category?.name || "Catégorie"} : ${food.name}`;

                if (!food.isAvailable) {
                    item.textContent +=
                        " — indisponible";
                }

                foodList.appendChild(item);
            });
        }

        const actions =
            document.createElement("div");

        actions.className =
            "mt-auto text-end";

        const editButton =
            document.createElement("button");

        editButton.type = "button";

        editButton.className =
            "btn btn-sm btn-outline-primary me-2";

        editButton.innerHTML =
            '<i class="bi bi-pencil-square"></i>';

        editButton.setAttribute(
            "aria-label",
            `Modifier ${menu.name}`
        );

        editButton.addEventListener(
            "click",
            () => startEditing(menu)
        );

        const activationButton =
            document.createElement("button");

        activationButton.type =
            "button";

        activationButton.className =
            menu.isActive
                ? "btn btn-sm btn-outline-secondary me-2"
                : "btn btn-sm btn-outline-success me-2";

        activationButton.innerHTML =
            menu.isActive
                ? '<i class="bi bi-eye-slash"></i>'
                : '<i class="bi bi-eye"></i>';

        activationButton.setAttribute(
            "aria-label",
            menu.isActive
                ? `Désactiver ${menu.name}`
                : `Activer ${menu.name}`
        );

        activationButton.addEventListener(
            "click",
            () => toggleMenuStatus(menu)
        );

        const deleteButton =
            document.createElement("button");

        deleteButton.type = "button";

        deleteButton.className =
            "btn btn-sm btn-outline-danger";

        deleteButton.innerHTML =
            '<i class="bi bi-trash"></i>';

        deleteButton.setAttribute(
            "aria-label",
            `Supprimer ${menu.name}`
        );

        deleteButton.addEventListener(
            "click",
            () => deleteMenu(menu)
        );

        actions.append(
            editButton,
            activationButton,
            deleteButton
        );

        cardBody.append(
            titleContainer,
            price,
            description,
            foodTitle,
            foodList,
            actions
        );

        card.appendChild(cardBody);
        column.appendChild(card);

        return column;
    }

    /**
     * Crée ou modifie un menu.
     */
    async function saveMenu(event) {
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

        const menuId =
            menuIdInput.value.trim();

        const name =
            nameInput.value.trim();

        const description =
            descriptionInput.value.trim();

        const price =
            Number(priceInput.value);

        const isActive =
            activeInput.checked;

        const foodIds =
            getSelectedFoodIds();

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

        if (foodIds.length === 0) {
            showMessage(
                "Sélectionnez au moins un plat.",
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
            isActive,
            restaurantId:
                RESTAURANT_ID,
            foodIds,
        };

        const isEditing =
            menuId !== "";

        const requestUrl =
            isEditing
                ? `${API_URL}/admin/menus/${menuId}`
                : `${API_URL}/admin/menus`;

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
                        ? "Le menu a été modifié."
                        : "Le menu a été créé."
                ),
                false
            );

            resetForm();
            await loadMenus();
        } catch (error) {
            console.error(
                "Impossible d’enregistrer le menu :",
                error
            );

            showMessage(
                error.message ||
                "Impossible d’enregistrer le menu.",
                true
            );
        } finally {
            setRequestInProgress(false);
        }
    }

    function getSelectedFoodIds() {
        return Array.from(
            document.querySelectorAll(
                ".menu-food-checkbox:checked"
            )
        )
            .map(
                (checkbox) =>
                    Number(checkbox.value)
            )
            .filter(
                (foodId) =>
                    Number.isInteger(foodId) &&
                    foodId > 0
            );
    }

    function startEditing(menu) {
        menuIdInput.value =
            String(menu.id);

        nameInput.value =
            menu.name || "";

        descriptionInput.value =
            menu.description || "";

        priceInput.value =
            menu.price || "";

        activeInput.checked =
            Boolean(menu.isActive);

        uncheckAllFoods();

        const selectedFoodIds =
            new Set(
                (
                    Array.isArray(menu.foods)
                        ? menu.foods
                        : []
                ).map(
                    (food) =>
                        String(food.id)
                )
            );

        document
            .querySelectorAll(
                ".menu-food-checkbox"
            )
            .forEach((checkbox) => {
                checkbox.checked =
                    selectedFoodIds.has(
                        checkbox.value
                    );
            });

        formTitle.textContent =
            "Modifier le menu";

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

        menuIdInput.value = "";
        activeInput.checked = true;

        uncheckAllFoods();

        formTitle.textContent =
            "Ajouter un menu";

        submitButton.textContent =
            "Ajouter le menu";

        cancelEditButton.classList.add(
            "d-none"
        );
    }

    function uncheckAllFoods() {
        document
            .querySelectorAll(
                ".menu-food-checkbox"
            )
            .forEach((checkbox) => {
                checkbox.checked = false;
            });
    }

    async function toggleMenuStatus(menu) {
        const action =
            menu.isActive
                ? "désactiver"
                : "activer";

        const confirmed =
            globalThis.confirm(
                `Voulez-vous ${action} le menu « ${menu.name} » ?`
            );

        if (!confirmed) {
            return;
        }

        await patchMenu(
            menu.id,
            {
                isActive:
                    !menu.isActive,
            }
        );
    }

    async function patchMenu(
        menuId,
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
                `${API_URL}/admin/menus/${menuId}`,
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
                "Le menu a été modifié.",
                false
            );

            await loadMenus();
        } catch (error) {
            console.error(
                "Impossible de modifier le menu :",
                error
            );

            showMessage(
                error.message ||
                "Impossible de modifier le menu.",
                true
            );
        }
    }

    async function deleteMenu(menu) {
        const confirmed =
            globalThis.confirm(
                `Voulez-vous supprimer définitivement le menu « ${menu.name} » ?`
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
                `${API_URL}/admin/menus/${menu.id}`,
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
                menuIdInput.value ===
                String(menu.id)
            ) {
                resetForm();
            }

            showMessage(
                "Le menu a été supprimé.",
                false
            );

            await loadMenus();
        } catch (error) {
            console.error(
                "Impossible de supprimer le menu :",
                error
            );

            showMessage(
                error.message ||
                "Impossible de supprimer le menu.",
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
                    menuIdInput.value
                        ? "Enregistrer les modifications"
                        : "Ajouter le menu"
                );
    }

    function setLoading(isLoading) {
        loadingContainer.classList.toggle(
            "d-none",
            !isLoading
        );

        if (isLoading) {
            menuList.classList.add(
                "d-none"
            );

            menuEmptyMessage.classList.add(
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
                "Le menu demandé est introuvable."
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
            return "Prix non renseigné";
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