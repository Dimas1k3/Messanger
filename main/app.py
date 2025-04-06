from flask import Flask, request, jsonify, render_template
import sqlite3
import logging
from datetime import datetime

from handlers import (
    validate_username, validate_password, validate_email, 
    hash_password, send_verification_code, parse_html_text,
    process_messages
)

from db import (
    check_username_availability, check_email_availability, check_code, 
    add_code_to_db, check_hash_pass, add_user_password, 
    update_user_password, get_user_id, create_session_token,
    verify_session_token, get_user_nickname, add_message_to_db,
    render_messages, delete_message_from_db, get_message_id, 
    edit_new_user_message, get_user_id_from_message,
    add_message_with_reply_to_db, get_user_id_by_message_id,
    get_status_edited_or_not, find_message_id_by_text,
    delete_expired_tokens, get_all_nicknames,
    verify_session_token_by_id, render_messages_private_chat,
    add_private_message_to_db, get_private_message_id
)

logging.basicConfig(level=logging.INFO)

app = Flask(__name__, template_folder="../templates", static_folder="../static")

conn = sqlite3.connect('messanger.db')
cursor = conn.cursor() 

cursor.execute("PRAGMA foreign_keys = ON")

cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    verification_code TEXT,
    code_created_at DATETIME,
    code_deleted_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
''')

cursor.execute('''
    CREATE TABLE IF NOT EXISTS global_chat (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reply_to INTEGER REFERENCES global_chat(id),
    edited BOOLEAN NOT NULL DEFAULT 0,  -- 0 = не редактировано, 1 = отредактировано
    FOREIGN KEY (sender_id) REFERENCES users(id)
    )
''')

cursor.execute('''
    CREATE TABLE IF NOT EXISTS private_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reply_to INTEGER REFERENCES private_messages(id),
    edited BOOLEAN NOT NULL DEFAULT 0,  -- 0 = не редактировано, 1 = отредактировано
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
    )
''')

cursor.execute('''
    CREATE TABLE IF NOT EXISTS session_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
    )    
''')

conn.commit()
conn.close()

@app.route("/")
def login_page():
    return render_template("login_page.html")

@app.route("/main")
def main_page():
    delete_expired_tokens()

    offset = int(request.args.get('offset', 0))
    limit = 20
    messages = render_messages(offset, limit)
    processed_messages = process_messages(messages, private_chat_status=None)

    return render_template("main_page.html", messages=processed_messages)

@app.route('/load-messages', methods=['GET'])
def load_messages():
    offset = int(request.args.get('offset', 0))
    limit = 20
    private_chat_status = request.args.get('privateChat') == 'true'

    if private_chat_status:
        current_user_id = request.args.get('userId')
        chat_partner_id = request.args.get('partnerId')

        messages = render_messages_private_chat(current_user_id, chat_partner_id, limit, offset)
    else:
        messages = render_messages(offset, limit)

    processed_messages = process_messages(messages, private_chat_status)
    print(messages)
    return jsonify(processed_messages)

@app.route("/load-user-list", methods=["POST"])
def load_user_list():
    user_list = get_all_nicknames()
    online_users = []
    offline_users = []
    data = request.get_json()
    token = data.get("token")

    if not token:
        return jsonify({"success": False, "message": "Токен отсутствует"}), 400
    
    user = verify_session_token(token)
    if user[0] == False:
        return jsonify({"success": False, "message": "Токен невалидный"}), 400
    current_user_id = user[1]

    for user in user_list:
        user_id = get_user_id(username=user)
        temp = []

        if verify_session_token_by_id(user_id) == False:
            temp.append(user)
            temp.append(user_id)
            offline_users.append(temp)
            continue
        
        temp.append(user)
        temp.append(user_id)
        online_users.append(temp)
    
    # print(current_user_id)
    # print(online_users)
    # print(offline_users)
    return jsonify({"success": True, "userId": current_user_id, "onlineUsers": online_users, "offlineUsers": offline_users})

@app.route("/register", methods=["GET"])
def register_page():
    return render_template("register_page.html")

@app.route("/resetPass", methods=["GET"])
def reset_password_page():
    return render_template("email_page.html")

@app.route("/sendCode", methods=["POST"])
def process_reset_password():    
    data = request.get_json()
    email = data.get("email")
    
    if not email:
        return jsonify({"success": False, "message": "Введите вашу почту"}), 400
    
    elif check_email_availability(email) == True:
        return jsonify({"success": False, "message": "Такой почты не существует"}), 400
    
    code = send_verification_code(email)
    logging.info(code)

    add_code_to_db(email, code)

    return jsonify({"success": True, "message": "Код отправлен на вашу почту"}), 200

@app.route("/resetPass", methods=["POST"])
def check_verification_code():
    data = request.get_json()
    email = data.get("email")
    verificationCode = data.get("verificationCode")

    if not email:
        return jsonify({"success": False, "message": "Введите вашу почту"}), 400

    elif not verificationCode:
        return jsonify({"success": False, "message": "Введите ваш код"}), 400
    
    response = check_code(email, verificationCode)
    
    if response[0] == False:
        return jsonify({"success": False, "message": response[1]}), 400
    else:
        return jsonify({"success": True, "message": "Код подтвержден"}), 200
    
@app.route("/confirmNewPass", methods=["POST"])
def confirm_new_password():
    data = request.get_json()
    email = data.get('email')
    password = data.get('newPass')
    confirmPassword = data.get('confirmNewPass')

    if not password:
        return jsonify({"success": False, "message": "Введите пароль"}), 400
    
    if not confirmPassword:
        return jsonify({"success": False, "message": "Подтвердите пароль"}), 400

    if password != confirmPassword:
        return jsonify({"success": False, "message": "Пароли не совпадают"}), 400
    
    answer = validate_password(password)
    if answer[0] == False:
        return jsonify({"success": False, "message": [answer[1], answer[2]]}), 400
    
    hash_pass = hash_password(password)
    update_user_password(email, hash_pass)
    return jsonify({"success": True, "message": "Вход успешен"})
        
@app.route("/register", methods=["POST"])
def process_registration():
    data = request.get_json() 
    email = data.get("email")
    username = data.get("username")
    password = data.get("password")
    confirmPassword = data.get("confirmPassword")

    fields = [
        (email, "Введите вашу почту"),
        (username, "Введите ваш логин"),
        (password, "Введите ваш пароль"),
        (confirmPassword, "Подтвердите ваш пароль"),
    ]
    
    for field in fields:
        if not field[0]:
            return jsonify({"success": False, "message": field[1]}), 400
        
    if password != confirmPassword:
        return jsonify({"success": False, "message": "Пароли не совпадают"}), 400


    fields2 = [
        (email, validate_email),
        (username, validate_username),
        (password, validate_password)
    ]

    for field in fields2:
        check = field[1](field[0])
        if check == False:
            return jsonify({"success": False, "message": [check[1], check[2]]}), 400
    

    if check_email_availability(email) == False:
        return jsonify({"success": False, "message": ["emailGroup", "Почта занята"]}), 400
    
    if check_username_availability(username) == False:
        return jsonify({"success": False, "message": ["usernameGroup", "Юзернейм занят"]}), 400
    
    hash_pass = hash_password(password)
    add_user_password(username, email, hash_pass)
    return jsonify({"success": True, "message": "Вход успешен"})

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json() 
    username = data.get("username")
    password = data.get("password")
    
    if not username:
        return jsonify({"success": False, "message": "Введите ваш логин"}), 400
    
    elif check_username_availability(username) == True:
        return jsonify({"success": False, "message": "Неверный логин"}), 400
    
    elif not password:
        return jsonify({"success": False, "message": "Введите ваш пароль"}), 400
    
    hash_pass = hash_password(password)
    if check_hash_pass(username, hash_pass) == False:
        return jsonify({"success": False, "message": "Неверный пароль"}), 400
    
    user_id = get_user_id(username)
    token = create_session_token(user_id)
    return jsonify({"success": True, "message": "Вход успешен", "token": token})
    
@app.route("/user_message", methods=["POST"])
def process_user_message():    
    token = request.headers.get("Authorization")
    
    if not token:
        return jsonify({"success": False, "message": "Токен отсутствует"}), 400

    user = verify_session_token(token)
    if user[0] == False:
        return jsonify({"success": False, "message": "Токен невалидный"}), 400
    user_id = user[1]

    data = request.get_json()
    user_message = data.get("message")
    time = datetime.now().strftime(("%Y-%m-%d %H:%M:%S") )

    if not user_message:
        return jsonify({"success": False, "error": "Сообщение пустое"}), 400
    
    nickname = get_user_nickname(user_id)
    add_message_to_db(user_id, user_message, time)
    message_id = get_message_id(user_id, time, user_message)
    showTime = time[:-3] 
    
    return jsonify({"success": True, "nickname": nickname, "message": user_message, "time": showTime, "fullTime": time, "messageId": message_id })

@app.route("/private_user_message", methods=["POST"])
def process_private_user_message():    
    token = request.headers.get("Authorization")
    
    if not token:
        return jsonify({"success": False, "message": "Токен отсутствует"}), 400

    user = verify_session_token(token)
    if user[0] == False:
        return jsonify({"success": False, "message": "Токен невалидный"}), 400
    user_id = user[1]

    data = request.get_json()
    user_message = data.get("message")
    chat_partner_id = data.get("chatPartnerId")
    time = datetime.now().strftime(("%Y-%m-%d %H:%M:%S") )

    if not user_message:
        return jsonify({"success": False, "error": "Сообщение пустое"}), 400
    
    nickname = get_user_nickname(user_id)
    add_private_message_to_db(user_id, chat_partner_id, user_message, time)
    message_id = get_private_message_id(user_id, chat_partner_id, user_message, time)
    showTime = time[:-3] 
    
    return jsonify({"success": True, "nickname": nickname, "message": user_message, "time": showTime, "fullTime": time, "messageId": message_id })

@app.route("/delete-message-global-chat", methods=["DELETE"])
def delete_user_message():
    data = request.get_json() 
    nickname = data.get("nickname")
    token = data.get("token")
    text = data.get('text')
    message_id = data.get("messageId")
    chat_status = data.get("ChatStatus")

    if not token:
        return jsonify({"success": False, "message": "Токен отсутствует"}), 400
    
    user = verify_session_token(token)
    if user[0] == False:
        return jsonify({"success": False, "message": "Токен невалидный"}), 400

    user_id = get_user_id(nickname)

    if user_id != user[1]:
        return jsonify({"success": False, "message": "Сообщение не принадлежит юзеру"}), 400

    if not text:
        return jsonify({"success": False, "error": "Сообщение пустое"}), 400
    
    delete_message_from_db(user_id, text, message_id, chat_status)

    return jsonify({'success': True}), 200

@app.route("/verify-edit-message-global-chat", methods=["POST"])
def verify_edit_user_message():
    data = request.get_json() 
    token = data.get("token")
    message = data.get("messageText")
    time = data.get("time")
    chat_status = data.get("ChatStatus")

    if chat_status == "private_messages":
        chat_partner_id = data.get("chatPartnerId")
    else:
        chat_partner_id = None

    if not token:
        return jsonify({"success": False, "message": "Токен отсутствует"}), 400

    user = verify_session_token(token)
    if user[0] == False:
        return jsonify({"success": False, "message": "Токен невалидный"}), 400
    
    user_id = get_user_id_from_message(user_id=user[1], message=message, time=time,
                        chat_status=chat_status, chat_partner_id=chat_partner_id)
    
    if user[1] != user_id:
        return jsonify({"success": False, "message": "Сообщение не принадлежит юзеру"}), 400

    return jsonify({'success': True}), 200

@app.route("/edit-message-global-chat", methods=["POST"])
def edit_user_message():
    data = request.get_json()
    nickname = data.get("nickname")
    oldMessage = data.get("oldMessage")
    newMessage = data.get("newMessage")
    message_id = data.get("messageId")
    chat_status = data.get("ChatStatus")

    if chat_status == "private_messages":
        chat_partner_id = data.get("chatPartnerId")
    else:
        chat_partner_id = None

    if not newMessage:
        return jsonify({"success": False, "message": "Сообщение пустое"}), 400
    
    edit_new_user_message(message_id, newMessage, chat_status, chat_partner_id)

    return jsonify({'success': True}), 200

@app.route("/reply-message-chat", methods=["POST"])
def reply_to_message():
    data = request.get_json()
    token = data.get("token")
    answerMessage = data.get("answerMessage")
    repliedMessage = data.get("repliedMessage")
    repliedMessageNickname = data.get("repliedMessageNickname")
    message_id = data.get("messageId")
    chat_status = data.get("ChatStatus")
    chat_partner_id = data.get("chatPartnerId")

    if not token:
        return jsonify({"success": False, "message": "Токен отсутствует"}), 400
    
    if not answerMessage:
        return jsonify({"success": False, "message": "Сообщение пустое"}), 400
    
    if not repliedMessage:
        repliedMessage = "Сообщение удалено"
        repliedMessageNickname = ""

    time = datetime.now().strftime(("%Y-%m-%d %H:%M:%S") )
    
    user = verify_session_token(token)

    if user[0] == False:
        return jsonify({"success": False, "message": "Токен невалидный"}), 400

    add_message_with_reply_to_db(user[1], answerMessage, message_id, time, chat_status, chat_partner_id)
    
    if chat_status == "global_chat":
        message_id = get_message_id(user[1], time, answerMessage)
    else:
        message_id = get_private_message_id(user[1], chat_partner_id, answerMessage, time)

    nickname = get_user_nickname(user[1])
    showTime = time[:-3]

    return jsonify({"success": True, "nickname": nickname, "text": answerMessage, 
                    "time": showTime, 'repliedMessage': repliedMessage, "fullTime": time, 
                    "replyTo": repliedMessageNickname,"messageId": message_id })

@app.route("/find-message-chat", methods=["POST"])
def find_message_global_chat():
    data = request.get_json()
    token = data.get("token")
    message_to_find = data.get("messageToFind")
    chat_status = data.get("PrivateChatStatus")

    if not token:
        return jsonify({"success": False, "message": "Токен отсутствует"}), 400
    
    if not message_to_find:
        return jsonify({"success": False, "message": "Сообщение отсутствует"}), 400

    message_id_list = find_message_id_by_text(message_to_find, chat_status)

    if len(message_id_list) == 0:
        return jsonify({"success": False, "message": "Ничего не найдено"}), 400
    
    return jsonify({"success": True, "message_id_list": message_id_list,})

@app.route("/load-private-chat", methods=["POST"])
def load_private_chat():
    data = request.get_json()
    current_user_id = data.get("currentUserId")
    chat_partner_id = data.get("chatPartnerId")
    offset = int(data.get("offset", 0))  
    limit = 20
    
    offset = int(request.args.get('offset', 0))
    limit = 20

    if not current_user_id:
        return jsonify({"success": False, "message": "Юзер отсутствует"}), 400

    if not chat_partner_id:
        return jsonify({"success": False,  "message": "Партнер отсутствует"}), 400

    messages = render_messages_private_chat(current_user_id, chat_partner_id, limit, offset)
    processed_messages = process_messages(messages, private_chat_status=True)
    print(processed_messages[0])
    return jsonify({"success": True, "messages": processed_messages})

if __name__ == "__main__":
    app.run(debug=True)