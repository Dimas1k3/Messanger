document.addEventListener("DOMContentLoaded", function () {
    const regBtn = document.getElementById("registerSubmitBtn");

    function handleRegistration(e) {
        if (e) e.preventDefault();

        const email = document.getElementById("e-mail").value.trim();
        const username = document.getElementById("regusername").value.trim();
        const password = document.getElementById("regpassword").value.trim();
        const confirmPassword = document.getElementById('confirmpassword').value.trim();
        const message = document.getElementById('passwordMatchMessage');

        const emailGroup = document.querySelector('label[for="e-mail"]');
        const usernameGroup = document.querySelector('label[for="regusername"]');
        const passwordGroup = document.querySelector('label[for="regpassword"]');
        const confirmPasswordGroup = document.querySelector('label[for="confirmpassword"]');

        clearError(emailGroup);
        clearError(usernameGroup);
        clearError(passwordGroup);
        clearError(confirmPasswordGroup);

        fetch("/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, username, password, confirmPassword }),
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(data => {
                        throw data;
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log(data)
                if (data.success) {
                    window.location.replace("/main");
                }
            })
            .catch(error => {
                if (error.message && !Array.isArray(error.message)) {
                    const errorMessage = error.message; 
                    console.log(errorMessage);
                    if (errorMessage === "Введите вашу почту") {
                        showError(emailGroup, errorMessage || "Произошла ошибка.");
                    } else if (errorMessage === "Введите ваш логин") {
                        showError(usernameGroup, errorMessage || "Произошла ошибка.");
                    } else if (errorMessage === "Введите ваш пароль") {
                        showError(passwordGroup, errorMessage || "Произошла ошибка.");
                    } else if (errorMessage === "Подтвердите ваш пароль") {
                        showError(confirmPasswordGroup, errorMessage || "Произошла ошибка.");
                    } else if (errorMessage === "Пароли не совпадают") {
                        showError(confirmPasswordGroup, errorMessage || "Произошла ошибка.");
                    }
                } else if (Array.isArray(error.message)) {
                    const [field, message] = error.message;
                    console.log(`Поле: ${field}, Сообщение: ${message}`);
                    if (field === "emailGroup") {
                        showError(emailGroup, message);
                    } else if (field === "usernameGroup") {
                        showError(usernameGroup, message);
                    } else if (field === "passwordGroup") {
                        showError(passwordGroup, message);
                    } 
                }           
            });
    }

    regBtn.addEventListener("click", function (e) {
        handleRegistration(e);
    });

    document.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            handleRegistration(e);
        }
    });

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
});
