document.addEventListener("DOMContentLoaded", function () {
    const send_button = document.getElementById("send-button");
    const message_input = document.getElementById("message-input");

    function sendMessage() {
        const user_message = message_input.value.trim();

        if (!user_message) {
            return;
        }

        fetch("/user_message", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ message: user_message }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("Ошибка при отправке сообщения");
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                const messagesContainer = document.getElementById("messages-container");
                
                const newMessage = document.createElement("div");
                newMessage.className = "message";
                
                const messageHeader = document.createElement("div");
                messageHeader.className = "message-header";

                const nicknameElement = document.createElement("span");
                nicknameElement.className = "nickname";
                nicknameElement.textContent = "Dimas28";

                const timeElement = document.createElement("span");
                timeElement.className = "time"; 
                timeElement.textContent = data.time;

                const messageText = document.createElement("div");
                messageText.className = "message-text";
                messageText.textContent = user_message;
                
                newMessage.appendChild(messageHeader);
                messageHeader.appendChild(nicknameElement);
                messageHeader.appendChild(timeElement);
                newMessage.appendChild(messageText);

                messagesContainer.appendChild(newMessage);

                message_input.value = "";
            }
        })
        .catch(error => {
            console.error("Ошибка:", error);
        });
    }

    document.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            return;
        }
        
        if (document.activeElement !== message_input) {
            message_input.focus();
        }
    });

    send_button.addEventListener("click", function (e) {
        e.preventDefault();
        sendMessage();
    });

    message_input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            sendMessage();
            message_input.blur();
        }
    });
});
