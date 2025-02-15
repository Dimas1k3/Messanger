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

def get_user_id_by_message_id(message_id):
    conn = sqlite3.connect('messanger.db')
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM global_chat WHERE id = ?', (message_id,))
    user = cursor.fetchone()

    conn.close()

    return user[1]

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

    return token

def verify_session_token(token):
    conn = sqlite3.connect('messanger.db')
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM session_tokens WHERE token = ?', (token,))
    user = cursor.fetchone()

    conn.close()

    if user is None:
        return False
    
    return True, user[1]

def get_user_id_from_message(user_id, message, time):
    conn = sqlite3.connect('messanger.db')
    cursor = conn.cursor()

    cursor.execute(
        'SELECT * FROM global_chat WHERE sender_id = ? AND message = ? AND sent_at = ?',
        (user_id, message, time)
    )

    message = cursor.fetchone()
    print(message)
    conn.close()

    return message[1]

def get_user_nickname(user_id):
    conn = sqlite3.connect('messanger.db')
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()

    conn.close()

    return user[1]
    
def add_message_to_db(user_id, user_message, time):
    conn = sqlite3.connect('messanger.db')
    cursor = conn.cursor()

    cursor.execute('''
            INSERT INTO global_chat (sender_id, message, sent_at)
            VALUES (?, ?, ?)
        ''', (user_id, user_message, time))

    conn.commit()
    conn.close()

def render_messages(offset, limit):
    conn = sqlite3.connect('messanger.db')
    cursor = conn.cursor()

    query = '''
        SELECT 
            global_chat.id,
            users.username,
            global_chat.message,
            global_chat.sent_at,
            global_chat.reply_to,
            parent.message AS replied_message  -- Берем текст родительского сообщения
        FROM 
            global_chat
        JOIN 
            users ON global_chat.sender_id = users.id
        LEFT JOIN 
            global_chat AS parent ON global_chat.reply_to = parent.id  -- Связываем сообщения по reply_to
        ORDER BY 
            global_chat.sent_at DESC,
            global_chat.id DESC
        LIMIT ? OFFSET ?;
    '''
    cursor.execute(query, (limit, offset))
    messages = cursor.fetchall() 

    conn.close()
    
    return messages

def get_status_edited_or_not(message_id):
    conn = sqlite3.connect('messanger.db')
    cursor = conn.cursor()

    cursor.execute('SELECT edited FROM global_chat WHERE id = ?', (message_id,))
    row = cursor.fetchone()

    conn.close()
    print(row)
    return row[0]

def delete_message_from_db(user_id, message, message_id):
    conn = sqlite3.connect('messanger.db')
    cursor = conn.cursor()
    
    print(user_id, message, message_id)
    cursor.execute(
        'DELETE FROM global_chat WHERE sender_id = ? AND message = ? AND id = ?',
        (user_id, message, message_id)
    )
    
    conn.commit()
    
    cursor.execute('SELECT * FROM global_chat WHERE sender_id = ?', (user_id,)) 
    row = cursor.fetchall()
    print(row)

    conn.close()

def get_message_id(user_id, time, message):
    conn = sqlite3.connect('messanger.db')
    cursor = conn.cursor()

    print(user_id, time, message)
    cursor.execute(
        'SELECT id FROM global_chat WHERE sender_id = ? AND sent_at = ? AND message = ?',
        (user_id, time, message)
    )

    message = cursor.fetchone()
    # print(message)
    conn.close()

    return message[0]

def edit_new_user_message(message_id, message):
    conn = sqlite3.connect('messanger.db')
    cursor = conn.cursor()

    cursor.execute('''
        UPDATE global_chat 
        SET message = ?, edited = ? 
        WHERE id = ?
    ''', (message, 1, message_id))

    conn.commit()
    conn.close()

def add_message_with_reply_to_db(user_id, messageAnswer, messageTextId, time):
    conn = sqlite3.connect('messanger.db')
    cursor = conn.cursor()

    cursor.execute('''
        INSERT INTO global_chat (sender_id, message, sent_at, reply_to)
        VALUES (?, ?, ?, ?)
    ''', (user_id, messageAnswer, time, messageTextId))

    conn.commit()
    conn.close()

def get_message_text(message_id):
    conn = sqlite3.connect('messanger.db')
    cursor = conn.cursor()

    cursor.execute('SELECT message FROM global_chat WHERE id = ?', (message_id,))
    message_text = cursor.fetchone() 

    conn.close()

    return message_text