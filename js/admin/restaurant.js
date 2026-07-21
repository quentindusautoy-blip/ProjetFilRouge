(() => {
    const API_RESTAURANT_URL =
        "http://127.0.0.1:8000/api/restaurant/1";

    const form =
        document.getElementById(
            "restaurantAdminForm"
        );

    const nameInput =
        document.getElementById(
            "restaurantNameInput"
        );

    const descriptionInput =
        document.getElementById(
            "restaurantDescriptionInput"
        );

    const lunchStartInput =
        document.getElementById(
            "lunchStartInput"
        );

    const lunchEndInput =
        document.getElementById(
            "lunchEndInput"
        );

    const dinnerStartInput =
        document.getElementById(
            "dinnerStartInput"
        );

    const dinnerEndInput =
        document.getElementById(
            "dinnerEndInput"
        );

    const maxGuestInput =
        document.getElementById(
            "restaurantMaxGuestInput"
        );

    const messageContainer =
        document.getElementById(
            "restaurantAdminMessage"
        );

    const submitButton =
        document.getElementById(
            "restaurantAdminSubmitButton"
        );

    if (!form) {
        console.error(
            "Le formulaire du restaurant est introuvable."
        );
        return;
    }

    form.addEventListener(
        "submit",
        updateRestaurant
    );

    loadRestaurant();

    async function loadRestaurant() {
        setFormDisabled(true);
        hideMessage();

        try {
            const response = await fetch(
                API_RESTAURANT_URL,
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

            nameInput.value =
                result.name || "";

            descriptionInput.value =
                result.description || "";

            lunchStartInput.value =
                result.amOpeningTime?.[0] || "";

            lunchEndInput.value =
                result.amOpeningTime?.[1] || "";

            dinnerStartInput.value =
                result.pmOpeningTime?.[0] || "";

            dinnerEndInput.value =
                result.pmOpeningTime?.[1] || "";

            maxGuestInput.value =
                result.maxGuest ?? "";
        } catch (error) {
            console.error(
                "Impossible de charger le restaurant :",
                error
            );

            showMessage(
                error.message ||
                "Impossible de charger les informations du restaurant.",
                true
            );
        } finally {
            setFormDisabled(false);
        }
    }

    async function updateRestaurant(event) {
        event.preventDefault();

        const token = getAuthenticationToken();

        if (!token) {
            showMessage(
                "Vous devez être connecté comme administrateur.",
                true
            );
            return;
        }

        const name =
            nameInput.value.trim();

        const description =
            descriptionInput.value.trim();

        const maxGuest =
            Number(maxGuestInput.value);

        if (
            name.length < 2 ||
            name.length > 32
        ) {
            showMessage(
                "Le nom doit contenir entre 2 et 32 caractères.",
                true
            );
            return;
        }

        if (description === "") {
            showMessage(
                "La description est obligatoire.",
                true
            );
            return;
        }

        if (
            !isValidService(
                lunchStartInput.value,
                lunchEndInput.value
            )
        ) {
            showMessage(
                "Les horaires du midi sont invalides.",
                true
            );
            return;
        }

        if (
            !isValidService(
                dinnerStartInput.value,
                dinnerEndInput.value
            )
        ) {
            showMessage(
                "Les horaires du soir sont invalides.",
                true
            );
            return;
        }

        if (
            !Number.isInteger(maxGuest) ||
            maxGuest < 1 ||
            maxGuest > 1000
        ) {
            showMessage(
                "La capacité doit être comprise entre 1 et 1000.",
                true
            );
            return;
        }

        const body = {
            name,
            description,

            amOpeningTime: [
                lunchStartInput.value,
                lunchEndInput.value,
            ],

            pmOpeningTime: [
                dinnerStartInput.value,
                dinnerEndInput.value,
            ],

            maxGuest,
        };

        hideMessage();

        submitButton.disabled = true;
        submitButton.textContent =
            "Enregistrement...";

        try {
            const response = await fetch(
                API_RESTAURANT_URL,
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
                if (response.status === 401) {
                    throw new Error(
                        "Votre session a expiré."
                    );
                }

                if (response.status === 403) {
                    throw new Error(
                        "Cette action est réservée à l’administrateur."
                    );
                }

                throw new Error(
                    result.message ||
                    `Erreur HTTP ${response.status}`
                );
            }

            showMessage(
                result.message ||
                "Le restaurant a été modifié.",
                false
            );

            if (result.restaurant) {
                updateForm(
                    result.restaurant
                );
            }
        } catch (error) {
            console.error(
                "Impossible de modifier le restaurant :",
                error
            );

            showMessage(
                error.message ||
                "Impossible de modifier le restaurant.",
                true
            );
        } finally {
            submitButton.disabled = false;
            submitButton.textContent =
                "Enregistrer les modifications";
        }
    }

    function updateForm(restaurant) {
        nameInput.value =
            restaurant.name || "";

        descriptionInput.value =
            restaurant.description || "";

        lunchStartInput.value =
            restaurant.amOpeningTime?.[0] || "";

        lunchEndInput.value =
            restaurant.amOpeningTime?.[1] || "";

        dinnerStartInput.value =
            restaurant.pmOpeningTime?.[0] || "";

        dinnerEndInput.value =
            restaurant.pmOpeningTime?.[1] || "";

        maxGuestInput.value =
            restaurant.maxGuest ?? "";
    }

    function isValidService(start, end) {
        if (
            !isValidTime(start) ||
            !isValidTime(end)
        ) {
            return false;
        }

        return (
            timeToMinutes(start) <
            timeToMinutes(end)
        );
    }

    function isValidTime(value) {
        return (
            typeof value === "string" &&
            /^([01]\d|2[0-3]):[0-5]\d$/.test(
                value
            )
        );
    }

    function timeToMinutes(value) {
        const [hours, minutes] =
            value.split(":").map(Number);

        return hours * 60 + minutes;
    }

    function setFormDisabled(disabled) {
        nameInput.disabled = disabled;
        descriptionInput.disabled = disabled;
        lunchStartInput.disabled = disabled;
        lunchEndInput.disabled = disabled;
        dinnerStartInput.disabled = disabled;
        dinnerEndInput.disabled = disabled;
        maxGuestInput.disabled = disabled;
        submitButton.disabled = disabled;

        submitButton.textContent =
            disabled
                ? "Chargement..."
                : "Enregistrer les modifications";
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

    function showMessage(message, isError) {
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