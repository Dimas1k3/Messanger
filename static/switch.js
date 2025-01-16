document.addEventListener("DOMContentLoaded", function () {
    const mainPage = document.getElementById("mainPage");
    const registerPage = document.getElementById("registerPage");
    const emailPage = document.getElementById("emailPage")
    const registerBtn = document.getElementById("registerBtn");
    const loginLinkBtn = document.getElementById("loginLinkBtn");
    const ForgotPassBtn = document.getElementById("ForgotPassBtn");
    const backToLogin = document.getElementById("backToLoginBtn")

    registerBtn.addEventListener("click", function () {
        mainPage.classList.add("hidden");
        registerPage.classList.remove("hidden");
    });

    loginLinkBtn.addEventListener("click", function () {
        registerPage.classList.add("hidden");
        mainPage.classList.remove("hidden");
    });
    ForgotPassBtn.addEventListener("click", function () {
        mainPage.classList.add("hidden");
        emailPage.classList.remove("hidden")
    });
    backToLogin.addEventListener("click", function () {
        emailPage.classList.add("hidden")
        mainPage.classList.remove("hidden")
    });
});