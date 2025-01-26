document.addEventListener("DOMContentLoaded", function () {
    const send_button = document.getElementById("send-button");
    const message_input = document.getElementById("message-input");
    const messagesContainer = document.getElementById("messages-container");
    let currentOffset = parseInt(document.getElementById("current-offset").value, 10);

    const dataContainer = document.getElementById("data-container");
    const messages = JSON.parse(dataContainer.dataset.messages); 
    // console.log(messages);

    const messageControlPanel = document.getElementById("message-control")
    
    function getMessagesDiv() {
        const messageList = messagesContainer.querySelectorAll('.message'); 
        // console.log(messageList);
    
        messageList.forEach((message, index) => {
            console.log(`Message ${index}:`, message.innerHTML);
    
            message.addEventListener('mouseenter', () => {
                message.style.backgroundColor = '#e0e0e0';
                messageControlPanel.style.display = 'block';

                const rect = message.getBoundingClientRect();
                const containerRect = messagesContainer.getBoundingClientRect();
                messageControlPanel.style.position = 'absolute';
            
                const maxRight = containerRect.right - messageControlPanel.offsetWidth - 40;
                messageControlPanel.style.top = `${rect.top + window.scrollY - 10}px`;
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

    function renderMessages(messages) {
        fetch(`/load-messages?offset=${currentOffset}`);
        console.log(currentOffset);
        
        messages.reverse().forEach(message => {
            const [id, nickname, text, timestamp] = message;
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

            const messageText = document.createElement("div");
            messageText.className = "message-text";
            messageText.textContent = text;
                
            newMessage.appendChild(messageHeader);
            messageHeader.appendChild(nicknameElement);
            messageHeader.appendChild(timeElement);
            newMessage.appendChild(messageText);

            messagesContainer.appendChild(newMessage);
        });
        currentOffset += 20
        document.getElementById("current-offset").value = currentOffset;
    }

    renderMessages(messages);
    
    getMessagesDiv();

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

                const messageText = document.createElement("div");
                messageText.className = "message-text";
                messageText.textContent = user_message;
                
                newMessage.appendChild(messageHeader);
                messageHeader.appendChild(nicknameElement);
                messageHeader.appendChild(timeElement);
                newMessage.appendChild(messageText);

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
                    const [id, nickname, text, timestamp] = message;
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
    
                    const messageText = document.createElement("div");
                    messageText.className = "message-text";
                    messageText.textContent = text;
    
                    newMessage.appendChild(messageHeader);
                    messageHeader.appendChild(nicknameElement);
                    messageHeader.appendChild(timeElement);
                    newMessage.appendChild(messageText);
    
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