import {
    getLastHoveredMessage,
    setLastHoveredMessage,
    createMessageElement,
    getMessagesDiv,
    wait
  } from "./chat.js";  

let lastRepliedMessage = null;
let editingMessage = null;
const answerContainer = document.getElementById("answer-container")
const messagesContainer = document.getElementById("messages-container");
const messageControlPanel = document.getElementById("message-control")

function handleArrowClick(chatPartnerId, lastRepliedMessage) {
    const arrowIcon = document.getElementById("arrow-icon");
    const answerContainer = document.getElementById("answer-container");

    arrowIcon.addEventListener("click", function (e)  {
        e.preventDefault();
        let message = getLastHoveredMessage();

        const messageInput = document.getElementById("message-input");
        messageInput.value = "";

        const editContainer = document.getElementById("edit-container");
        editContainer.style.display = 'none';

        if (answerContainer.style.display === 'none' || lastRepliedMessage !== message) {
            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = message.innerHTML;

            const username = tempContainer.querySelector('.nickname').innerText;
            const messageText = tempContainer.querySelector('.message-text').innerText;

            answerContainer.innerText = `Вы отвечаете на '${messageText}' от ${username} • esc для отмены`;
            answerContainer.style.display = 'block';

            // console.log(typeof lastHoveredMessage);
            // console.log(typeof message);

            setLastHoveredMessage(message);
            console.info("Выбранное сообщение изменилось:", message);

            document.addEventListener("keydown", function(event) {
                handleReply(event, chatPartnerId);
            });

            lastRepliedMessage = message
        }
        else {    
            answerContainer.style.display = 'none';
            answerContainer.innerText = "Вы отвечаете на";
            setLastHoveredMessage(message);
        }
    });
}

function handleReply(event, chatPartnerId) { 
    let message = getLastHoveredMessage();

    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = message.innerHTML;
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
        let ChatStatus;

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
            console.info(data);
            
            let prepend = true;
            const editedStatus = 0;
            const parsedMessage = [
                data.messageId,
                data.nickname,
                data.text,
                data.time,    
                data.replyTo,  
                data.repliedMessage,    
                data.replyTo,
                editedStatus
              ];

            createMessageElement(parsedMessage, messagesContainer, prepend);

            messageInput.value = "";
              
            setLastHoveredMessage(null);
              
            messagesContainer.scrollTop = messagesContainer.scrollHeight;

            messageInput.blur();

            answerContainer.style.display = "none"

            wait(300).then(() => {
                getMessagesDiv(); 
            });
        })            
        .catch((error) => {
            console.error('Error during fetch:', error);
        });
    } 
}

function handleEditClick(chatPartnerId) {
    const pencilIcon = document.getElementById("pencil-icon");

    pencilIcon.addEventListener("click", function (e) {
        e.preventDefault();

        const token = localStorage.getItem("session_token");
        const message = getLastHoveredMessage();

        editingMessage = message;

        const tempContainer = document.createElement("div");
        tempContainer.innerHTML = editingMessage.innerHTML;
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

        let ChatStatus;

        if (window.PrivateChatStatus === true) {
            ChatStatus = "private_messages";
        } else {
            ChatStatus = "global_chat";
        }

        if (token) {
            fetch("/verify-edit-message-global-chat", {
                method: "POST", 
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token, messageText, time, ChatStatus, chatPartnerId }),
            })
                .then((response) => {
                    if (response.status === 400) {
                        messageInput.value = "";
                        return;
                    }
                    
                    if (response.ok) {
                        messageInput.value = messageText;
                        messageInput.focus();
                        editContainer.style.display = "block";
                        editContainer.innerText =
                            "Вы редактируете сообщение • esc для отмены • enter чтобы сохранить";

                        const handler = handleNewMessage.bind(null, ChatStatus, chatPartnerId);
                        document.removeEventListener("keydown", handler);
                        document.addEventListener("keydown", handler);
                    }
                })
                .catch((error) => {
                    console.error("Error during fetch:", error);
                });
        }
    });
}

function handleNewMessage(ChatStatus, chatPartnerId, event) {
    const tempContainer = document.createElement("div");
    tempContainer.innerHTML = editingMessage.innerHTML;

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
            body: JSON.stringify({ nickname, oldMessage, newMessage, messageId, ChatStatus, chatPartnerId }),
        })
            .then((response) => {
                if (response.ok) {
                    let lastHoveredMessage = getLastHoveredMessage();
                    
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
                    messageHeader.querySelectorAll(".edited-label").forEach(el => el.remove());

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
                    // editingMessage = null;
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
        tempContainer.innerHTML = message.innerHTML;

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

        let ChatStatus;

        if (window.PrivateChatStatus === true) {
            ChatStatus = "private_messages";
        } else {
            ChatStatus = "global_chat";
        }

        if (message) {
            fetch("/delete-message-global-chat", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ nickname, token, text, messageId, ChatStatus }),
            })
                .then((response) => {
                    if (response.ok) {
                        console.info("Message deleted successfully");
                        
                        let lastHoveredMessage = getLastHoveredMessage();
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
    handleArrowClick(null, lastRepliedMessage);    

    handleEditClick(null);

    handleDeleteClick();
});

export {
    handleArrowClick,
    handleReply,
    handleEditClick,
    handleNewMessage,
    handleDeleteClick
};