alert("Image sélectionnée !");

const galerieImages = document.getElementById("allImages");

//Recuperer les informations des images

let titre = "Titre de l'image";
let imgSource = "./images/Bigtitle.jpg";

let monImage = getImage(titre, imgSource);

galerieImages.innerHTML = monImage;



function getImage(titre, urlImage){
    titre= sanitizeHtml(titre);
    urlImage = sanitizeHtml(urlImage);
    return `<div class="col p-3">
            <div class="image-card text-white">
                <img src="${urlImage}" class="rounded w-100" alt="${titre}"/>
                <p class="titre-image">${titre}</p>
                <div data-show="admin" class="action-image-buttons">
                    <button type="button" class="btn btn-outline-light edit-btn" data-bs-toggle="modal" data-bs-target="#exampleModal"><i class="bi bi-pencil-square"></i></button>
                    <button type="button" class="btn btn-outline-light" data-bs-toggle="modal" data-bs-target="#DeletePhotoModal"><i class="bi bi-trash"></i></button>
                </div>
            </div>
        </div>`;
}