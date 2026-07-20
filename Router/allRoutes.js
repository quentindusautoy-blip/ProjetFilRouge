import Route from "./Route.js";

// Définition des routes du site
export const allRoutes = [
    new Route("/","Accueil","/pages/home.html",[]),
    new Route("/galerie","La galerie","/pages/galerie.html",[],"/js/galerie.js"),
    new Route("/carte","La carte","/pages/carte.html",[]),
    new Route("/signin","Connexion","/pages/auth/signin.html",["disconnected"],"/js/auth/signin.js"),
    new Route("/signup","Inscription","/pages/auth/signup.html",["disconnected"],"/js/auth/signup.js"),
    new Route("/account","Mon compte","/pages/auth/account.html",["admin", "client"]),
    new Route("/editPassword","Modifier le mot de passe","/pages/auth/editPassword.html",["admin", "client"],"/js/auth/editPassword.js"),
    new Route("/allResa","Toutes les réservations","/pages/reservations/allResa.html",["admin", "client"],"/js/auth/allResa.js"),
    new Route("/reserver","Réserver","/pages/reservations/reserver.html",["admin", "client"],"/js/auth/reserver.js"),
];

// Le titre s'affiche sous la forme : titre de la route - nom du site
export const websiteName = "Quai Antique";