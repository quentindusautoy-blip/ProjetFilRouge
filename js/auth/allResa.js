(() => {
    const API_BOOKINGS_URL =
        "http://127.0.0.1:8000/api/bookings";

    const bookingsContainer =
        document.getElementById("allReservations");

    const bookingsMessage =
        document.getElementById("bookingsMessage");

    if (!bookingsContainer) {
        console.error(
            "Le conteneur des réservations est introuvable."
        );
        return;
    }

    loadBookings();

    /**
     * Charge les réservations du compte connecté.
     */
    async function loadBookings() {
        const token = getToken();

        bookingsContainer.replaceChildren();

        const loadingMessage =
            document.createElement("p");

        loadingMessage.className = "text-center";
        loadingMessage.textContent =
            "Chargement de vos réservations...";

        bookingsContainer.appendChild(loadingMessage);

        hideMessage();

        if (!token) {
            displayEmptyState(
                "Vous devez être connecté pour consulter vos réservations."
            );
            return;
        }

        try {
            const response = await fetch(
                `${API_BOOKINGS_URL}/me`,
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
                throw new Error(
                    result.message ||
                    `Erreur HTTP ${response.status}`
                );
            }

            if (!Array.isArray(result)) {
                throw new TypeError(
                    "Le format de la réponse est invalide."
                );
            }

            bookingsContainer.replaceChildren();

            if (result.length === 0) {
                displayEmptyState(
                    "Vous n’avez aucune réservation."
                );
                return;
            }

            result.forEach((booking) => {
                bookingsContainer.appendChild(
                    createBookingCard(booking)
                );
            });
        } catch (error) {
            console.error(
                "Impossible de charger les réservations :",
                error
            );

            bookingsContainer.replaceChildren();

            showMessage(
                error.message ||
                "Impossible de charger vos réservations.",
                true
            );
        }
    }

    /**
     * Construit une carte pour une réservation.
     */
    function createBookingCard(booking) {
        const card = document.createElement("article");

        card.className =
            "border rounded p-3 shadow-sm text-start";

        const title = document.createElement("h2");
        title.className = "h5";

        title.textContent =
            booking.restaurant?.name ||
            "Le Quai Antique";

        const details = document.createElement("p");
        details.className = "mb-2";

        const guestLabel =
            booking.guestNumber > 1
                ? "personnes"
                : "personne";

        details.textContent =
            `${formatDate(booking.bookingDate)} à ` +
            `${booking.bookingTime} — ` +
            `${booking.guestNumber} ${guestLabel}`;

        const allergy = document.createElement("p");
        allergy.className = "mb-3";

        allergy.textContent = booking.allergy
            ? `Allergies : ${booking.allergy}`
            : "Aucune allergie renseignée";

        const actions = document.createElement("div");
        actions.className = "text-end";

        const deleteButton =
            document.createElement("button");

        deleteButton.type = "button";
        deleteButton.className = "btn btn-danger";
        deleteButton.textContent =
            "Annuler la réservation";

        deleteButton.addEventListener("click", () => {
            cancelBooking(
                booking.id,
                deleteButton
            );
        });

        actions.appendChild(deleteButton);

        card.append(
            title,
            details,
            allergy,
            actions
        );

        return card;
    }

    /**
     * Annule une réservation appartenant au compte.
     */
    async function cancelBooking(
        bookingId,
        deleteButton
    ) {
        const confirmed = globalThis.confirm(
            "Confirmer l’annulation de cette réservation ?"
        );

        if (!confirmed) {
            return;
        }

        const token = getToken();

        if (!token) {
            showMessage(
                "Vous devez être connecté.",
                true
            );
            return;
        }

        deleteButton.disabled = true;
        deleteButton.textContent =
            "Annulation...";

        hideMessage();

        try {
            const response = await fetch(
                `${API_BOOKINGS_URL}/${bookingId}`,
                {
                    method: "DELETE",
                    headers: {
                        "X-AUTH-TOKEN": token,
                        Accept: "application/json",
                    },
                }
            );

            if (!response.ok) {
                const result =
                    await readApiResponse(response);

                throw new Error(
                    result.message ||
                    `Erreur HTTP ${response.status}`
                );
            }

            showMessage(
                "La réservation a été annulée.",
                false
            );

            await loadBookings();
        } catch (error) {
            console.error(
                "Impossible d’annuler la réservation :",
                error
            );

            showMessage(
                error.message ||
                "Impossible d’annuler la réservation.",
                true
            );

            deleteButton.disabled = false;
            deleteButton.textContent =
                "Annuler la réservation";
        }
    }

    function formatDate(value) {
        if (
            typeof value !== "string" ||
            !value.includes("-")
        ) {
            return value || "Date inconnue";
        }

        const [year, month, day] =
            value.split("-");

        return `${day}/${month}/${year}`;
    }

    async function readApiResponse(response) {
        if (response.status === 204) {
            return {};
        }

        const contentType =
            response.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
            return response.json();
        }

        return {};
    }

    function displayEmptyState(message) {
        bookingsContainer.replaceChildren();

        const paragraph =
            document.createElement("p");

        paragraph.className =
            "text-center py-4";

        paragraph.textContent = message;

        bookingsContainer.appendChild(paragraph);
    }

    function showMessage(message, isError) {
        bookingsMessage.textContent = message;

        bookingsMessage.classList.remove(
            "d-none",
            "alert-danger",
            "alert-success"
        );

        bookingsMessage.classList.add(
            isError
                ? "alert-danger"
                : "alert-success"
        );
    }

    function hideMessage() {
        bookingsMessage.textContent = "";

        bookingsMessage.classList.add("d-none");

        bookingsMessage.classList.remove(
            "alert-danger",
            "alert-success"
        );
    }
})();