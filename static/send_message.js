document.addEventListener("DOMContentLoaded", function () {
    const send_button = document.getElementById("send-button");
    const message_input = document.getElementById("message-input");
    const messagesContainer = document.getElementById("messages-container");
    let currentOffset = parseInt(document.getElementById("current-offset").value, 10);

    const dataContainer = document.getElementById("data-container");
    const messages = JSON.parse(dataContainer.dataset.messages); 
    // console.log(messages);

    const messageControlPanel = document.getElementById("message-control")
    let lastHoveredMessage = null;
    
    function getMessagesDiv() {
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

    function getLastHoveredMessage() {
        return lastHoveredMessage ? lastHoveredMessage.innerHTML : null;
    }

    function getMessageId(element) {
        return element?.closest('.message')?.getAttribute('data-message-id') || null;
    }
    
    function renderMessages(messages) {
        fetch(`/load-messages?offset=${currentOffset}`);
        console.log(currentOffset);
        
        messages.reverse().forEach(message => {
            const [id, nickname, text, timestamp, replyTo, repliedMessage, repliedMessageNickname ] = message;  
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


    renderMessages(messages)
    wait(300).then(() => {
        getMessagesDiv(); 
    });

    lastHoveredMessage = null;

    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    function sendMessage() {
        const user_message = message_input.value.trim();

        const token = localStorage.getItem("session_token");

        if (!user_message) {
            return;
        }

        fetch("/user_message", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token 
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

                message_input.value = "";
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        })
        .catch(error => {
            console.error("Ошибка:", error);
        });
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
                    const [id, nickname, text, timestamp, replyTo, repliedMessage, repliedMessageNickname] = message;
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
        if (messagesContainer.scrollTop === 0) { 
            loadMoreMessages(); 
            let lastHoveredMessage = null;
            wait(300).then(() => {
                getMessagesDiv(); 
            });
        }
    });

    document.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.ctrlKey) {
            return;
        }
        
        if (document.activeElement !== message_input) {
            message_input.focus();
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
    
    message_input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            if (e.shiftKey) {
                e.preventDefault(); 
                let cursorPos = message_input.selectionStart;
                let textBefore = message_input.value.substring(0, cursorPos);
                let textAfter = message_input.value.substring(cursorPos);
                
                message_input.value = textBefore + "\n" + textAfter;
                message_input.selectionStart = message_input.selectionEnd = cursorPos + 1; 
                return;
            }
    
            e.preventDefault();
            const editContainer = document.getElementById("edit-container");
            const answerContainer = document.getElementById("answer-container");
    
            if (editContainer.style.display === "none" && answerContainer.style.display === "none") {
                sendMessage();
                message_input.blur();
                wait(300).then(() => {
                    getMessagesDiv();
                });
            }
        }
    });

    const arrowIcon = document.getElementById("arrow-icon")
    const pencilIcon = document.getElementById("pencil-icon")
    const binIcon = document.getElementById("bin-icon")
    const answerContainer = document.getElementById("answer-container")

    let lastMessage = null;

    arrowIcon.addEventListener("click", function (e) {
        e.preventDefault();
        let message = getLastHoveredMessage();

        const messageInput = document.getElementById("message-input")
        messageInput.value = "";

        const editContainer = document.getElementById("edit-container");
        editContainer.style.display = 'none';
    
        if (answerContainer.style.display === 'none' || lastMessage !== message) { 
            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = message;
    
            const username = tempContainer.querySelector('.nickname').innerText;
            const messageText = tempContainer.querySelector('.message-text').innerText;
            
            answerContainer.innerText = "Вы отвечаете на " + "'" + messageText + "'" + " от " + username + " " + "• esc для отмены";
            answerContainer.style.display = 'block';
    
            lastMessage = message;
            console.info("Выбранное сообщение изменилось:", message);

            document.addEventListener("keydown", handleReply);
        } else {
            answerContainer.style.display = 'none';   
            answerContainer.innerText = "Вы отвечаете на";
            lastMessage = null; 
        }
    });

    function handleReply(event) { 
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
    
            fetch('/reply-message-global-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, answerMessage, repliedMessage, repliedMessageNickname, messageId}),
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