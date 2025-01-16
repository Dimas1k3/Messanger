from flask import Flask, request, jsonify, render_template
import sqlite3
import logging
from datetime import datetime

from handlers import validate_username, validate_password, validate_email, hash_password, send_verification_code
from db import check_username_avaibility, check_email_avaibility, check_code, add_code_to_db, check_hash_pass, add_user_password, update_user_password

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
    CREATE TABLE IF NOT EXISTS user_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    return render_template("main_page.html")

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
    
    elif check_email_avaibility(email) == True:
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
    

    if check_email_avaibility(email) == False:
        return jsonify({"success": False, "message": ["emailGroup", "Почта занята"]}), 400
    
    if check_username_avaibility(username) == False:
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
    
    elif check_username_avaibility(username) == True:
        return jsonify({"success": False, "message": "Неверный логин"}), 400
    
    elif not password:
        return jsonify({"success": False, "message": "Введите ваш пароль"}), 400
    
    hash_pass = hash_password(password)
    if check_hash_pass(username, hash_pass) == False:
        return jsonify({"success": False, "message": "Неверный пароль"}), 400
    
    # add session token
    return jsonify({"success": True, "message": "Вход успешен"})
    
@app.route("/user_message", methods=["POST"])
def process_user_message():    
    data = request.get_json()
    user_message = data.get("message")
    time = datetime.now().strftime(("%d-%m-%Y %H:%M") )

    if not user_message:
        return jsonify({"success": False, "error": "Сообщение пустое"}), 400
    
    # add_message_to_db(?, user_message)
    
    return jsonify({"success": True, "message": user_message, "time": time})

if __name__ == "__main__":
    app.run(debug=True)