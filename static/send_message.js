document.addEventListener("DOMContentLoaded", function () {
    const send_button = document.getElementById("send-button");
    const messageInput = document.getElementById("message-input");
    const messagesContainer = document.getElementById("messages-container");
    let currentOffset = parseInt(document.getElementById("current-offset").value, 10);
    const searchInput = document.getElementById("searchInput")

    const dataContainer = document.getElementById("data-container");
    const messages = JSON.parse(dataContainer.dataset.messages); 
    // console.log(messages);

    const messageControlPanel = document.getElementById("message-control")
    let lastHoveredMessage = null;
    
    function getMessagesDiv() {
        const messageControlPanel = document.getElementById("message-control")
        
        const messageList = messagesContainer.querySelectorAll('.message'); 
        // console.log(messageList);
    
        messageList.forEach((message, index) => {
            // console.log(`Message ${index}:`, message.innerHTML);
    
            message.addEventListener('mouseenter', () => {
                lastHoveredMessage = message;
                
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

    window.PrivateChatStatus = false;

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
    
    function getLastHoveredMessage() {
        return lastHoveredMessage ? lastHoveredMessage.innerHTML : null;
    }

    function getMessageId(element) {
        return element?.closest('.message')?.getAttribute('data-message-id') || null;
    }
    
    function renderMessages(messages) {
        fetch(`/load-messages?offset=${currentOffset}`);
        // console.log(currentOffset);
        
        messages.reverse().forEach(message => {
            const [id, nickname, text, timestamp, replyTo, repliedMessage, repliedMessageNickname, editedStatus] = message;  
            const trimmedTimestamp = timestamp.slice(0, -3);
            const messagesContainer = document.getElementById("messages-container");
        
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
        
            messagesContainer.appendChild(newMessage);
        });        

        currentOffset += 20
        document.getElementById("current-offset").value = currentOffset;
    }

    renderMessages(messages);
    getUserProfileList();

    wait(300).then(() => {
        getMessagesDiv(); 
    });

    lastHoveredMessage = null;

    messagesContainer.scrollTop = messagesContainer.scrollHeight;

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

    function loadMoreMessages() {
        fetch(`/load-messages?offset=${currentOffset}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Ошибка загрузки: ${response.status}`);
                }
                return response.json(); 
            })
            .then(messages => {
                const messagesContainer = document.getElementById("messages-container");

                const currentScrollHeight = messagesContainer.scrollHeight;
                const currentScrollTop = messagesContainer.scrollTop;
                
                messages.forEach(message => {
                    const [id, nickname, text, timestamp, replyTo, repliedMessage, repliedMessageNickname, editedStatus] = message;
                    const trimmedTimestamp = timestamp.slice(0, -3);
                    const messagesContainer = document.getElementById("messages-container");
                
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
                
                    if (replyTo && repliedMessage) {
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
                
                    messagesContainer.prepend(newMessage);
                });                
    
                currentOffset += messages.length;
                document.getElementById("current-offset").value = currentOffset;
                
                const newScrollHeight = messagesContainer.scrollHeight;
                messagesContainer.scrollTop = currentScrollTop + (newScrollHeight - currentScrollHeight);

                console.log(`Текущий offset: ${currentOffset}`);
            })
            .catch(error => {
                console.error("Ошибка при загрузке сообщений:", error);
            });
    }
    
    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    messagesContainer.addEventListener("scroll", function () {
        if (messageControlPanel.style.display === 'block') {
            messageControlPanel.style.display = 'none'
        }
        
        if (messagesContainer.scrollTop === 0 && PrivateChatStatus === false ) { 
            loadMoreMessages(); 
            let lastHoveredMessage = null;
            wait(300).then(() => {
                getMessagesDiv(); 
            });
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
    
    const pencilIcon = document.getElementById("pencil-icon")
    const binIcon = document.getElementById("bin-icon")
    const answerContainer = document.getElementById("answer-container")

    let lastMessage = null;

    function handleArrowClick(chatPartnerId) {
        const arrowIcon = document.getElementById("arrow-icon");
    
        arrowIcon.addEventListener("click", function (e) {
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
    
    handleArrowClick();    

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

    let editingMessage = null;

    pencilIcon.addEventListener("click", function (e) {
        e.preventDefault();
        
        const token = localStorage.getItem("session_token");
        const message = getLastHoveredMessage();
        
        editingMessage = message;

        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = editingMessage; 
        const messageText = tempContainer.querySelector('.message-text')?.innerText.trim();
        const nickname = tempContainer.querySelector('.nickname').innerText;
        const time = tempContainer.querySelector('.full-time').innerText;
    
        const messageInput = document.getElementById("message-input");
        const editContainer = document.getElementById("edit-container");
    
        if (answerContainer.style.display === 'block') {
            answerContainer.style.display = 'none';
        }
    
        if (editContainer.style.display === 'block') {
            editContainer.style.display = 'none';
        }
    
        if (token) {
            console.info(token)
            console.info(messageText)
            
            fetch('/verify-edit-message-global-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, messageText, time }),
            })
            .then((response) => {
                if (response.ok) {
                    messageInput.value = messageText;
                    messageInput.focus();
                    editContainer.style.display = 'block';
                    document.removeEventListener("keydown", handleNewMessage);
                    document.addEventListener("keydown", handleNewMessage);
                    editContainer.innerText = "Вы редактируете сообщение •" + " " + "esc для отмены • enter чтобы сохранить";
                } 
            })
            .catch((error) => {
                console.error('Error during fetch:', error);
            });
        } else {
            console.warn('No message selected to edit.');
        }
    });
    
    function handleNewMessage(event) {
        console.info(editingMessage)
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = editingMessage; 

        const nickname = tempContainer.querySelector('.nickname').innerText;
        const oldMessage = tempContainer.querySelector('.message-text').innerText;
        const messageId = tempContainer.querySelector('.message-id').innerText;
    
        const messageInput = document.getElementById("message-input");
        const editContainer = document.getElementById("edit-container");
    
        if (event && event.key === "Escape") {
            messageInput.value = "";
            messageInput.blur();
            editContainer.style.display = 'none';
            return;
        }
    
        if (event && event.key === "Enter" && editContainer.style.display === 'block') {
            const newMessage = messageInput.value.trim();
    
            console.info(oldMessage);
            console.info(newMessage);
            fetch('/edit-message-global-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nickname, oldMessage, newMessage, messageId }),
            })
            .then((response) => {
                if (response.ok) {
                    console.info('Message edited successfully');
    
                    if (lastHoveredMessage) {
                        lastHoveredMessage.querySelector('.message-text').textContent = newMessage;
                    }
    
                    if (lastHoveredMessage) {
                        const rect = lastHoveredMessage.getBoundingClientRect();
                        const containerRect = messagesContainer.getBoundingClientRect();
                        const maxRight = containerRect.right - messageControlPanel.offsetWidth - 40;
    
                        messageControlPanel.style.top = `${rect.top + window.scrollY - 10}px`;
                        messageControlPanel.style.left = `${maxRight + window.scrollX}px`;
                    }

                    const messageHeader = lastHoveredMessage.querySelector(".time");

                    console.log(messageHeader)
                    const editedLabel = document.createElement("span");
                    editedLabel.className = "edited-label";
                    editedLabel.textContent = " (отредактировано)";
                    editedLabel.style.color = "gray";
                    editedLabel.style.fontSize = "12px";
                    editedLabel.style.marginLeft = "5px";
                    messageHeader.appendChild(editedLabel);
    
                    editContainer.style.display = 'none';
                    messageInput.value = "";
                    messageInput.blur()
                    editingMessage = null;
                } else {
                    console.error('Failed to edit message');
                }
            })
            .catch((error) => {
                console.error('Error during fetch:', error);
            });
        } 
    }    

    binIcon.addEventListener("click", function (e) {
        e.preventDefault();
        
        let message = getLastHoveredMessage();
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = message;
    
        const nickname = tempContainer.querySelector('.nickname').innerText.trim();
        const text = tempContainer.querySelector('.message-text').innerText.trim();
        const messageId = tempContainer.querySelector('.message-id').innerText.trim();
        
        const messageInput = document.getElementById("message-input");
        const answerContainer = document.getElementById("answer-container");
        const editContainer = document.getElementById("edit-container");

        const token = localStorage.getItem("session_token");
        
        if (editContainer.style.display === 'block') {
            editContainer.style.display = 'none';
            messageInput.value = "";
        }

        if (answerContainer.style.display === 'block') {
            answerContainer.style.display = 'none';
            messageInput.value = "";
        }

        if (message) {
            fetch('/delete-message-global-chat', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nickname, token, text, messageId }),
            })
            .then((response) => {
                if (response.ok) {
                    console.info('Message deleted successfully');
                    
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
                        messageControlPanel.style.display = 'none';
                    }
                    
                } else {
                    console.error('Failed to delete message');
                }
            })
            .catch((error) => {
                console.error('Error during fetch:', error);
            });
        }
    });
    
});