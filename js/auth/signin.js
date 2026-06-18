// EmailInput
// PasswordInput

const mailInput = document.getElementById("EmailInput");
const passwordInput = document.getElementById("PasswordInput");
const btnSignin = document.getElementById("btnSignin");


btnSignin.addEventListener("click", checkCredentials);

function checkCredentials(){
    // Ici il faudra appeler l'API pour verifier les credentials en BDD

    if(mailInput.value == "test@mail.com" && passwordInput.value == "123"){
        alert ("Vous etes connecté");

        // Il faudra recuperer le vrai token
        const token = "oqhdmobcmshdvpuqhsmvjnmoqishd^ùàvhqsovnpfùiej";

        // Placer ce token en cookie

        window.location.replace("/");
    }
    else{
        mailInput.classList.add("is-invalid");
        passwordInput.classList.add("is-invalid");
    }
}