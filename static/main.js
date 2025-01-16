document.addEventListener("DOMContentLoaded", function () {
    const loginBtn = document.getElementById("loginBtn");

    function handleLogin(e) {
        if (e) e.preventDefault();

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();

        const usernameGroup = document.querySelector('label[for="username"]');
        const passwordGroup = document.querySelector('label[for="password"]');

        clearError(usernameGroup);
        clearError(passwordGroup);

        fetch("/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(data => {
                        throw new Error(data.message || "Ошибка авторизации");
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    window.location.replace("/main");
                }
            })
            .catch(error => {
                if (error.message === "Введите ваш логин") {
                    showError(usernameGroup, error.message || "Произошла ошибка.");
                }
                if (error.message === "Введите ваш пароль") {
                    showError(passwordGroup, error.message || "Произошла ошибка.");
                }
                if (error.message === "Неверный логин") {
                    showError(usernameGroup, error.message || "Произошла ошибка.");
                }
                if (error.message === "Неверный пароль") {
                    showError(passwordGroup, error.message || "Произошла ошибка.");
                }
            });
    }

    function showError(group, message) {
        const errorElement = document.createElement("span");
        errorElement.className = "error-message";
        errorElement.textContent = ` - ${message}`;
        group.appendChild(errorElement);
    }

    function clearError(group) {
        const errorElement = group.querySelector(".error-message");
        if (errorElement) {
            errorElement.remove();
        }
    }

    loginBtn.addEventListener("click", function (e) {
        handleLogin(e);
    });

    document.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            handleLogin(e);
        }
    });
});
