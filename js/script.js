const tokenCookieName= "accesstoken";
const RoleCookieName = "role";
const signoutBtn = document.getElementById("signout-btn");
const apiUrl = "http://127.0.0.1:8000/api/";

if (signoutBtn) {
    signoutBtn.addEventListener("click", signout);
}


function getRole(){
    return getCookie(RoleCookieName);
}

async function signout(event) {
    event?.preventDefault();

    const token = getToken();

    try {
        if (token) {
            await fetch(apiUrl + "logout", {
                method: "POST",
                headers: {
                    "X-AUTH-TOKEN": token
                }
            });
        }
    } catch (error) {
        console.error("Erreur pendant la déconnexion :", error);
    } finally {
        eraseCookie(tokenCookieName);
        eraseCookie(RoleCookieName);
        globalThis.location.replace("/");
    }
}

function setToken (token){
    setCookie(tokenCookieName, token, 7);
}

function getToken(){
    return getCookie(tokenCookieName);
}

function setCookie(name,value,days) {
    let expires = "";
    if (days) {
        let date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

function getCookie(name) {
    let nameEQ = name + "=";
    let ca = document.cookie.split(';');
    for(const element of ca) {
        let c = element;
        while (c.startsWith(' ')) c = c.substring(1,c.length);
        if (c.startsWith(nameEQ)) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

function eraseCookie(name) {   
    document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

function isConnected() {
    const token = getToken();

    return token !== null && token !== undefined && token !== "";
}



/* 
Disconnected
Connected (admin ou client)
    -admin
    -client
*/

function showAndhideElementsForRoles(rootElement = document) {
    const userConnected = isConnected();
    const role = getRole();

    const elementsToEdit =
        rootElement.querySelectorAll("[data-show]");

    elementsToEdit.forEach((element) => {
        const requiredRole = element.dataset.show;
        let shouldShow = true;

        switch (requiredRole) {
            case "disconnected":
                shouldShow = !userConnected;
                break;

            case "connected":
                shouldShow = userConnected;
                break;

            case "admin":
                shouldShow =
                    userConnected && role === "admin";
                break;

            case "client":
                shouldShow =
                    userConnected && role === "client";
                break;

            default:
                shouldShow = true;
        }

        element.classList.toggle(
            "d-none",
            !shouldShow
        );
    });
}

// Rend la fonction utilisable par les scripts
// chargés dynamiquement par le routeur.
globalThis.showAndhideElementsForRoles =
    showAndhideElementsForRoles;

function sanitizeHtml(text) {
    const tempHtml = document.createElement('div');
    tempHtml.textContent = text;
    return tempHtml.innerHTML;
}

function getInfosUser(){

    let myHeaders = new Headers();
    myHeaders.append("X-AUTH-TOKEN", getToken());



    let requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
    };
    
    fetch(apiUrl+"account/me", requestOptions)
    .then(response => {
        if(response.ok){
            return response.json();
        }
        else{
            console.log("Impossible de récupération des infos utilisateur");
        }
    })
    .then(result => {
        return result;
    })
    .catch (error => {
        console.log('Erreur lors de la recuperation des données utilisateurs', error)
    });
}
