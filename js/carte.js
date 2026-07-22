(() => {
    const API_CATALOG_URL =
        "/backend/api/catalog";

    const loadingContainer =
        document.getElementById(
            "catalogLoading"
        );

    const contentContainer =
        document.getElementById(
            "catalogContent"
        );

    const categoriesContainer =
        document.getElementById(
            "categoriesContainer"
        );

    const menusContainer =
        document.getElementById(
            "menusContainer"
        );

    const messageContainer =
        document.getElementById(
            "catalogMessage"
        );

    if (
        !loadingContainer ||
        !contentContainer ||
        !categoriesContainer ||
        !menusContainer ||
        !messageContainer
    ) {
        console.error(
            "Les éléments de la page carte sont introuvables."
        );

        return;
    }

    loadCatalog();

    /**
     * Charge la carte depuis l’API Symfony.
     */
    async function loadCatalog() {
        setLoading(true);
        hideMessage();

        try {
            const response = await fetch(
                API_CATALOG_URL,
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

            validateCatalog(result);
            renderCatalog(result);
        } catch (error) {
            console.error(
                "Impossible de charger la carte :",
                error
            );

            showErrorMessage(
                error.message ||
                "Impossible de charger la carte du restaurant."
            );
        } finally {
            setLoading(false);
        }
    }

    /**
     * Vérifie la structure minimale
     * de la réponse de l’API.
     */
    function validateCatalog(catalog) {
        if (
            !catalog ||
            !Array.isArray(
                catalog.categories
            ) ||
            !Array.isArray(
                catalog.menus
            )
        ) {
            throw new TypeError(
                "La réponse de l’API est invalide."
            );
        }
    }

    /**
     * Affiche les catégories et les menus.
     */
    function renderCatalog(catalog) {
        renderCategories(
            catalog.categories
        );

        renderMenus(
            catalog.menus
        );

        contentContainer.classList.remove(
            "d-none"
        );
    }

    /**
     * Affiche toutes les catégories.
     */
    function renderCategories(categories) {
        categoriesContainer.replaceChildren();

        if (categories.length === 0) {
            const emptyMessage =
                document.createElement("p");

            emptyMessage.className =
                "text-center text-muted";

            emptyMessage.textContent =
                "Aucun plat n’est actuellement proposé.";

            categoriesContainer.appendChild(
                emptyMessage
            );

            return;
        }

        const fragment =
            document.createDocumentFragment();

        categories.forEach((category) => {
            fragment.appendChild(
                createCategorySection(
                    category
                )
            );
        });

        categoriesContainer.appendChild(
            fragment
        );
    }

    /**
     * Construit une section :
     * entrées, plats ou desserts.
     */
    function createCategorySection(category) {
        const section =
            document.createElement("section");

        section.className = "mb-5";

        const title =
            document.createElement("h3");

        title.className =
            "text-center text-primary text-decoration-underline mb-3";

        title.textContent =
            category.name || "Catégorie";

        section.appendChild(title);

        if (category.description) {
            const description =
                document.createElement("p");

            description.className =
                "text-center text-muted mb-4";

            description.textContent =
                category.description;

            section.appendChild(
                description
            );
        }

        const foods =
            Array.isArray(category.foods)
                ? category.foods
                : [];

        if (foods.length === 0) {
            const emptyMessage =
                document.createElement("p");

            emptyMessage.className =
                "text-center";

            emptyMessage.textContent =
                "Aucun plat disponible dans cette catégorie.";

            section.appendChild(
                emptyMessage
            );

            return section;
        }

        const foodList =
            document.createElement("div");

        foodList.className =
            "mx-auto";

        foods.forEach((food) => {
            foodList.appendChild(
                createFoodElement(food)
            );
        });

        section.appendChild(foodList);

        return section;
    }

    /**
     * Construit l’affichage d’un plat.
     */
    function createFoodElement(food) {
        const article =
            document.createElement("article");

        article.className =
            "border-bottom py-3";

        const header =
            document.createElement("div");

        header.className =
            "d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2";

        const name =
            document.createElement("h4");

        name.className = "mb-0";

        name.textContent =
            food.name || "Plat";

        const price =
            document.createElement("strong");

        price.className =
            "text-primary fs-5 text-nowrap";

        price.textContent =
            formatPrice(food.price);

        header.append(
            name,
            price
        );

        article.appendChild(header);

        if (food.description) {
            const description =
                document.createElement("p");

            description.className =
                "mb-0 mt-2 text-muted";

            description.textContent =
                food.description;

            article.appendChild(
                description
            );
        }

        return article;
    }

    /**
     * Affiche tous les menus actifs.
     */
    function renderMenus(menus) {
        menusContainer.replaceChildren();

        if (menus.length === 0) {
            const column =
                document.createElement("div");

            column.className = "col-12";

            const message =
                document.createElement("p");

            message.className =
                "text-center mb-0";

            message.textContent =
                "Aucun menu n’est actuellement disponible.";

            column.appendChild(message);

            menusContainer.appendChild(
                column
            );

            return;
        }

        const fragment =
            document.createDocumentFragment();

        menus.forEach((menu) => {
            fragment.appendChild(
                createMenuColumn(
                    menu,
                    menus.length
                )
            );
        });

        menusContainer.appendChild(
            fragment
        );
    }

    /**
     * Construit une colonne de menu.
     *
     * Un menu :
     * largeur centrée.
     *
     * Deux menus :
     * deux colonnes égales.
     *
     * Trois menus ou plus :
     * trois colonnes sur grand écran.
     */
    function createMenuColumn(
        menu,
        menuCount
    ) {
        const column =
            document.createElement("div");

        if (menuCount === 1) {
            column.className =
                "col-12 col-lg-8 mx-auto";
        } else if (menuCount === 2) {
            column.className =
                "col-12 col-lg-6";
        } else {
            column.className =
                "col-12 col-lg-6 col-xl-4";
        }

        const card =
            document.createElement("article");

        card.className =
            "h-100 border border-secondary rounded p-4";

        const title =
            document.createElement("h3");

        title.className =
            "text-center text-primary text-decoration-underline";

        title.textContent =
            menu.name || "Menu";

        const price =
            document.createElement("p");

        price.className =
            "text-center fs-4 fw-bold";

        price.textContent =
            formatPrice(menu.price);

        card.append(
            title,
            price
        );

        if (menu.description) {
            const description =
                document.createElement("p");

            description.className =
                "text-center mb-4";

            description.textContent =
                menu.description;

            card.appendChild(
                description
            );
        }

        const groupedFoods =
            groupFoodsByCategory(
                menu.foods
            );

        if (groupedFoods.size === 0) {
            const emptyMessage =
                document.createElement("p");

            emptyMessage.className =
                "text-center mb-0";

            emptyMessage.textContent =
                "Aucun plat n’est associé à ce menu.";

            card.appendChild(
                emptyMessage
            );
        } else {
            const categories =
                Array.from(
                    groupedFoods.entries()
                );

            categories.forEach(
                (
                    [
                        categoryName,
                        foods,
                    ],
                    index
                ) => {
                    card.appendChild(
                        createMenuCategory(
                            categoryName,
                            foods,
                            index <
                            categories.length - 1
                        )
                    );
                }
            );
        }

        column.appendChild(card);

        return column;
    }

    /**
     * Regroupe les plats d’un menu
     * selon leur catégorie.
     */
    function groupFoodsByCategory(foods) {
        const groups = new Map();

        if (!Array.isArray(foods)) {
            return groups;
        }

        foods.forEach((food) => {
            const categoryName =
                food.category?.name ||
                "Autres";

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

    /**
     * Construit une partie du menu :
     * entrées, plats ou desserts.
     */
    function createMenuCategory(
        categoryName,
        foods,
        displaySeparator
    ) {
        const section =
            document.createElement("section");

        section.className =
            "text-center mb-4";

        const title =
            document.createElement("h4");

        title.className = "fs-5";

        title.textContent =
            `${categoryName} au choix`;

        section.appendChild(title);

        foods.forEach(
            (food, index) => {
                if (index > 0) {
                    const alternative =
                        document.createElement(
                            "p"
                        );

                    alternative.className =
                        "mb-1 fst-italic";

                    alternative.textContent =
                        "ou";

                    section.appendChild(
                        alternative
                    );
                }

                const foodName =
                    document.createElement(
                        "p"
                    );

                foodName.className =
                    "mb-1";

                foodName.textContent =
                    food.name || "Plat";

                section.appendChild(
                    foodName
                );
            }
        );

        if (displaySeparator) {
            const separator =
                document.createElement(
                    "div"
                );

            separator.className =
                "mt-3";

            separator.setAttribute(
                "aria-hidden",
                "true"
            );

            separator.textContent =
                "—— o ——";

            section.appendChild(
                separator
            );
        }

        return section;
    }

    /**
     * Formate un prix en euros.
     */
    function formatPrice(value) {
        const numericPrice =
            Number(value);

        if (
            !Number.isFinite(
                numericPrice
            )
        ) {
            return "Prix non renseigné";
        }

        return new Intl.NumberFormat(
            "fr-FR",
            {
                style: "currency",
                currency: "EUR",
            }
        ).format(numericPrice);
    }

    function setLoading(isLoading) {
        loadingContainer.classList.toggle(
            "d-none",
            !isLoading
        );

        if (isLoading) {
            contentContainer.classList.add(
                "d-none"
            );
        }
    }

    function showErrorMessage(message) {
        messageContainer.replaceChildren();

        messageContainer.classList.remove(
            "d-none",
            "alert-success"
        );

        messageContainer.classList.add(
            "alert-danger"
        );

        const text =
            document.createElement("p");

        text.className = "mb-3";

        text.textContent = message;

        const retryButton =
            document.createElement("button");

        retryButton.type = "button";

        retryButton.className =
            "btn btn-outline-danger";

        retryButton.textContent =
            "Réessayer";

        retryButton.addEventListener(
            "click",
            loadCatalog
        );

        messageContainer.append(
            text,
            retryButton
        );
    }

    function hideMessage() {
        messageContainer.replaceChildren();

        messageContainer.classList.add(
            "d-none"
        );

        messageContainer.classList.remove(
            "alert-danger",
            "alert-success"
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
})();