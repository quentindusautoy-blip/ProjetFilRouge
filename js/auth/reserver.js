(() => {
    const API_URL =
        "http://127.0.0.1:8000/api";

    const RESTAURANT_ID = 1;
    const SLOT_DURATION_MINUTES = 15;

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
        document.getElementById(
            "submitBookingButton"
        );

    const lunchLabel =
        document.querySelector(
            'label[for="midiRadio"]'
        );

    const dinnerLabel =
        document.querySelector(
            'label[for="soirRadio"]'
        );

    if (
        !bookingForm ||
        !lastNameInput ||
        !firstNameInput ||
        !allergyInput ||
        !guestNumberInput ||
        !dateInput ||
        !lunchRadio ||
        !dinnerRadio ||
        !hourSelect ||
        !bookingMessage ||
        !submitButton
    ) {
        console.error(
            "Le formulaire de réservation est incomplet."
        );
        return;
    }

    let restaurantData = null;
    let accountLoaded = false;
    let requestInProgress = false;

    const serviceHours = {
        midi: [],
        soir: [],
    };

    initializeBookingPage();

    async function initializeBookingPage() {
        setMinimumBookingDate();
        addEventListeners();
        setFormLoadingState(true);

        const [
            restaurantLoaded,
            userLoaded,
        ] = await Promise.all([
            loadRestaurant(),
            loadCurrentUser(),
        ]);

        accountLoaded = userLoaded;

        if (restaurantLoaded) {
            updateHourOptions();
        }

        setFormLoadingState(false);
        updateSubmitAvailability();
    }

    function addEventListeners() {
        lunchRadio.addEventListener(
            "change",
            updateHourOptions
        );

        dinnerRadio.addEventListener(
            "change",
            updateHourOptions
        );

        dateInput.addEventListener(
            "change",
            updateHourOptions
        );

        guestNumberInput.addEventListener(
            "input",
            updateSubmitAvailability
        );

        bookingForm.addEventListener(
            "submit",
            createBooking
        );
    }

    /**
     * Charge les horaires et la capacité
     * directement depuis Symfony.
     */
    async function loadRestaurant() {
        try {
            const response = await fetch(
                `${API_URL}/restaurant/${RESTAURANT_ID}`,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                    },
                }
            );

            const result =
                await readResponse(response);

            if (!response.ok) {
                throw new Error(
                    result.message ||
                    `Erreur HTTP ${response.status}`
                );
            }

            if (
                !Array.isArray(
                    result.amOpeningTime
                ) ||
                !Array.isArray(
                    result.pmOpeningTime
                )
            ) {
                throw new TypeError(
                    "Les horaires du restaurant sont invalides."
                );
            }

            restaurantData = result;

            serviceHours.midi =
                generateTimeSlots(
                    result.amOpeningTime,
                    SLOT_DURATION_MINUTES
                );

            serviceHours.soir =
                generateTimeSlots(
                    result.pmOpeningTime,
                    SLOT_DURATION_MINUTES
                );

            guestNumberInput.max =
                String(result.maxGuest);

            updateServiceLabels(result);

            return true;
        } catch (error) {
            console.error(
                "Impossible de charger le restaurant :",
                error
            );

            showMessage(
                error.message ||
                "Impossible de charger les horaires du restaurant.",
                true
            );

            return false;
        }
    }

    /**
     * Génère les créneaux entre l’ouverture
     * et la fermeture.
     *
     * Exemple :
     * 12:00 - 14:00
     * produit 12:00, 12:15, ..., 13:45.
     */
    function generateTimeSlots(
        openingHours,
        durationMinutes
    ) {
        if (
            openingHours.length !== 2 ||
            !isValidTime(openingHours[0]) ||
            !isValidTime(openingHours[1])
        ) {
            return [];
        }

        const startMinutes =
            timeToMinutes(openingHours[0]);

        const endMinutes =
            timeToMinutes(openingHours[1]);

        if (startMinutes >= endMinutes) {
            return [];
        }

        const slots = [];

        for (
            let minutes = startMinutes;
            minutes < endMinutes;
            minutes += durationMinutes
        ) {
            slots.push(
                minutesToTime(minutes)
            );
        }

        return slots;
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

    function minutesToTime(totalMinutes) {
        const hours = Math.floor(
            totalMinutes / 60
        );

        const minutes =
            totalMinutes % 60;

        return [
            String(hours).padStart(2, "0"),
            String(minutes).padStart(2, "0"),
        ].join(":");
    }

    function updateServiceLabels(restaurant) {
        const lunchHours =
            restaurant.amOpeningTime;

        const dinnerHours =
            restaurant.pmOpeningTime;

        if (
            lunchLabel &&
            lunchHours.length === 2
        ) {
            lunchLabel.textContent =
                `Midi — ${lunchHours[0]} à ${lunchHours[1]}`;
        }

        if (
            dinnerLabel &&
            dinnerHours.length === 2
        ) {
            dinnerLabel.textContent =
                `Soir — ${dinnerHours[0]} à ${dinnerHours[1]}`;
        }
    }

    /**
     * Définit aujourd’hui comme date minimale
     * et sélectionne demain par défaut.
     */
    function setMinimumBookingDate() {
        const today = new Date();

        dateInput.min =
            getLocalDateValue(today);

        if (!dateInput.value) {
            const tomorrow =
                new Date(today);

            tomorrow.setDate(
                tomorrow.getDate() + 1
            );

            dateInput.value =
                getLocalDateValue(tomorrow);
        }
    }

    /**
     * Met à jour les heures selon le service
     * et la date sélectionnés.
     */
    function updateHourOptions() {
        const selectedService =
            dinnerRadio.checked
                ? "soir"
                : "midi";

        const availableHours =
            getAvailableHours(
                serviceHours[selectedService]
            );

        hourSelect.replaceChildren();

        if (availableHours.length === 0) {
            const option =
                document.createElement(
                    "option"
                );

            option.value = "";
            option.textContent =
                "Aucun créneau disponible";
            option.disabled = true;
            option.selected = true;

            hourSelect.appendChild(option);
            hourSelect.disabled = true;

            updateSubmitAvailability();
            return;
        }

        hourSelect.disabled = false;

        availableHours.forEach((hour) => {
            const option =
                document.createElement(
                    "option"
                );

            option.value = hour;
            option.textContent = hour;

            hourSelect.appendChild(option);
        });

        updateSubmitAvailability();
    }

    /**
     * Retire les horaires déjà passés
     * lorsque la date choisie est aujourd’hui.
     */
    function getAvailableHours(hours) {
        if (
            !Array.isArray(hours) ||
            hours.length === 0
        ) {
            return [];
        }

        const today = new Date();

        const todayValue =
            getLocalDateValue(today);

        if (dateInput.value !== todayValue) {
            return [...hours];
        }

        const currentTime = [
            String(
                today.getHours()
            ).padStart(2, "0"),

            String(
                today.getMinutes()
            ).padStart(2, "0"),
        ].join(":");

        return hours.filter(
            (hour) => hour > currentTime
        );
    }

    /**
     * Charge les préférences du client.
     */
    async function loadCurrentUser() {
        const token =
            getAuthenticationToken();

        if (!token) {
            showMessage(
                "Vous devez être connecté pour réserver.",
                true
            );

            return false;
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

            const result =
                await readResponse(response);

            if (!response.ok) {
                throw createApiError(
                    response,
                    result
                );
            }

            lastNameInput.value =
                result.lastName || "";

            firstNameInput.value =
                result.firstName || "";

            allergyInput.value =
                result.allergy || "";

            guestNumberInput.value =
                result.guestNumber ?? 1;

            return true;
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

            return false;
        }
    }

    /**
     * Crée la réservation.
     */
    async function createBooking(event) {
        event.preventDefault();

        const token =
            getAuthenticationToken();

        if (!token) {
            showMessage(
                "Vous devez être connecté pour réserver.",
                true
            );
            return;
        }

        if (!restaurantData) {
            showMessage(
                "Les informations du restaurant sont indisponibles.",
                true
            );
            return;
        }

        const guestNumber =
            Number(
                guestNumberInput.value
            );

        if (
            !Number.isInteger(
                guestNumber
            ) ||
            guestNumber < 1
        ) {
            showMessage(
                "Le nombre de convives est invalide.",
                true
            );
            return;
        }

        if (
            guestNumber >
            restaurantData.maxGuest
        ) {
            showMessage(
                `Le restaurant accepte au maximum ${restaurantData.maxGuest} convives par service.`,
                true
            );
            return;
        }

        if (
            !dateInput.value ||
            !hourSelect.value
        ) {
            showMessage(
                "Sélectionnez une date et une heure.",
                true
            );
            return;
        }

        const body = {
            restaurantId:
                restaurantData.id,

            guestNumber,

            bookingDate:
                dateInput.value,

            bookingTime:
                hourSelect.value,

            allergy:
                allergyInput.value.trim() ||
                null,
        };

        requestInProgress = true;
        updateSubmitAvailability();

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
                        Accept:
                            "application/json",
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify(
                        body
                    ),
                }
            );

            const result =
                await readResponse(response);

            if (!response.ok) {
                throw createApiError(
                    response,
                    result
                );
            }

            showMessage(
                "Votre réservation a bien été enregistrée.",
                false
            );

            globalThis.setTimeout(() => {
                if (
                    typeof globalThis
                        .navigateTo ===
                    "function"
                ) {
                    globalThis.navigateTo(
                        "/allResa"
                    );
                }
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
            requestInProgress = false;

            submitButton.textContent =
                "Réserver";

            updateSubmitAvailability();
        }
    }

    function updateSubmitAvailability() {
        const guestNumber =
            Number(
                guestNumberInput.value
            );

        const guestNumberIsValid =
            Number.isInteger(guestNumber) &&
            guestNumber >= 1 &&
            (
                !restaurantData ||
                guestNumber <=
                restaurantData.maxGuest
            );

        submitButton.disabled =
            requestInProgress ||
            !restaurantData ||
            !accountLoaded ||
            !guestNumberIsValid ||
            !dateInput.value ||
            !hourSelect.value;
    }

    function setFormLoadingState(
        isLoading
    ) {
        lunchRadio.disabled =
            isLoading;

        dinnerRadio.disabled =
            isLoading;

        dateInput.disabled =
            isLoading;

        hourSelect.disabled =
            isLoading;

        guestNumberInput.disabled =
            isLoading;

        allergyInput.disabled =
            isLoading;

        submitButton.disabled = true;

        submitButton.textContent =
            isLoading
                ? "Chargement..."
                : "Réserver";
    }

    function getLocalDateValue(date) {
        return [
            date.getFullYear(),

            String(
                date.getMonth() + 1
            ).padStart(2, "0"),

            String(
                date.getDate()
            ).padStart(2, "0"),
        ].join("-");
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
                "Vous n’êtes pas autorisé à effectuer cette action."
            );
        }

        if (response.status === 409) {
            return new Error(
                result.message ||
                "La capacité restante est insuffisante."
            );
        }

        return new Error(
            result.message ||
            `Erreur HTTP ${response.status}`
        );
    }

    async function readResponse(
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
        bookingMessage.textContent =
            message;

        bookingMessage.classList.remove(
            "d-none",
            "alert-danger",
            "alert-success"
        );

        bookingMessage.classList.add(
            isError
                ? "alert-danger"
                : "alert-success"
        );
    }

    function hideMessage() {
        bookingMessage.textContent = "";

        bookingMessage.classList.add(
            "d-none"
        );

        bookingMessage.classList.remove(
            "alert-danger",
            "alert-success"
        );
    }
})();