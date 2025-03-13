import {
    handleArrowClick,
    handleReply,
    handleEditClick,
    handleNewMessage,
    handleDeleteClick
} from "./message_controls.js";

import { wait, getMessagesDiv } from "./chat.js";

function getUserProfileList() {
    const token = localStorage.getItem("session_token");

    fetch("/load-user-list", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({token: token})
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const currentUserId = data.userId;
            const onlineUsers = data.onlineUsers;
            const offlineUsers = data.offlineUsers;
            const allUserElements = [];
                
            const userListContainer = document.getElementById("userList-container")
            
            const offlineContainer = document.createElement("div");
            offlineContainer.id = "offline-users";
            let title = document.createElement("h3");
            title.textContent = "Оффлайн";
            offlineContainer.appendChild(title);

            function createUserCard(username, userId, container) {
                let userCard = document.createElement("div");
                userCard.classList.add("user-card");
                    
                let nameSpan = document.createElement("span");
                nameSpan.textContent = username;
                nameSpan.id = 'username';
                        
                let idSpan = document.createElement("span");
                idSpan.textContent = userId;
                idSpan.id = 'user-id';
                idSpan.style.display = "none"; 
                    
                userCard.appendChild(nameSpan);
                userCard.appendChild(idSpan);

                allUserElements.push(userCard);
                        
                container.appendChild(userCard);
            }

            onlineUsers.forEach(user => createUserCard(user[0], user[1], userListContainer));

            userListContainer.appendChild(offlineContainer);
                
            offlineUsers.forEach(user => createUserCard(user[0], user[1], userListContainer));
                
            let userProfile = document.getElementById("user-profile");

            let userNickname = document.createElement("span");
            userNickname.id = "user-nickname";

            let messageButton = document.createElement("button");
            messageButton.id = "send-message-btn";
            messageButton.textContent = "Написать в ЛС";

            if (!userProfile.querySelector("#user-nickname")) {
                userProfile.appendChild(userNickname);
            }

            allUserElements.forEach(userElement => {
                userElement.addEventListener("click", (event) => {
                    event.stopPropagation();

                    let usernameSpan = userElement.querySelector("#username");
                    let userId = userElement.querySelector("#user-id").textContent.trim();
                    let clickvalue = usernameSpan.textContent;
                    let currentNickname = userNickname.textContent; 

                    if (currentNickname === clickvalue && userProfile.style.display === 'block') {
                        userProfile.style.display = 'none';
                        return;
                    }

                    userNickname.textContent = clickvalue;
                    userProfile.style.display = 'block';
                    
                    // console.info(currentUserId)
                    // console.info(userId)
                    if (Number(userId) !== Number(currentUserId)) {
                        userProfile.appendChild(messageButton);

                        messageButton.removeEventListener("click", openPrivateChat);

                        messageButton.addEventListener("click", () => {
                            userProfile.style.display = 'none';
                            console.log("Клик по кнопке, вызываем openPrivateChat");
                            openPrivateChat(currentUserId, userId);
                        }, { once: true });
                    } else {
                        let existingButton = userProfile.querySelector("#send-message-btn");
                        if (existingButton) {
                            existingButton.remove();
                        }
                    }                        
                });
            });
        } else {
            console.error("Ошибка загрузки списка пользователей");
        }
    })
    .catch(error => console.error("Ошибка запроса:", error));
}

function openPrivateChat(currentUserId, chatPartnerId) {
    currentOffset = 0;
    window.PrivateChatStatus = true;
    
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
        localStorage.setItem("partner_id", chatPartnerId);

        console.info(data);
        const messagesContainer = document.getElementById("messages-container");

        data.messages.reverse().forEach(msg => {
            const messageId = msg[0];
            const senderNickname = msg[1];
            const receiverNickname = msg[2];
            const messageTextContent = msg[3];
            const messageTime = msg[4];
    
            const newMessage = document.createElement("div");
            newMessage.className = "message";
    
            const messageHeader = document.createElement("div");
            messageHeader.className = "message-header";
    
            const nicknameElement = document.createElement("span");
            nicknameElement.className = "nickname";
            nicknameElement.textContent = senderNickname;
    
            const timeElement = document.createElement("span");
            timeElement.className = "time"; 
            timeElement.textContent = messageTime;
    
            const fullTimeElement = document.createElement("div");
            fullTimeElement.className = "full-time";
            fullTimeElement.textContent = messageTime; 
            fullTimeElement.style.display = "none"; 
    
            const messageText = document.createElement("div");
            messageText.className = "message-text";
            messageText.textContent = messageTextContent;
    
            const messageIdElement = document.createElement("div");
            messageIdElement.className = "message-id";
            messageIdElement.textContent = messageId;
            messageIdElement.style.display = "none";
    
            newMessage.appendChild(messageHeader);
            messageHeader.appendChild(nicknameElement);
            messageHeader.appendChild(timeElement);
            newMessage.appendChild(fullTimeElement);
            newMessage.appendChild(messageText);
            newMessage.appendChild(messageIdElement); 
    
            messagesContainer.appendChild(newMessage);
        });
    
        messageInput.value = "";
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

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

        handleArrowClick(chatPartnerId);
    });
}

document.addEventListener("click", (event) => {
    const userProfile = document.getElementById("user-profile");
    const isUserCard = event.target.closest(".user-card"); 
    const isUserProfile = event.target.closest("#user-profile"); 

    if (!isUserCard && !isUserProfile && userProfile.style.display === 'block') { 
        userProfile.style.display = 'none'; 
    }
});

document.addEventListener("DOMContentLoaded", () => {
    // getUserProfileList();
});

export { getUserProfileList, openPrivateChat };