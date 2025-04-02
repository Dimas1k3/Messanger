import { getUserProfileList } from "./user_list.js";

import { handleArrowClick, handleDeleteClick, handleEditClick } from "./message_controls.js";

const messageInput = document.getElementById("message-input");
const messagesContainer = document.getElementById("messages-container");
let currentOffset = parseInt(document.getElementById("current-offset").value, 10);
const searchInput = document.getElementById("searchInput")

const dataContainer = document.getElementById("data-container");
const messages = JSON.parse(dataContainer.dataset.messages); 
// console.log(messages);

window.PrivateChatStatus = false;

const messageControlPanel = document.getElementById("message-control")
let lastHoveredMessage = null;

function scrollToMessage(messageId) {
    let messages = document.querySelectorAll(".message");
    const messagesContainer = document.getElementById("messages-container")

    messages.forEach(msg => {
        let idElement = msg.querySelector(".message-id"); 
        if (idElement && idElement.textContent.trim() === messageId.toString()) {
            msg.scrollIntoView({ behavior: "smooth", block: "center" }); 
            msg.style.backgroundColor = '#e0e0e0';
        } else { 
            // скролл при динамической прогрузке
        }
    });
}

function getMessagesDiv() {
    const messageControlPanel = document.getElementById("message-control")
    
    const messageList = messagesContainer.querySelectorAll('.message'); 
    // console.log(messageList);

    messageList.forEach((message, index) => {
        // console.log(`Message ${index}:`, message.innerHTML);

        message.addEventListener('mouseenter', () => {
            // lastHoveredMessage = message;
            setLastHoveredMessage(message);

            message.style.backgroundColor = '#e0e0e0';
            messageControlPanel.style.display = 'block';

            const rect = message.getBoundingClientRect();
            const containerRect = messagesContainer.getBoundingClientRect();
            messageControlPanel.style.position = 'absolute';
        
            const maxRight = containerRect.right - messageControlPanel.offsetWidth - 40;
            messageControlPanel.style.top = `${rect.top + window.scrollY - 22}px`;
            messageControlPanel.style.left = `${maxRight + window.scrollX}px`;
        });

        message.addEventListener('mouseleave', () => {
            if (!message.matches(':hover') && !messageControlPanel.matches(':hover')) {
                messageControlPanel.style.display = 'none';
                message.style.backgroundColor = '#ffffff';
            }
        })

        messageControlPanel.addEventListener('mouseleave', () => {
            if (!message.matches(':hover') && !messageControlPanel.matches(':hover')) {
                messageControlPanel.style.display = 'none';
                message.style.backgroundColor = '#ffffff';
            }
        })
    });
}

function getLastHoveredMessage() {
    return lastHoveredMessage;
}

function setLastHoveredMessage(value) {
    lastHoveredMessage = value;
}

function getMessageId(element) {
    return element?.closest('.message')?.getAttribute('data-message-id') || null;
}

function createMessageElement(parsedMessage, messagesContainer, prepend) {
    const [id, nickname, text, timestamp, replyTo, repliedMessage, repliedMessageNickname, editedStatus] = parsedMessage;
    const trimmedTimestamp = timestamp.slice(0, -3);
    
    const newMessage = document.createElement("div");
    newMessage.className = "message";
    
    const messageHeader = document.createElement("div");
    messageHeader.className = "message-header";
    
    const nicknameElement = document.createElement("span");
    nicknameElement.className = "nickname";
    nicknameElement.textContent = nickname;
    
    const timeElement = document.createElement("span");
    timeElement.className = "time"; 
    timeElement.textContent = trimmedTimestamp;
    
    const fullTimeElement = document.createElement("div");
    fullTimeElement.className = "full-time";
    fullTimeElement.textContent = timestamp;
    fullTimeElement.style.display = "none"; 
    
    const messageText = document.createElement("div");
    messageText.className = "message-text";
    messageText.textContent = text;
    
    const messageIdElement = document.createElement("div");
    messageIdElement.className = "message-id";
    messageIdElement.textContent = id;
    messageIdElement.style.display = "none";

    if (editedStatus == 1) {
        const editedLabel = document.createElement("span");
        editedLabel.className = "edited-label";
        editedLabel.textContent = " (отредактировано)";
        editedLabel.style.color = "gray";
        editedLabel.style.fontSize = "12px";
        editedLabel.style.marginLeft = "5px";
        timeElement.appendChild(editedLabel);
 }
    
    if (repliedMessage) {
        const replyContainer = document.createElement("div");
        replyContainer.className = "reply-container";
        replyContainer.style.borderLeft = "3px solid gray";
        replyContainer.style.padding = "5px 10px";
        replyContainer.style.marginBottom = "5px";
        replyContainer.style.background = "#f0f0f0";
        replyContainer.style.borderRadius = "5px";
        replyContainer.style.fontSize = "13px";
        replyContainer.style.color = "#555";
        replyContainer.style.fontStyle = "italic";
    
        const replyText = document.createElement("div");
        replyText.className = "reply-text";
        replyText.textContent = `↳ "${repliedMessage}"` + ' от ' + repliedMessageNickname; 
    
        replyContainer.appendChild(replyText);
        newMessage.appendChild(replyContainer);
    }
    
    newMessage.appendChild(messageHeader);
    messageHeader.appendChild(nicknameElement);
    messageHeader.appendChild(timeElement);
    newMessage.appendChild(fullTimeElement); 
    newMessage.appendChild(messageText);
    newMessage.appendChild(messageIdElement); 
    
    if (!prepend) {
        messagesContainer.prepend(newMessage);
    } else {
        messagesContainer.appendChild(newMessage);
    }
};

function renderMessages(messages) {
    console.info("renderMessages")
    const messagesContainer = document.getElementById("messages-container");
    
    messages.forEach(message => {
        let parsedMessage;
        let prepend = false;
        const PrivateChatStatus = message.at(-1);
    
        if (PrivateChatStatus) {
            const [id, nickname, partnerNickname, text, timestamp, replyTo, repliedMessage, repliedMessageNickname, editedStatus] = message;
            parsedMessage = [id, nickname, text, timestamp, replyTo, repliedMessage, repliedMessageNickname, editedStatus];
        } else {
            const [id, nickname, text, timestamp, replyTo, repliedMessage, repliedMessageNickname, editedStatus] = message;
            parsedMessage = [id, nickname, text, timestamp, replyTo, repliedMessage, repliedMessageNickname, editedStatus];
        }

        createMessageElement(parsedMessage, messagesContainer, prepend);
    });        

    currentOffset += 20
    document.getElementById("current-offset").value = currentOffset;
}

function openPrivateChat(currentUserId, chatPartnerId) {
    console.info("openPrivateChat")
    window.PrivateChatStatus = true;
    currentOffset = 0;
    document.getElementById("current-offset").value = currentOffset;
    
    const messageList = messagesContainer.querySelectorAll('.message'); 
    console.info(messageList);
    messageList.forEach(message => message.remove());

    messagesContainer.innerHTML = "";

    // console.log("Начинаем загрузку чата");
    // console.trace("Вызов openPrivateChat");

    fetch("/load-private-chat", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({currentUserId, chatPartnerId})
    })
    .then(response => response.json())
    .then(data => {
        localStorage.setItem("user_id", currentUserId);
        localStorage.setItem("partner_id", chatPartnerId);

        console.info(data);
        const messagesContainer = document.getElementById("messages-container");

        data.messages.forEach(msg => {
            let parsedMessage;
            let prepend = false;
            
            const messageId = msg[0];
            const senderNickname = msg[1];
            const receiverNickname = msg[2];
            const messageTextContent = msg[3];
            const messageTime = msg[4];
            const replyTo = msg[5];
            const repliedMessage = msg[6];
            const repliedMessageNickname = msg[7];
            const editedStatus = msg[8];
            console.info(editedStatus)

            parsedMessage = [messageId, senderNickname, messageTextContent, messageTime, replyTo, repliedMessage, repliedMessageNickname, editedStatus];

            createMessageElement(parsedMessage, messagesContainer, prepend);
        });
    
        messageInput.value = "";
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        currentOffset += data.messages.length;
        document.getElementById("current-offset").value = currentOffset;

        const messageControlPanel = document.createElement("div");
        messageControlPanel.id = "message-control";
        messageControlPanel.style.display = "none";

        messageControlPanel.innerHTML = `
            <!-- Стрелочка -->
            <svg id="arrow-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M5.854 4.146a.5.5 0 0 1 0 .708L3.707 7H14.5a.5.5 0 0 1 0 1H3.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 0 1 .708 0z"/>
            </svg>

            <!-- Карандаш -->
            <svg id="pencil-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M15.502 1.94a.5.5 0 0 1 0 .706l-13.5 13.5a.5.5 0 0 1-.168.11l-4 1a.5.5 0 0 1-.65-.65l1-4a.5.5 0 0 1 .11-.168l13.5-13.5a.5.5 0 0 1 .706 0zM13.085 3 4 12.085V13h.915L14 3.915 13.085 3z"/>
            </svg>

            <!-- Мусорка -->
            <svg id="bin-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M5.5 5.5A.5.5 0 0 1 6 5h4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5v-7zm1 .5v6h1v-6H6zm3 0v6h1v-6H9z"/>
                <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9.5a2.5 2.5 0 0 1-2.5 2.5h-5A2.5 2.5 0 0 1 3 13.5V4H2.5a1 1 0 1 1 0-2H5.707l1-1h3.586l1 1H13a1 1 0 0 1 1 1zM3 4v9.5a1.5 1.5 0 0 0 1.5 1.5h5a1.5 1.5 0 0 0 1.5-1.5V4H3z"/>
            </svg>
        `;

        messagesContainer.appendChild(messageControlPanel);

        wait(300).then(() => {
            getMessagesDiv(); 
        });

        handleArrowClick(chatPartnerId, null);

        handleEditClick(chatPartnerId);
        
        handleDeleteClick();
    });
}

function spawnMessage(data) {
    const messagesContainer = document.getElementById("messages-container");

    const newMessage = document.createElement("div");
    newMessage.className = "message";

    const messageHeader = document.createElement("div");
    messageHeader.className = "message-header";

    const nicknameElement = document.createElement("span");
    nicknameElement.className = "nickname";
    nicknameElement.textContent = data.nickname;

    const timeElement = document.createElement("span");
    timeElement.className = "time"; 
    timeElement.textContent = data.time;

    const fullTimeElement = document.createElement("div");
    fullTimeElement.className = "full-time";
    console.info(data.fullTime);
    fullTimeElement.textContent = data.fullTime; 
    fullTimeElement.style.display = "none"; 

    const messageText = document.createElement("div");
    messageText.className = "message-text";
    messageText.textContent = data.message;

    const messageIdElement = document.createElement("div");
    messageIdElement.className = "message-id";
    messageIdElement.textContent = data.messageId;
    messageIdElement.style.display = "none";

    newMessage.appendChild(messageHeader);
    messageHeader.appendChild(nicknameElement);
    messageHeader.appendChild(timeElement);
    newMessage.appendChild(fullTimeElement);
    newMessage.appendChild(messageText);
    newMessage.appendChild(messageIdElement); 

    messagesContainer.appendChild(newMessage);

    messageInput.value = "";
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function processMessage(message) {
    let parsedMessage;
    let prepend = false;
    const PrivateChatStatus = message.at(-1);

    if (PrivateChatStatus) {
        const [id, nickname, partnerNickname, text, timestamp, replyTo, repliedMessage, repliedMessageNickname, editedStatus] = message;
        parsedMessage = [id, nickname, text, timestamp, replyTo, repliedMessage, repliedMessageNickname, editedStatus];
    } else {
        const [id, nickname, text, timestamp, replyTo, repliedMessage, repliedMessageNickname, editedStatus] = message;
        parsedMessage = [id, nickname, text, timestamp, replyTo, repliedMessage, repliedMessageNickname, editedStatus];
    }

    createMessageElement(parsedMessage, messagesContainer, prepend);
}

let isLoading = false;

function loadMoreMessages(PrivateChatStatus, userId, partnerId) {

    const url = "/load-messages?offset=" + currentOffset +
            "&privateChat=" + PrivateChatStatus +
            "&userId=" + userId +
            "&partnerId=" + partnerId;
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Ошибка загрузки: ${response.status}`);
            }
            return response.json(); 
        })
        .then(messages => {
            if (messages.length === 0) {
                return;
            }
           
            const messagesContainer = document.getElementById("messages-container");

            const currentScrollHeight = messagesContainer.scrollHeight;
            const currentScrollTop = messagesContainer.scrollTop;
            
            if (PrivateChatStatus) {
                messages.forEach(message => {
                    processMessage(message);
                });
            } else {
                messages.forEach(message => {
                    processMessage(message);
                });
            }        

            currentOffset += messages.length;
            document.getElementById("current-offset").value = currentOffset;
            
            const newScrollHeight = messagesContainer.scrollHeight;
            messagesContainer.scrollTop = currentScrollTop + (newScrollHeight - currentScrollHeight);

            console.log(`Текущий offset: ${currentOffset}`);
        })
        .catch(error => {
            console.error("Ошибка при загрузке сообщений:", error);
        })
        .finally(() => {
            isLoading = false; 
        });
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function sendMessage() {
    const user_message = messageInput.value.trim();
    const token = localStorage.getItem("session_token");

    if (!user_message) {
        return;
    }

    let fetchUrl = "/user_message";
    let fetchBody = { message: user_message };

    if (PrivateChatStatus === true) {
        const chatPartnerId = localStorage.getItem("partner_id");
        console.info(chatPartnerId)
        fetchUrl = "/private_user_message";
        fetchBody = { message: user_message, chatPartnerId: chatPartnerId};
    }

    fetch(fetchUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": token
        },
        body: JSON.stringify(fetchBody),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Ошибка при отправке сообщения");
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            spawnMessage(data);
        }
    })
    .catch(error => {
        console.error("Ошибка:", error);
    });
}

document.addEventListener("DOMContentLoaded", function () {
    if (window.PrivateChatStatus === false) {
        renderMessages(messages);
    };

    getUserProfileList();

    wait(300).then(() => {
        getMessagesDiv(); 
    });

    messageInput.value = "";

    setLastHoveredMessage(null);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    messagesContainer.addEventListener("scroll", function () {
        if (messageControlPanel.style.display === 'block') {
            messageControlPanel.style.display = 'none';
        }

        if (messagesContainer.childElementCount === 0) {
            return;
        }
    
        if (messagesContainer.scrollTop === 0 && isLoading === false) { 
            const userId = localStorage.getItem("user_id");
            const chatPartnerId = localStorage.getItem("partner_id");
            
            loadMoreMessages(PrivateChatStatus, userId, chatPartnerId);
            
            let lastHoveredMessage = null;
            wait(300).then(getMessagesDiv);
        }
    });

    document.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.ctrlKey || e.key === "Escape") {
            return;
        }

        if (document.activeElement === searchInput) {
            return;
        }
        
        if (document.activeElement !== messageInput) {
            messageInput.focus();
        }
    });

    // send_button.addEventListener("click", function (e) {
    //     e.preventDefault();
    //     const editContainer = document.getElementById("edit-container")

    //     if (editContainer.style.display === "none") {
    //         sendMessage();
    //         let lastHoveredMessage = null;
    //         wait(300).then(() => {
    //             getMessagesDiv(); 
    //         });
    //     }
    // });
    
    messageInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            if (e.shiftKey) {
                e.preventDefault(); 
                let cursorPos = messageInput.selectionStart;
                let textBefore = messageInput.value.substring(0, cursorPos);
                let textAfter = messageInput.value.substring(cursorPos);
                
                messageInput.value = textBefore + "\n" + textAfter;
                messageInput.selectionStart = messageInput.selectionEnd = cursorPos + 1; 
                return;
            }
    
            e.preventDefault();
            const editContainer = document.getElementById("edit-container");
            const answerContainer = document.getElementById("answer-container");

            if (
                editContainer.style.display === "none" &&
                answerContainer.style.display === "none" &&
                document.activeElement !== searchInput 
            ) {
                sendMessage();
                messageInput.blur();
                wait(300).then(() => {
                    getMessagesDiv();
                });
            }
        }
    });
    
    searchInput.addEventListener("keydown", function(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            let messageToFind = searchInput.value.trim(); 
            searchInput.value = "";
    
            const token = localStorage.getItem("session_token");
            const chatHeader = document.getElementById("chat-header")
    
            fetch('/find-message-global-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, messageToFind }),
            })
            .then(response => {
                if (!response.ok) { 
                    return response.json().then(err => { throw new Error(err.message); });
                }
                return response.json();
            })
            .then(data => {
                console.info("Сообщение найдено:", data.message_id);
                scrollToMessage(data.message_id)
                const errorMessage = document.querySelector("#chat-header span");
                errorMessage.remove();
            })            
            .catch(error => {
                const errorMessage = document.querySelector("#chat-header span");
                
                if (error.message === "Ничего не найдено" && !errorMessage) {
                    console.info("Сообщение не найдено");
                    const errorMessage = document.createElement("span");
                    errorMessage.textContent = "Ничего не найдено";
                    errorMessage.style.color = "red";
                    errorMessage.style.marginLeft = "620px";
                    chatHeader.insertBefore(errorMessage, searchInput);
                }
            });
        }   
    
        if (e.key === "Escape") {
            searchInput.blur();
            searchInput.value = "";
            const errorMessage = document.querySelector("#chat-header span");
            errorMessage.remove();
        }
    });
});

export {
    wait,
    getMessagesDiv,
    scrollToMessage,
    renderMessages,
    spawnMessage,
    loadMoreMessages,
    openPrivateChat,
    getLastHoveredMessage,
    setLastHoveredMessage,
    createMessageElement,
};