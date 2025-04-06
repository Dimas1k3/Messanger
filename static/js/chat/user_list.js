import {
    handleArrowClick,
    handleReply,
    handleEditClick,
    handleNewMessage,
    handleDeleteClick
} from "./message_controls.js";

import {
    openPrivateChat
} from "./chat.js"

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
                            window.partnerId = userId;
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
};

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

export { getUserProfileList };