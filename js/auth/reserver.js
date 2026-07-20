(() => {
    const API_URL = "http://127.0.0.1:8000/api";

    const bookingForm =
        document.getElementById("bookingForm");

    const lastNameInput =
        document.getElementById("NomInput");

    const firstNameInput =
        document.getElementById("PrenomInput");

    const allergyInput =
        document.getElementById("AllergieInput");

    const guestNumberInput =
        document.getElementById("NbConvivesInput");

    const dateInput =
        document.getElementById("DateInput");

    const lunchRadio =
        document.getElementById("midiRadio");

    const dinnerRadio =
        document.getElementById("soirRadio");

    const hourSelect =
        document.getElementById("selectHour");

    const bookingMessage =
        document.getElementById("bookingMessage");

    const submitButton =
        document.getElementById("submitBookingButton");

    if (
        !bookingForm
        || !dateInput
        || !hourSelect
    ) {
        console.error(
            "Le formulaire de réservation est introuvable."
        );
        return;
    }

    const serviceHours = {
        midi: [
            "12:00",
            "12:15",
            "12:30",
            "12:45",
            "13:00",
            "13:15",
            "13:30",
            "13:45",
        ],
        soir: [
            "19:00",
            "19:15",
            "19:30",
            "19:45",
            "20:00",
            "20:15",
            "20:30",
            "20:45",
            "21:00",
            "21:15",
            "21:30",
            "21:45",
        ],
    };

    initializeBookingPage();

    async function initializeBookingPage() {
        setMinimumBookingDate();
        updateHourOptions();
        await loadCurrentUser();
    }

    function setMinimumBookingDate() {
        const today = new Date();

        const minimumDate = [
            today.getFullYear(),
            String(today.getMonth() + 1).padStart(2, "0"),
            String(today.getDate()).padStart(2, "0"),
        ].join("-");

        dateInput.min = minimumDate;

        if (!dateInput.value) {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            dateInput.value = [
                tomorrow.getFullYear(),
                String(tomorrow.getMonth() + 1).padStart(2, "0"),
                String(tomorrow.getDate()).padStart(2, "0"),
            ].join("-");
        }
    }

    function updateHourOptions() {
        const selectedService =
            dinnerRadio.checked ? "soir" : "midi";

        hourSelect.replaceChildren();

        serviceHours[selectedService].forEach((hour) => {
            const option =
                document.createElement("option");

            option.value = hour;
            option.textContent = hour;

            hourSelect.appendChild(option);
        });
    }

    lunchRadio.addEventListener(
        "change",
        updateHourOptions
    );

    dinnerRadio.addEventListener(
        "change",
        updateHourOptions
    );

    async function loadCurrentUser() {
        const token = getToken();

        if (!token) {
            showMessage(
                "Vous devez être connecté pour réserver.",
                true
            );
            submitButton.disabled = true;
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/account/me`,
                {
                    method: "GET",
                    headers: {
                        "X-AUTH-TOKEN": token,
                        Accept: "application/json",
                    },
                }
            );

            const result = await readResponse(response);

            if (!response.ok) {
                throw new Error(
                    result.message ||
                    `Erreur HTTP ${response.status}`
                );
            }

            lastNameInput.value =
                result.lastName || "";

            firstNameInput.value =
                result.firstName || "";

            allergyInput.value =
                result.allergy || "";

            guestNumberInput.value =
                result.guestNumber || 1;
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
        }
    }

    bookingForm.addEventListener(
        "submit",
        createBooking
    );

    async function createBooking(event) {
        event.preventDefault();

        const token = getToken();

        if (!token) {
            showMessage(
                "Vous devez être connecté pour réserver.",
                true
            );
            return;
        }

        const guestNumber =
            Number(guestNumberInput.value);

        if (
            !Number.isInteger(guestNumber)
            || guestNumber < 1
        ) {
            showMessage(
                "Le nombre de convives est invalide.",
                true
            );
            return;
        }

        if (!dateInput.value || !hourSelect.value) {
            showMessage(
                "Sélectionnez une date et une heure.",
                true
            );
            return;
        }

        const body = {
            restaurantId: 1,
            guestNumber,
            bookingDate: dateInput.value,
            bookingTime: hourSelect.value,
            allergy:
                allergyInput.value.trim() || null,
        };

        submitButton.disabled = true;
        submitButton.textContent =
            "Enregistrement...";

        hideMessage();

        try {
            const response = await fetch(
                `${API_URL}/bookings`,
                {
                    method: "POST",
                    headers: {
                        "X-AUTH-TOKEN": token,
                        Accept: "application/json",
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify(body),
                }
            );

            const result = await readResponse(response);

            if (!response.ok) {
                throw new Error(
                    result.message ||
                    `Erreur HTTP ${response.status}`
                );
            }

            showMessage(
                "Votre réservation a bien été enregistrée.",
                false
            );

            setTimeout(() => {
                globalThis.navigateTo("/allResa");
            }, 800);
        } catch (error) {
            console.error(
                "Erreur pendant la réservation :",
                error
            );

            showMessage(
                error.message ||
                "Impossible d’enregistrer la réservation.",
                true
            );
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Réserver";
        }
    }

    async function readResponse(response) {
        const contentType =
            response.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
            return response.json();
        }

        return {};
    }

    function showMessage(message, isError) {
        bookingMessage.textContent = message;

        bookingMessage.classList.remove(
            "d-none",
            "alert-danger",
            "alert-success"
        );

        bookingMessage.classList.add(
            isError ? "alert-danger" : "alert-success"
        );
    }

    function hideMessage() {
        bookingMessage.textContent = "";

        bookingMessage.classList.add("d-none");

        bookingMessage.classList.remove(
            "alert-danger",
            "alert-success"
        );
    }
})();