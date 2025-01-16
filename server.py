import socket
import threading
import sqlite3
import hashlib
from datetime import datetime

from main.data import server, SERVER_HOST, SERVER_PORT, clients, running

conn = sqlite3.connect('messanger.db')
cursor = conn.cursor()

cursor.execute("PRAGMA foreign_keys = ON")

cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
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

conn.commit()
conn.close()

clients = []

def check_username_avaibility(username):
    conn = sqlite3.connect('messanger.db')
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
    user = cursor.fetchone()

    if user is None:
        return True
    else:
        return False
    
def add_user_password(username, hash_pass):
    conn = sqlite3.connect('messanger.db')
    cursor = conn.cursor()

    created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute('''
            INSERT INTO users (username, password_hash, created_at)
            VALUES (?, ?, ?)
        ''', (username, hash_pass, created_at))
        
    conn.commit()
    conn.close()

def hash_password(password):
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def check_hash_pass(username, hash_pass):
    conn = sqlite3.connect('messanger.db')
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
    user = cursor.fetchone()

    if hash_pass == user[2]:
        return True
    else:
        return False

def handle_login(client):
    try:
        auth_option = client.recv(1024).decode('utf-8')
        
        if auth_option == 'login':  
            client.send("waiting_for_login".encode('utf-8'))

            while True:
                username = client.recv(1024).decode('utf-8')

                if check_username_avaibility(username) == False:
                    client.send(str(True).encode('utf-8'))
                    break  
                else:
                    client.send(str(False).encode('utf-8'))
            
            while True:
                password = client.recv(1024).decode('utf-8')
                hash_pass = hash_password(password)

                if check_hash_pass(username, hash_pass) == True:
                    client.send(str(True).encode('utf-8'))
                    break  
                else:
                    client.send(str(False).encode('utf-8'))
            
            handle_messages(client, username)

        elif auth_option == 'registration': 
            client.send("waiting_for_registration".encode('utf-8'))
            
            while True:
                username = client.recv(1024).decode('utf-8')
                # print(username)
                if check_username_avaibility(username) == True:
                    client.send(str(True).encode('utf-8'))
                    break  
                else:
                    client.send(str(False).encode('utf-8'))

            password = client.recv(1024).decode('utf-8')
            hash_pass = hash_password(password)

            add_user_password(username, hash_pass)

            client.send("Вы успешно зарегистрировались".encode('utf-8'))
        else:
            client.send("НЕВЕРНО.".encode('utf-8'))
    except Exception as e:
        print(f"Ошибка: {e}")
    finally:
        client.close()

def broadcast_message(sender_username, sender, message):
    current_time = datetime.now().strftime("%H:%M")
    
    for client in clients:
        if client != sender:
            try:
                client.send(f"\n[{current_time}] {sender_username}: {message}".encode('utf-8'))
            except:
                clients.remove(client)

def handle_messages(client, username):
    while True:
        message = client.recv(1024).decode('utf-8')
        
        if message:
            current_time = datetime.now().strftime("%H:%M")
            print(f"[{current_time}] {username}: {message}") 
            broadcast_message(username, client, message)
       
        if not message:
            print(f"Пользователь {username} ливнул в страхе")
            clients.remove(client)
            break

def handle_commands():
    global server_running
    while True:
        command = input("Введите 'stop' для завершения сервера:\n").strip().lower()
        if command == 'stop':
            server_running = False
            print("Остановка сервера...")
            break

def start_server():
    global running
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1) 
    server.bind((SERVER_HOST, SERVER_PORT))
    server.listen()
    print(f"Сервер запущен на {SERVER_HOST}:{SERVER_PORT}...")

    server.settimeout(1.0)  

    while running:
        try:
            server.settimeout(1.0)  
            client, address = server.accept()
            print(f"Подключился клиент: {address}")
            clients.append(client)
            threading.Thread(target=handle_login, args=(client,)).start()
        except socket.timeout:
            continue  

    server.close()
    print("Сервер остановлен.")

if __name__ == "__main__":
    command_thread = threading.Thread(target=handle_commands)
    command_thread.start()
    start_server()
    command_thread.join()