import sqlite3
from datetime import datetime, timedelta
import secrets

def create_token():
    token = secrets.token_hex(32)

    return token

def check_username_availability(username):
    conn = sqlite3.connect('messanger.db')
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
    user = cursor.fetchone()

    conn.close()

    if user is None:
        return True
    else:
        return False
    
def check_email_availability(email):
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

def verify_session_token_by_id(user_id):
    conn = sqlite3.connect('messanger.db')
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM session_tokens WHERE user_id = ?', (user_id,))
    user = cursor.fetchone()

    conn.close()

    if user is None:
        return False
    
    return True

def delete_expired_tokens():
    conn = sqlite3.connect('messanger.db')
    cursor = conn.cursor()
    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    cursor.execute(
        'DELETE FROM session_tokens WHERE expires_at <= ?',
        (current_time,)
    )

    conn.commit()
    conn.close()

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

def get_all_nicknames():
    user_list = []
    
    conn = sqlite3.connect('messanger.db')
    cursor = conn.cursor()

    cursor.execute('SELECT username FROM users')
    users = cursor.fetchall()
    conn.close()

    for user in users:
        user = list(user)
        user = ''.join(user) 
        user_list.append(user)

    return user_list
    
def add_message_to_db(user_id, user_message, time):
    conn = sqlite3.connect('messanger.db')
    cursor = conn.cursor()

    cursor.execute('''
            INSERT INTO global_chat (sender_id, message, sent_at)
            VALUES (?, ?, ?)
        ''', (user_id, user_message, time))

    conn.commit()
    conn.close()

def add_private_message_to_db(user_id, chat_partner_id, user_message, time):
    conn = sqlite3.connect('messanger.db')
    cursor = conn.cursor()
    print(user_id, chat_partner_id, user_message, time)

    cursor.execute('''
        INSERT INTO private_messages (sender_id, receiver_id, message, sent_at)
        VALUES (?, ?, ?, ?)
    ''', (user_id, chat_partner_id, user_message, time))

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

def render_messages_private_chat(current_user_id, chat_partner_id, limit, offset):
    conn = sqlite3.connect('messanger.db')
    cursor = conn.cursor()
    
    query = '''
        SELECT 
            private_messages.id,
            sender.username AS sender_name,
            receiver.username AS receiver_name,
            private_messages.message,
            private_messages.sent_at,
            private_messages.reply_to,
            parent.message AS replied_message  -- Берем текст родительского сообщения
        FROM 
            private_messages
        JOIN 
            users AS sender ON private_messages.sender_id = sender.id
        JOIN 
            users AS receiver ON private_messages.receiver_id = receiver.id
        LEFT JOIN 
            private_messages AS parent ON private_messages.reply_to = parent.id  -- Связываем сообщения по reply_to
        WHERE 
            (private_messages.sender_id = ? AND private_messages.receiver_id = ?) 
            OR (private_messages.sender_id = ? AND private_messages.receiver_id = ?)
        ORDER BY 
            private_messages.sent_at DESC,
            private_messages.id DESC
        LIMIT ? OFFSET ?;
    '''
    
    cursor.execute(query, (current_user_id, chat_partner_id, chat_partner_id, current_user_id, limit, offset))
    messages = cursor.fetchall()

    conn.close()
    # print(messages)
    return messages

def get_status_edited_or_not(message_id, private_chat_status):
    if private_chat_status is None or private_chat_status is False:
        table = 'global_chat'
    else:
        table = 'private_messages'
    
    conn = sqlite3.connect('messanger.db')
    cursor = conn.cursor()

    cursor.execute(f'SELECT edited FROM {table} WHERE id = ?', (message_id,))
    row = cursor.fetchone()

    conn.close()
    # print(row)
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

def get_private_message_id(user_id, chat_partner_id, user_message, time):
    conn = sqlite3.connect('messanger.db')
    cursor = conn.cursor()

    cursor.execute(
        'SELECT id FROM private_messages WHERE sender_id = ? AND receiver_id = ? AND sent_at = ? AND message = ?',
        (user_id, chat_partner_id, time, user_message)
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

def add_message_with_reply_to_db(user_id, messageAnswer, messageTextId, time, chat_status, chat_partner_id):
    conn = sqlite3.connect('messanger.db')
    cursor = conn.cursor()

    
    if chat_status == "global_chat":
        query = f'''
            INSERT INTO {chat_status} (sender_id, message, sent_at, reply_to)
            VALUES (?, ?, ?, ?)
        '''
        cursor.execute(query, (user_id, messageAnswer, time, messageTextId))
    
    elif chat_status == "private_messages":
        query = f'''
            INSERT INTO {chat_status} (sender_id, receiver_id, message, sent_at, reply_to)
            VALUES (?, ?, ?, ?, ?)
        '''
        cursor.execute(query, (user_id, chat_partner_id, messageAnswer, time, messageTextId))

    conn.commit()
    conn.close()

def get_message_text(message_id):
    conn = sqlite3.connect('messanger.db')
    cursor = conn.cursor()

    cursor.execute('SELECT message FROM global_chat WHERE id = ?', (message_id,))
    message_text = cursor.fetchone() 

    conn.close()

    return message_text

def find_message_id_by_text(message_to_find):
    conn = sqlite3.connect('messanger.db')
    cursor = conn.cursor()

    cursor.execute('SELECT id FROM global_chat where message = ?', (message_to_find,))
    message_id = cursor.fetchone() 

    conn.close()

    return message_id