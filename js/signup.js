
// Implementer le JS de ma page

const inputNom =document.getElementById("NomInput");
const inputPrenom =document.getElementById("PrenomInput");
const inputMail =document.getElementById("EmailInput");
const inputPassword =document.getElementById("PasswordInput");
const inputValidatePassword =document.getElementById("ValidatePasswordInput");

inputNom.addEventListener("keyup", validateForm);
inputPrenom.addEventListener("keyup", validateForm);
inputMail.addEventListener("keyup", validateForm);
inputPassword.addEventListener("keyup", validateForm);
inputValidatePassword.addEventListener("keyup", validateForm);


function validateForm(){
    validateRequired(inputNom);
    validateRequired(inputPrenom);
}

function validateRequired(input){
    if(input.value != '' ){
        // c'est ok
        input.classList.add("is-valid");
        input.classList.remove("is-invalid");
    }
    else{
        // c'est pas ok
        input.classList.remove("is-valid");
        input.classList.add("is-invalid");
    }
    }