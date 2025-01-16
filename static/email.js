document.addEventListener("DOMContentLoaded", function () {
    const sendCodeBtn = document.getElementById("sendCodeBtn");
    const verifyCodeBtn = document.getElementById("verifyCodeBtn");

    sendCodeBtn.addEventListener("click", function (e) {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const emailGroup = document.querySelector('label[for="email"]');

        clearError(emailGroup);

        fetch("/sendCode", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
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
                console.log(data);
            })
            .catch(error => {
                if (error.message) {
                    const errorMessage = error.message;
                    if (errorMessage === "Введите вашу почту") {
                        showError(emailGroup, errorMessage);
                    } else if (errorMessage === "Такой почты не существует") {
                        showError(emailGroup, errorMessage);
                    }
                }
        });
    });

    verifyCodeBtn.addEventListener("click", function (e) {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const verificationCode = document.getElementById("verificationCode").value.trim();

        const emailGroup = document.querySelector('label[for="email"]');
        const verificationCodeGroup = document.querySelector('label[for="verificationCode"]');
        const codeEmailContainer = document.getElementById("code-email-container")
        const passwordContainer = document.getElementById("password-container")

        const sendVerifyCodeBtns = document.getElementById("send-verify-codeBtns")
        const sendVerifyPassBtn = document.getElementById("send-verify-passwordBtn")
        const confirmNewPassBtn = document.getElementById("confirmPassBtn")

        clearError(emailGroup);
        clearError(verificationCodeGroup);

        fetch("/resetPass", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, verificationCode }),
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
                console.log(data);
                if (data.success) {
                    codeEmailContainer.style.display = 'none';
                    passwordContainer.style.display = 'block';
                    sendVerifyCodeBtns.style.display = 'none';
                    sendVerifyPassBtn.style.display = 'block';
                    
                    confirmNewPassBtn.addEventListener("click", function (e) {
                        e.preventDefault();

                        const newPassGroup = document.querySelector('label[for="newPassword"]');
                        const conNewPassGroup = document.querySelector('label[for="confirmNewPassword"]');

                        const newPass = document.getElementById("newPassword").value.trim();
                        const confirmNewPass = document.getElementById("confirmNewPassword").value.trim();

                        clearError(newPassGroup);
                        clearError(conNewPassGroup);
                        
                        console.info(newPass)
                        console.info(confirmNewPass)
                        confirmNewPassword(email, newPass, confirmNewPass, newPassGroup, conNewPassGroup);
                    });
                }
            })
            .catch(error => {
                if (error.message) {
                    const errorMessage = error.message;
                    if (errorMessage === "Введите вашу почту") {
                        showError(emailGroup, errorMessage);
                    } else if (errorMessage === "Введите ваш код") {
                        showError(verificationCodeGroup, errorMessage);
                    } else if (errorMessage === "Такой почты не существует") {
                        showError(emailGroup, errorMessage);
                    } else if (errorMessage === "Неверный код") {
                        showError(verificationCodeGroup, errorMessage);
                    } else if (errorMessage === "Время кода истекло") {
                        showError(verificationCodeGroup, errorMessage)
                    }
                }
            });
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

    function confirmNewPassword(email, newPass, confirmNewPass, newPassGroup, conNewPassGroup) {
        fetch('/confirmNewPass', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, newPass, confirmNewPass})
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(data => {
                        throw data;
                    });
                }
                return response.json();
            })
            .then(confirmData => {
                console.log(confirmData);
                if (confirmData.success) {
                    window.location.replace("/main");
                }
            })
            .catch(error => {
                if (error.message && !Array.isArray(error.message)) {
                    const errorMessage = error.message; 
                    console.log(errorMessage);
                    console.info(newPassGroup)
                    if (errorMessage === "Введите пароль") {
                        showError(newPassGroup, errorMessage || "Произошла ошибка.");
                    } else if (errorMessage === "Подтвердите пароль") {
                        showError(conNewPassGroup, errorMessage || "Произошла ошибка.");
                    } else if (errorMessage === "Пароли не совпадают") {
                        showError(conNewPassGroup, errorMessage || "Произошла ошибка.");
                    } 
                } else if (Array.isArray(error.message)) {
                    const [field, message] = error.message;
                    console.log(`Поле: ${field}, Сообщение: ${message}`);
                    if (field === "passwordGroup") {
                        showError(newPassGroup, message);
                    }
                }           
            });
        }
});
