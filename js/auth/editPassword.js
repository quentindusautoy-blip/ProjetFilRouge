(() => {
    const API_PASSWORD_URL =
        "http://127.0.0.1:8000/api/account/password";

    const form =
        document.getElementById(
            "changePasswordForm"
        );

    const currentPasswordInput =
        document.getElementById(
            "CurrentPasswordInput"
        );

    const newPasswordInput =
        document.getElementById(
            "NewPasswordInput"
        );

    const repeatPasswordInput =
        document.getElementById(
            "RepeatPasswordInput"
        );

    const submitButton =
        document.getElementById(
            "changePasswordSubmitButton"
        );

    const cancelButton =
        document.getElementById(
            "cancelPasswordButton"
        );

    const messageContainer =
        document.getElementById(
            "changePasswordMessage"
        );

    if (!form) {
        console.error(
            "Le formulaire de mot de passe est introuvable."
        );
        return;
    }

    form.addEventListener(
        "submit",
        updatePassword
    );

    cancelButton?.addEventListener(
        "click",
        () => {
            navigateToAccount();
        }
    );

    async function updatePassword(event) {
        event.preventDefault();

        const token = getAuthenticationToken();

        if (!token) {
            showMessage(
                "Vous devez être connecté.",
                true
            );
            return;
        }

        const currentPassword =
            currentPasswordInput.value;

        const newPassword =
            newPasswordInput.value;

        const repeatedPassword =
            repeatPasswordInput.value;

        if (currentPassword === "") {
            showMessage(
                "Saisissez votre mot de passe actuel.",
                true
            );
            return;
        }

        if (newPassword.length < 8) {
            showMessage(
                "Le nouveau mot de passe doit contenir au moins 8 caractères.",
                true
            );
            return;
        }

        if (newPassword !== repeatedPassword) {
            showMessage(
                "Les deux nouveaux mots de passe ne correspondent pas.",
                true
            );
            return;
        }

        if (currentPassword === newPassword) {
            showMessage(
                "Le nouveau mot de passe doit être différent de l’ancien.",
                true
            );
            return;
        }

        hideMessage();

        submitButton.disabled = true;
        submitButton.textContent =
            "Modification...";

        const body = {
            currentPassword,
            newPassword,
        };

        try {
            const response = await fetch(
                API_PASSWORD_URL,
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

            form.reset();

            showMessage(
                "Votre mot de passe a été modifié.",
                false
            );

            globalThis.setTimeout(
                navigateToAccount,
                1000
            );
        } catch (error) {
            console.error(
                "Impossible de modifier le mot de passe :",
                error
            );

            showMessage(
                error.message ||
                "Impossible de modifier le mot de passe.",
                true
            );
        } finally {
            submitButton.disabled = false;
            submitButton.textContent =
                "Modifier le mot de passe";
        }
    }

    function navigateToAccount() {
        if (
            typeof globalThis.navigateTo ===
            "function"
        ) {
            globalThis.navigateTo("/account");
            return;
        }

        globalThis.location.href = "/";
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
                result.message ||
                "Le mot de passe actuel est incorrect."
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