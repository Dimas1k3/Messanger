document.addEventListener("DOMContentLoaded", function () {
    const mainPage = document.getElementById("mainPage");
    const registerPage = document.getElementById("registerPage");
    const emailPage = document.getElementById("emailPage")
    const registerBtn = document.getElementById("registerBtn");
    const loginLinkBtn = document.getElementById("loginLinkBtn");
    const ForgotPassBtn = document.getElementById("ForgotPassBtn");
    const backToLogin = document.getElementById("backToLoginBtn")
    const username = document.getElementById("username")
    const regEMail = document.getElementById("e-mail")
    const emailContainer = document.getElementById("code-email-container")
    const passContainer = document.getElementById("password-container")
    const resetEMail = document.getElementById("email")
    const resetPass = document.getElementById("newPassword")

    registerBtn.addEventListener("click", function () {
        mainPage.classList.add("hidden");
        registerPage.classList.remove("hidden");
        regEMail.focus()
    });

    loginLinkBtn.addEventListener("click", function () {
        registerPage.classList.add("hidden");
        mainPage.classList.remove("hidden");
        username.focus()
    });

    ForgotPassBtn.addEventListener("click", function () {
        mainPage.classList.add("hidden");
        emailPage.classList.remove("hidden")
        
        if (emailContainer && window.getComputedStyle(emailContainer).display === "block") {
        resetEMail.focus() }
        
        if (passContainer && window.getComputedStyle(passContainer).display === "block") {
        resetPass.focus() }
    });

    backToLogin.addEventListener("click", function () {
        emailPage.classList.add("hidden")
        mainPage.classList.remove("hidden")
        username.focus()
    });
});