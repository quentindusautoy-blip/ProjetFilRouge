alert("hello");

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("changePasswordForm");
    const submitBtn = form.querySelector('button[type="submit"]');
    const cancelBtn = form.querySelector('.btn-primary');

    submitBtn.addEventListener("click", (e) => {
        e.preventDefault(); // empêche le submit réel

        const newPassword = document.getElementById("NewPasswordInput").value;
        const repeatPassword = document.getElementById("RepeatPasswordInput").value;

        if (newPassword !== repeatPassword) {
            alert("Les mots de passe ne correspondent pas");
            return;
        }

        console.log("Mot de passe valide :", newPassword);

        // ici tu pourrais envoyer vers backend si besoin (fetch)
    });

    cancelBtn.addEventListener("click", () => {
        globalThis.location.href = "/account";
    });
});