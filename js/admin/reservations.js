(() => {
    const API_URL = "/backend/api";
    const RESTAURANT_ID = 1;

    const page = document.getElementById(
        "adminBookingsPage"
    );

    if (!page) {
        return;
    }

    const filterForm = document.getElementById(
        "adminBookingsFilterForm"
    );

    const dateInput = document.getElementById(
        "adminBookingDate"
    );

    const searchButton = document.getElementById(
        "adminBookingsSearchButton"
    );

    const messageContainer = document.getElementById(
        "adminBookingsMessage"
    );

    const loadingContainer = document.getElementById(
        "adminBookingsLoading"
    );

    const emptyContainer = document.getElementById(
        "adminBookingsEmpty"
    );

    const tableContainer = document.getElementById(
        "adminBookingsTableContainer"
    );

    const tableBody = document.getElementById(
        "adminBookingsTableBody"
    );

    const selectedDateElement = document.getElementById(
        "adminSelectedDate"
    );

    const restaurantNameElement = document.getElementById(
        "adminRestaurantName"
    );

    const bookingCountElement = document.getElementById(
        "adminBookingCount"
    );

    const totalGuestsElement = document.getElementById(
        "adminTotalGuests"
    );

    const maximumCapacityElement = document.getElementById(
        "adminMaximumCapacity"
    );

    const lunchGuestsElement = document.getElementById(
        "adminLunchGuests"
    );

    const lunchRemainingElement = document.getElementById(
        "adminLunchRemaining"
    );

    const dinnerGuestsElement = document.getElementById(
        "adminDinnerGuests"
    );

    const dinnerRemainingElement = document.getElementById(
        "adminDinnerRemaining"
    );

    initializePage();

    function initializePage() {
        dateInput.value = getLocalDateValue(
            new Date()
        );

        filterForm.addEventListener(
            "submit",
            handleFilterSubmit
        );

        loadBookings();
    }

    function handleFilterSubmit(event) {
        event.preventDefault();
        loadBookings();
    }

    async function loadBookings() {
        const token = getAuthenticationToken();

        hideMessage();
        hideResults();
        showLoading(true);

        if (!token) {
            showLoading(false);

            showMessage(
                "Vous devez être connecté comme administrateur.",
                true
            );

            return;
        }

        const selectedDate = dateInput.value;

        if (!selectedDate) {
            showLoading(false);

            showMessage(
                "Sélectionnez une date.",
                true
            );

            return;
        }

        searchButton.disabled = true;
        searchButton.textContent = "Chargement...";

        try {
            const url = new URL(
                `${API_URL}/admin/bookings`,
                globalThis.location.origin
            );

            url.searchParams.set(
                "date",
                selectedDate
            );

            url.searchParams.set(
                "restaurantId",
                String(RESTAURANT_ID)
            );

            const response = await fetch(
                url.toString(),
                {
                    method: "GET",
                    headers: {
                        "X-AUTH-TOKEN": token,
                        Accept: "application/json",
                    },
                }
            );

            const result = await readApiResponse(
                response
            );

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error(
                        "Votre session a expiré. Reconnectez-vous."
                    );
                }

                if (response.status === 403) {
                    throw new Error(
                        "Cette page est réservée à l’administrateur."
                    );
                }

                throw new Error(
                    result.message ||
                    `Erreur HTTP ${response.status}`
                );
            }

            updateSummary(result);
            renderBookings(result.bookings);
        } catch (error) {
            console.error(
                "Impossible de charger les réservations :",
                error
            );

            showMessage(
                error.message ||
                "Impossible de charger les réservations.",
                true
            );
        } finally {
            showLoading(false);

            searchButton.disabled = false;
            searchButton.textContent =
                "Afficher les réservations";
        }
    }

    function updateSummary(result) {
        const summary = result.summary || {};
        const restaurant = result.restaurant || {};

        selectedDateElement.textContent = formatDate(
            result.date
        );

        restaurantNameElement.textContent =
            restaurant.name || "Le Quai Antique";

        bookingCountElement.textContent =
            summary.bookingCount ?? 0;

        totalGuestsElement.textContent =
            summary.totalGuests ?? 0;

        maximumCapacityElement.textContent =
            restaurant.maximumCapacity ?? 0;

        lunchGuestsElement.textContent =
            summary.lunchGuests ?? 0;

        lunchRemainingElement.textContent =
            summary.lunchRemainingCapacity ?? 0;

        dinnerGuestsElement.textContent =
            summary.dinnerGuests ?? 0;

        dinnerRemainingElement.textContent =
            summary.dinnerRemainingCapacity ?? 0;
    }

    function renderBookings(bookings) {
        tableBody.replaceChildren();

        if (
            !Array.isArray(bookings) ||
            bookings.length === 0
        ) {
            emptyContainer.classList.remove("d-none");
            tableContainer.classList.add("d-none");
            return;
        }

        emptyContainer.classList.add("d-none");
        tableContainer.classList.remove("d-none");

        bookings.forEach((booking) => {
            tableBody.appendChild(
                createBookingRow(booking)
            );
        });
    }

    function createBookingRow(booking) {
        const row = document.createElement("tr");

        const timeCell = document.createElement("td");
        timeCell.textContent =
            booking.bookingTime || "—";

        const clientCell = document.createElement("td");

        const firstName =
            booking.client?.firstName || "";

        const lastName =
            booking.client?.lastName || "";

        clientCell.textContent =
            `${firstName} ${lastName}`.trim() ||
            "Client inconnu";

        const emailCell = document.createElement("td");
        emailCell.textContent =
            booking.client?.email || "—";

        const guestCell = document.createElement("td");
        guestCell.textContent =
            booking.guestNumber ?? "—";

        const allergyCell = document.createElement("td");
        allergyCell.textContent =
            booking.allergy || "Aucune";

        const actionCell = document.createElement("td");

        const deleteButton =
            document.createElement("button");

        deleteButton.type = "button";
        deleteButton.className =
            "btn btn-sm btn-danger";

        deleteButton.textContent = "Annuler";

        deleteButton.addEventListener(
            "click",
            () => {
                cancelBooking(
                    booking.id,
                    deleteButton
                );
            }
        );

        actionCell.appendChild(deleteButton);

        row.append(
            timeCell,
            clientCell,
            emailCell,
            guestCell,
            allergyCell,
            actionCell
        );

        return row;
    }

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

        const token = getAuthenticationToken();

        if (!token) {
            showMessage(
                "Vous devez être connecté.",
                true
            );

            return;
        }

        deleteButton.disabled = true;
        deleteButton.textContent = "Annulation...";

        try {
            const response = await fetch(
                `${API_URL}/bookings/${bookingId}`,
                {
                    method: "DELETE",
                    headers: {
                        "X-AUTH-TOKEN": token,
                        Accept: "application/json",
                    },
                }
            );

            if (!response.ok) {
                const result = await readApiResponse(
                    response
                );

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
            deleteButton.textContent = "Annuler";
        }
    }

    function getAuthenticationToken() {
        if (
            typeof globalThis.getToken === "function"
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
            response.headers.get("content-type") || "";

        if (
            contentType.includes("application/json")
        ) {
            return response.json();
        }

        return {};
    }

    function getLocalDateValue(date) {
        const year = date.getFullYear();

        const month = String(
            date.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
            date.getDate()
        ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    function formatDate(value) {
        if (
            typeof value !== "string" ||
            !value.includes("-")
        ) {
            return value || "—";
        }

        const [year, month, day] =
            value.split("-");

        return `${day}/${month}/${year}`;
    }

    function showLoading(isLoading) {
        loadingContainer.classList.toggle(
            "d-none",
            !isLoading
        );
    }

    function hideResults() {
        tableContainer.classList.add("d-none");
        emptyContainer.classList.add("d-none");
        tableBody.replaceChildren();
    }

    function showMessage(message, isError) {
        messageContainer.textContent = message;

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

        messageContainer.classList.add("d-none");

        messageContainer.classList.remove(
            "alert-danger",
            "alert-success"
        );
    }
})();