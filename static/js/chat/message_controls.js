import { getLastHoveredMessage } from "./chat.js";

function handleArrowClick(chatPartnerId) {
    const arrowIcon = document.getElementById("arrow-icon");

    arrowIcon.addEventListener("click", function (e)  {
        e.preventDefault();
        let message = getLastHoveredMessage();

        const messageInput = document.getElementById("message-input");
        messageInput.value = "";

        const editContainer = document.getElementById("edit-container");
        editContainer.style.display = 'none';

        if (answerContainer.style.display === 'none' || lastMessage !== message) {
            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = message;

            const username = tempContainer.querySelector('.nickname').innerText;
            const messageText = tempContainer.querySelector('.message-text').innerText;

            answerContainer.innerText = `Вы отвечаете на '${messageText}' от ${username} • esc для отмены`;
            answerContainer.style.display = 'block';

            lastMessage = message;
            console.info("Выбранное сообщение изменилось:", message);

            document.addEventListener("keydown", function(event) {
                handleReply(event, chatPartnerId);
            });
        } else {
            answerContainer.style.display = 'none';
            answerContainer.innerText = "Вы отвечаете на";
            lastMessage = null;
        }
    });
}

function handleReply(event, chatPartnerId) { 
    let message = getLastHoveredMessage();

    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = message; 
    const repliedMessage = tempContainer.querySelector('.message-text')?.innerText.trim();
    const repliedMessageNickname = tempContainer.querySelector('.nickname')?.innerText.trim();
    const messageId = tempContainer.querySelector('.message-id')?.innerText.trim();

    const messageInput = document.getElementById("message-input")
    const answerContainer = document.getElementById("answer-container")

    if (event && event.key === "Escape") {
        messageInput.value = "";
        messageInput.blur();
        answerContainer.style.display = 'none';
        return;
    }

    if (event && event.key === "Enter" && answerContainer.style.display === 'block') {
        const answerMessage = messageInput.value.trim();
        const token = localStorage.getItem("session_token");

        if (window.PrivateChatStatus === true) {
            ChatStatus = "private_messages";
        } else {
            ChatStatus = "global_chat";
        }

        fetch('/reply-message-chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token, answerMessage, repliedMessage, repliedMessageNickname, messageId, ChatStatus, chatPartnerId}),
        })
        .then(response => response.json()) 
        .then(data => {
            // const { nickname, answerMessage, time, repliedMessage, fullTime } = data;
        
            // const messagesContainer = document.getElementById("messages-container");
        
            // const newMessage = document.createElement("div");
            // newMessage.className = "message";
        
            // const messageHeader = document.createElement("div");
            // messageHeader.className = "message-header";
        
            // const nicknameElement = document.createElement("span");
            // nicknameElement.className = "nickname";
            // nicknameElement.textContent = nickname;
        
            // const timeElement = document.createElement("span");
            // timeElement.className = "time";
            // timeElement.textContent = time;
        
            // const fullTimeElement = document.createElement("div");
            // fullTimeElement.className = "full-time";
            // fullTimeElement.textContent = fullTime;
            // fullTimeElement.style.display = "none";
        
            // const messageTextElement = document.createElement("div");
            // messageTextElement.className = "message-text";
        
            // if (repliedMessage) {
            //     const replyContainer = document.createElement("div");
            //     replyContainer.className = "reply-container";
            //     replyContainer.style.borderLeft = "3px solid gray";
            //     replyContainer.style.padding = "5px 10px";
            //     replyContainer.style.marginBottom = "5px";
            //     replyContainer.style.background = "#2f3136";
            //     replyContainer.style.borderRadius = "5px";
            //     replyContainer.style.color = "#b9bbbe";
            //     replyContainer.style.fontSize = "13px";
            //     replyContainer.style.fontStyle = "italic";
            //     replyContainer.style.display = "flex";
            //     replyContainer.style.alignItems = "center";
        
            //     const replyArrow = document.createElement("span");
            //     replyArrow.textContent = "↳ ";
            //     replyArrow.style.color = "#b9bbbe";
            //     replyArrow.style.marginRight = "5px";
        
            //     const replyText = document.createElement("span");
            //     replyText.textContent = repliedMessage;
        
            //     replyContainer.appendChild(replyArrow);
            //     replyContainer.appendChild(replyText);
            //     newMessage.appendChild(replyContainer);
            // }
        
            // const messageContent = document.createElement("span");
            // messageContent.textContent = answerMessage;
            // messageTextElement.appendChild(messageContent);
        
            // newMessage.appendChild(messageHeader);
            // messageHeader.appendChild(nicknameElement);
            // messageHeader.appendChild(timeElement);
            // newMessage.appendChild(fullTimeElement);
            // newMessage.appendChild(messageTextElement);
        
            // messagesContainer.prepend(newMessage);
            location.reload();

        })            
        .catch((error) => {
            console.error('Error during fetch:', error);
        });
    } 
}

function handleEditClick() {
    const pencilIcon = document.getElementById("pencil-icon");

    pencilIcon.addEventListener("click", function (e) {
        e.preventDefault();

        const token = localStorage.getItem("session_token");
        const message = getLastHoveredMessage();

        editingMessage = message;

        const tempContainer = document.createElement("div");
        tempContainer.innerHTML = editingMessage;
        const messageText = tempContainer.querySelector(".message-text")?.innerText.trim();
        const nickname = tempContainer.querySelector(".nickname").innerText;
        const time = tempContainer.querySelector(".full-time").innerText;

        const messageInput = document.getElementById("message-input");
        const editContainer = document.getElementById("edit-container");

        if (answerContainer.style.display === "block") {
            answerContainer.style.display = "none";
        }

        if (editContainer.style.display === "block") {
            editContainer.style.display = "none";
        }

        if (token) {
            fetch("/verify-edit-message-global-chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token, messageText, time }),
            })
                .then((response) => {
                    if (response.ok) {
                        messageInput.value = messageText;
                        messageInput.focus();
                        editContainer.style.display = "block";
                        editContainer.innerText =
                            "Вы редактируете сообщение • esc для отмены • enter чтобы сохранить";

                        document.removeEventListener("keydown", handleNewMessage);
                        document.addEventListener("keydown", handleNewMessage);
                    }
                })
                .catch((error) => {
                    console.error("Error during fetch:", error);
                });
        }
    });
}

function handleNewMessage(event) {
    const tempContainer = document.createElement("div");
    tempContainer.innerHTML = editingMessage;

    const nickname = tempContainer.querySelector(".nickname").innerText;
    const oldMessage = tempContainer.querySelector(".message-text").innerText;
    const messageId = tempContainer.querySelector(".message-id").innerText;

    const messageInput = document.getElementById("message-input");
    const editContainer = document.getElementById("edit-container");

    if (event.key === "Escape") {
        messageInput.value = "";
        messageInput.blur();
        editContainer.style.display = "none";
        return;
    }

    if (event.key === "Enter" && editContainer.style.display === "block") {
        const newMessage = messageInput.value.trim();

        fetch("/edit-message-global-chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ nickname, oldMessage, newMessage, messageId }),
        })
            .then((response) => {
                if (response.ok) {
                    if (lastHoveredMessage) {
                        lastHoveredMessage.querySelector(".message-text").textContent = newMessage;
                    }

                    if (lastHoveredMessage) {
                        const rect = lastHoveredMessage.getBoundingClientRect();
                        const containerRect = messagesContainer.getBoundingClientRect();
                        const maxRight = containerRect.right - messageControlPanel.offsetWidth - 40;

                        messageControlPanel.style.top = `${rect.top + window.scrollY - 10}px`;
                        messageControlPanel.style.left = `${maxRight + window.scrollX}px`;
                    }

                    const messageHeader = lastHoveredMessage.querySelector(".time");

                    const editedLabel = document.createElement("span");
                    editedLabel.className = "edited-label";
                    editedLabel.textContent = " (отредактировано)";
                    editedLabel.style.color = "gray";
                    editedLabel.style.fontSize = "12px";
                    editedLabel.style.marginLeft = "5px";
                    messageHeader.appendChild(editedLabel);

                    editContainer.style.display = "none";
                    messageInput.value = "";
                    messageInput.blur();
                    editingMessage = null;
                } else {
                    console.error("Failed to edit message");
                }
            })
            .catch((error) => {
                console.error("Error during fetch:", error);
            });
    }
}

function handleDeleteClick() {
    const binIcon = document.getElementById("bin-icon");

    binIcon.addEventListener("click", function (e) {
        e.preventDefault();

        let message = getLastHoveredMessage();
        const tempContainer = document.createElement("div");
        tempContainer.innerHTML = message;

        const nickname = tempContainer.querySelector(".nickname").innerText.trim();
        const text = tempContainer.querySelector(".message-text").innerText.trim();
        const messageId = tempContainer.querySelector(".message-id").innerText.trim();

        const messageInput = document.getElementById("message-input");
        const answerContainer = document.getElementById("answer-container");
        const editContainer = document.getElementById("edit-container");

        const token = localStorage.getItem("session_token");

        if (editContainer.style.display === "block") {
            editContainer.style.display = "none";
            messageInput.value = "";
        }

        if (answerContainer.style.display === "block") {
            answerContainer.style.display = "none";
            messageInput.value = "";
        }

        if (message) {
            fetch("/delete-message-global-chat", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ nickname, token, text, messageId }),
            })
                .then((response) => {
                    if (response.ok) {
                        console.info("Message deleted successfully");

                        const messageElement = lastHoveredMessage;
                        if (messageElement) {
                            messageElement.remove();
                        }

                        const nextMessage = document.querySelector(".message");
                        if (nextMessage) {
                            lastHoveredMessage = nextMessage;

                            const rect = nextMessage.getBoundingClientRect();
                            const containerRect = messagesContainer.getBoundingClientRect();
                            const maxRight = containerRect.right - messageControlPanel.offsetWidth - 40;

                            messageControlPanel.style.top = `${rect.top + window.scrollY - 10}px`;
                            messageControlPanel.style.left = `${maxRight + window.scrollX}px`;
                        } else {
                            lastHoveredMessage = null;
                            messageControlPanel.style.display = "none";
                        }
                    } else {
                        console.error("Failed to delete message");
                    }
                })
                .catch((error) => {
                    console.error("Error during fetch:", error);
                });
        }
    });
}

document.addEventListener("DOMContentLoaded", function () {
    const answerContainer = document.getElementById("answer-container")
    let lastMessage = null;
    let editingMessage = null;

    handleArrowClick();    

    handleEditClick();

    handleDeleteClick();
});

export {
    handleArrowClick,
    handleReply,
    handleEditClick,
    handleNewMessage,
    handleDeleteClick
};