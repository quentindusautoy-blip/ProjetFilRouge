import Route from "./Route.js";
import { allRoutes, websiteName } from "./allRoutes.js";

// À modifier après une importante mise à jour des scripts.
const SCRIPT_VERSION = "20260722-2";

// Route utilisée lorsqu’aucune adresse ne correspond.
const route404 = new Route(
  "/404",
  "Page introuvable",
  "/pages/404.html",
  []
);

let currentPageScript = null;
let currentLoadingId = 0;

/**
 * Uniformise les chemins.
 *
 * Exemple :
 * /galerie/ devient /galerie
 */
const normalizePath = (path) => {
  if (!path || path === "/") {
    return "/";
  }

  return path.replace(/\/+$/, "");
};

/**
 * Recherche une route à partir de son URL.
 */
const getRouteByUrl = (url) => {
  const normalizedUrl = normalizePath(url);

  const selectedRoute = allRoutes.find(
    (routeElement) =>
      normalizePath(routeElement.url) === normalizedUrl
  );

  return selectedRoute || route404;
};

/**
 * Vérifie si l’utilisateur peut accéder à la route.
 */
const userCanAccessRoute = (actualRoute) => {
  const authorizedRoles = Array.isArray(actualRoute.authorize)
    ? actualRoute.authorize
    : [];

  // Route publique.
  if (authorizedRoles.length === 0) {
    return true;
  }

  const connected =
    typeof globalThis.isConnected === "function"
      ? globalThis.isConnected()
      : false;

  // Pages réservées aux utilisateurs déconnectés.
  if (authorizedRoles.includes("disconnected")) {
    return !connected;
  }

  const userRole =
    typeof globalThis.getRole === "function"
      ? globalThis.getRole()
      : null;

  return authorizedRoles.includes(userRole);
};

/**
 * Redirige vers l’accueil sans recharger complètement le site.
 */
const redirectToHome = async () => {
  globalThis.history.replaceState({}, "", "/");
  await LoadContentPage();
};

/**
 * Ajoute un numéro de version à une ressource.
 *
 * Exemple :
 * /js/galerie.js
 * devient :
 * /js/galerie.js?v=20260722-2
 */
const addVersionToResource = (resourcePath) => {
  const separator = resourcePath.includes("?")
    ? "&"
    : "?";

  return `${resourcePath}${separator}v=${SCRIPT_VERSION}`;
};

/**
 * Supprime l’ancien JavaScript de page et charge le nouveau.
 */
const loadPageScript = (scriptPath) => {
  if (currentPageScript) {
    currentPageScript.remove();
    currentPageScript = null;
  }

  if (!scriptPath) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const scriptTag = document.createElement("script");
    const versionedScriptPath =
      addVersionToResource(scriptPath);

    scriptTag.type = "text/javascript";
    scriptTag.src = versionedScriptPath;
    scriptTag.dataset.pageScript = "true";

    scriptTag.addEventListener(
      "load",
      () => {
        resolve();
      },
      {
        once: true,
      }
    );

    scriptTag.addEventListener(
      "error",
      () => {
        console.error(
          "Impossible de charger le fichier JavaScript : "
          + versionedScriptPath
        );

        resolve();
      },
      {
        once: true,
      }
    );

    currentPageScript = scriptTag;
    document.body.appendChild(scriptTag);
  });
};

/**
 * Affiche ou masque les éléments selon le rôle connecté.
 */
const updateElementsForRoles = () => {
  if (
    typeof globalThis.showAndhideElementsForRoles ===
    "function"
  ) {
    globalThis.showAndhideElementsForRoles();
  }
};

/**
 * Affiche une erreur directement dans la zone principale.
 */
const displayLoadingError = (message) => {
  const mainPage = document.getElementById("main-page");

  if (!mainPage) {
    console.error(
      'L’élément avec l’identifiant "main-page" '
      + "est introuvable."
    );
    return;
  }

  mainPage.replaceChildren();

  const container = document.createElement("div");
  container.className =
    "container py-5 text-center";

  const title = document.createElement("h1");
  title.className = "h3";
  title.textContent = "Une erreur est survenue";

  const paragraph = document.createElement("p");
  paragraph.textContent = message;

  const homeLink = document.createElement("a");
  homeLink.href = "/";
  homeLink.className = "btn btn-primary";
  homeLink.textContent = "Retour à l’accueil";

  container.append(
    title,
    paragraph,
    homeLink
  );

  mainPage.appendChild(container);
};

/**
 * Charge le contenu HTML et JavaScript correspondant à l’URL.
 */
const LoadContentPage = async () => {
  const loadingId = ++currentLoadingId;

  const currentPath = normalizePath(
    globalThis.location.pathname
  );

  const actualRoute = getRouteByUrl(currentPath);

  // Vérification des droits d’accès.
  if (!userCanAccessRoute(actualRoute)) {
    await redirectToHome();
    return;
  }

  const mainPage = document.getElementById(
    "main-page"
  );

  if (!mainPage) {
    console.error(
      'L’élément avec l’identifiant "main-page" '
      + "est introuvable."
    );
    return;
  }

  try {
    const response = await fetch(
      actualRoute.pathHtml,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(
        `Erreur HTTP ${response.status} `
        + `pour ${actualRoute.pathHtml}`
      );
    }

    const html = await response.text();

    // Ignore la réponse si une autre page a été
    // demandée entre-temps.
    if (loadingId !== currentLoadingId) {
      return;
    }

    mainPage.innerHTML = html;

    document.title =
      `${actualRoute.title} - ${websiteName}`;

    await loadPageScript(actualRoute.pathJS);

    updateElementsForRoles();

    globalThis.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  } catch (error) {
    console.error(
      "Impossible de charger la page :",
      error
    );

    displayLoadingError(
      "La page demandée n’a pas pu être chargée."
    );

    document.title =
      `Erreur - ${websiteName}`;
  }
};

/**
 * Navigue vers une route sans rechargement complet.
 */
const navigateTo = async (
  url,
  replaceHistory = false
) => {
  const destination = new URL(
    url,
    globalThis.location.origin
  );

  // Les liens externes restent gérés normalement.
  if (
    destination.origin !==
    globalThis.location.origin
  ) {
    globalThis.location.href = destination.href;
    return;
  }

  const destinationUrl =
    destination.pathname
    + destination.search
    + destination.hash;

  if (replaceHistory) {
    globalThis.history.replaceState(
      {},
      "",
      destinationUrl
    );
  } else {
    globalThis.history.pushState(
      {},
      "",
      destinationUrl
    );
  }

  await LoadContentPage();
};

/**
 * Fonction utilisable avec onclick="route(event)".
 */
const routeEvent = (event) => {
  event = event || globalThis.event;

  if (!event) {
    return;
  }

  event.preventDefault();

  const link = event.currentTarget;

  if (!link?.href) {
    return;
  }

  navigateTo(link.href);
};

/**
 * Intercepte automatiquement tous les liens internes.
 */
document.addEventListener("click", (event) => {
  if (
    event.defaultPrevented
    || event.button !== 0
    || event.ctrlKey
    || event.metaKey
    || event.shiftKey
    || event.altKey
  ) {
    return;
  }

  const link = event.target.closest("a[href]");

  if (!link) {
    return;
  }

  if (
    link.target === "_blank"
    || link.hasAttribute("download")
    || Object.hasOwn(link.dataset, "noRouter")
  ) {
    return;
  }

  const rawHref = link.getAttribute("href");

  if (
    !rawHref
    || rawHref.startsWith("#")
    || rawHref.startsWith("mailto:")
    || rawHref.startsWith("tel:")
    || rawHref.startsWith("javascript:")
  ) {
    return;
  }

  const destination = new URL(
    link.href,
    globalThis.location.origin
  );

  if (
    destination.origin !==
    globalThis.location.origin
  ) {
    return;
  }

  event.preventDefault();
  navigateTo(destination.href);
});

/**
 * Gestion des boutons précédent et suivant
 * du navigateur.
 */
globalThis.addEventListener(
  "popstate",
  () => {
    LoadContentPage();
  }
);

// Fonctions rendues accessibles aux autres fichiers.
globalThis.route = routeEvent;
globalThis.navigateTo = navigateTo;
globalThis.LoadContentPage = LoadContentPage;

// Chargement initial.
LoadContentPage();