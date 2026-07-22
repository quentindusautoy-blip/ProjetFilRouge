// Adresse de l'API en production.
const API_URL = "/backend/api";

const mailInput = document.getElementById("EmailInput");
const passwordInput = document.getElementById("PasswordInput");
const btnSignin = document.getElementById("btnSignin");
const signinForm = document.getElementById("signinForm");

signinForm.addEventListener("submit", checkCredentials);

async function checkCredentials(event) {
    event.preventDefault();

    mailInput.classList.remove("is-invalid");
    passwordInput.classList.remove("is-invalid");

    btnSignin.disabled = true;

    const dataForm = new FormData(signinForm);

    const credentials = {
        username: dataForm.get("Email"),
        password: dataForm.get("Password")
    };

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(credentials)
        });

        if (!response.ok) {
            mailInput.classList.add("is-invalid");
            passwordInput.classList.add("is-invalid");
            return;
        }

        const result = await response.json();

        if (!result.apiToken) {
            throw new Error(
                "Le jeton d'authentification est absent."
            );
        }

        if (!Array.isArray(result.roles)) {
            throw new TypeError(
                "La liste des rôles est absente."
            );
        }

        setToken(result.apiToken);

        const applicationRole = result.roles.includes(
            "ROLE_ADMIN"
        )
            ? "admin"
            : "client";

        setCookie(
            RoleCookieName,
            applicationRole,
            7
        );

        globalThis.location.replace("/");
    } catch (error) {
        console.error(
            "Erreur pendant la connexion :",
            error
        );

        mailInput.classList.add("is-invalid");
        passwordInput.classList.add("is-invalid");
    } finally {
        btnSignin.disabled = false;
    }
}
