(() => {
    const API_ACCOUNT_URL =
        "/backend/api/account/me";

    const accountForm =
        document.getElementById("accountForm");

    const emailInput =
        document.getElementById(
            "accountEmailInput"
        );

    const lastNameInput =
        document.getElementById(
            "accountLastNameInput"
        );

    const firstNameInput =
        document.getElementById(
            "accountFirstNameInput"
        );

    const allergyInput =
        document.getElementById(
            "accountAllergyInput"
        );

    const guestNumberInput =
        document.getElementById(
            "accountGuestNumberInput"
        );

    const messageContainer =
        document.getElementById(
            "accountMessage"
        );

    const submitButton =
        document.getElementById(
            "accountSubmitButton"
        );

    if (!accountForm) {
        console.error(
            "Le formulaire du compte est introuvable."
        );
        return;
    }

    initializeAccountPage();

    function initializeAccountPage() {
        accountForm.addEventListener(
            "submit",
            updateAccount
        );

        loadAccount();
    }

    /**
     * Charge les informations du compte connecté.
     */
    async function loadAccount() {
        const token = getAuthenticationToken();

        if (!token) {
            showMessage(
                "Vous devez être connecté.",
                true
            );

            submitButton.disabled = true;
            return;
        }

        setFormDisabled(true);
        hideMessage();

        try {
            const response = await fetch(
                API_ACCOUNT_URL,
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

            emailInput.value =
                result.email || "";

            lastNameInput.value =
                result.lastName || "";

            firstNameInput.value =
                result.firstName || "";

            allergyInput.value =
                result.allergy || "";

            guestNumberInput.value =
                result.guestNumber ?? "";
        } catch (error) {
            console.error(
                "Impossible de charger le compte :",
                error
            );

            showMessage(
                error.message ||
                "Impossible de charger vos informations.",
                true
            );
        } finally {
            setFormDisabled(false);
        }
    }

    /**
     * Modifie les informations personnelles.
     */
    async function updateAccount(event) {
        event.preventDefault();

        const token = getAuthenticationToken();

        if (!token) {
            showMessage(
                "Vous devez être connecté.",
                true
            );
            return;
        }

        const firstName =
            firstNameInput.value.trim();

        const lastName =
            lastNameInput.value.trim();

        const allergy =
            allergyInput.value.trim();

        const guestNumberValue =
            guestNumberInput.value.trim();

        if (
            firstName.length < 2 ||
            firstName.length > 32
        ) {
            showMessage(
                "Le prénom doit contenir entre 2 et 32 caractères.",
                true
            );
            return;
        }

        if (
            lastName.length < 2 ||
            lastName.length > 64
        ) {
            showMessage(
                "Le nom doit contenir entre 2 et 64 caractères.",
                true
            );
            return;
        }

        let guestNumber = null;

        if (guestNumberValue !== "") {
            guestNumber =
                Number(guestNumberValue);

            if (
                !Number.isInteger(guestNumber) ||
                guestNumber < 1 ||
                guestNumber > 50
            ) {
                showMessage(
                    "Le nombre de convives doit être compris entre 1 et 50.",
                    true
                );
                return;
            }
        }

        const body = {
            firstName,
            lastName,
            guestNumber,
            allergy:
                allergy === "" ? null : allergy,
        };

        hideMessage();

        submitButton.disabled = true;
        submitButton.textContent =
            "Enregistrement...";

        try {
            const response = await fetch(
                API_ACCOUNT_URL,
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
                "Vos informations ont été modifiées.",
                false
            );

            if (result.user) {
                emailInput.value =
                    result.user.email || "";

                firstNameInput.value =
                    result.user.firstName || "";

                lastNameInput.value =
                    result.user.lastName || "";

                allergyInput.value =
                    result.user.allergy || "";

                guestNumberInput.value =
                    result.user.guestNumber ?? "";
            }
        } catch (error) {
            console.error(
                "Impossible de modifier le compte :",
                error
            );

            showMessage(
                error.message ||
                "Impossible de modifier vos informations.",
                true
            );
        } finally {
            submitButton.disabled = false;
            submitButton.textContent =
                "Modifier mes informations";
        }
    }

    function setFormDisabled(disabled) {
        lastNameInput.disabled = disabled;
        firstNameInput.disabled = disabled;
        allergyInput.disabled = disabled;
        guestNumberInput.disabled = disabled;
        submitButton.disabled = disabled;
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
                "Vous n’êtes pas autorisé à modifier ce compte."
            );
        }

        return new Error(
            result.message ||
            `Erreur HTTP ${response.status}`
        );
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