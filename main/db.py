import sqlite3
from datetime import datetime, timedelta

from handlers import create_token

def check_username_avaibility(username):
    conn = sqlite3.connect('messanger.db')
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
    user = cursor.fetchone()

    conn.close()

    if user is None:
        return True
    else:
        return False
    
def check_email_avaibility(email):
    conn = sqlite3.connect('messanger.db')
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
    user = cursor.fetchone()
    print(user)
    conn.close()

    if user is None:
        return True
    else:
        return False
    
def add_code_to_db(email, code):
    time = datetime.now()
    expire_time = time + timedelta(minutes=15)
    
    conn = sqlite3.connect('messanger.db')
    cursor = conn.cursor()

    cursor.execute('''
        UPDATE users
        SET verification_code = ?, code_created_at = ?, code_deleted_at = ?
        WHERE email = ?
    ''', (code, time, expire_time, email))
    conn.commit()

    conn.close()

def check_code(email, verificationCode):
    time = datetime.now()
    print(time)
    conn = sqlite3.connect('messanger.db')
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
    user = cursor.fetchone()
    print(user)
    conn.close()

    user_code_deleted_at = user[6] 
    code_deleted_at_obj = datetime.fromisoformat(user_code_deleted_at)

    if user[4] != verificationCode :
        return False, "Неверный код"
    elif time >= code_deleted_at_obj:
        return False, "Время кода истекло"
    else:
        return True, "Код подтвержден"

def check_hash_pass(username, hash_pass):
    conn = sqlite3.connect('messanger.db')
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
    user = cursor.fetchone()

    conn.close()

    if hash_pass == user[3]:
        return True
    else:
        return False
    
def add_user_password(username, email, hash_pass):
    conn = sqlite3.connect('messanger.db')
    cursor = conn.cursor()

    created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute('''
            INSERT INTO users (username, email, password_hash, created_at)
            VALUES (?, ?, ?, ?)
        ''', (username, email, hash_pass, created_at))
        
    conn.commit()
    conn.close()

def update_user_password(email, hash_pass):
    conn = sqlite3.connect('messanger.db')
    cursor = conn.cursor()

    cursor.execute('''UPDATE users SET password_hash = ? WHERE email = ?''', (hash_pass, email))
    
    conn.commit()
    conn.close()

def get_user_id(username):
    conn = sqlite3.connect('messanger.db')
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
    user = cursor.fetchone()

    conn.close()

    return user[0]

def create_session_token(user_id):
    conn = sqlite3.connect('messanger.db')
    cursor = conn.cursor()
    
    created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    expires_at = (datetime.now() + timedelta(hours=1)).strftime('%Y-%m-%d %H:%M:%S')
    token = create_token()
    
    cursor.execute('''
        INSERT INTO session_tokens (user_id, token, created_at, expires_at)
        VALUES (?, ?, ?, ?)
    ''', (user_id, token, created_at, expires_at))

    conn.commit()
    conn.close()
    
def add_message_to_db():
    pass