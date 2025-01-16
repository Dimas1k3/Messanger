import socket
import threading

from main.data import client, CLIENT_HOST, CLIENT_PORT, login_symbols, password_symbols, banned_words, numbers

def send_messages():
    threading.Thread(target=receive_messages, daemon=True).start()
    
    while True:
        message = input("Введите сообщение: ")  
        if message.lower() == 'exit':  
            print("Отключение от сервера.")
            client.close()
            break

        client.send(message.encode('utf-8'))

def receive_messages():
    while True:
        message = client.recv(1024).decode('utf-8')
        if message:
            print(f"{message}")
        else:
            break

def choose_auth_option():
    while True:
        user_choice = input("Введите 1 или 2: ")
        
        if user_choice == '1':
            return 'login'
        if user_choice == '2':
            return 'registration'
        else:
            print('БРО, 1 ИЛИ 2, ЭТО НЕ ТАК СЛОЖНО СУКА')

def choose_username():
    while True:
        user_login = input("Введите логин: ")

        if len(user_login) < 3:
            print("Минимальная длина ника 3 символа")
            continue

        if len(user_login) > 15:
            print("Максимальная длина ника 15 символов")
            continue

        if not str(user_login)[0].isalpha():
            print("Ник должен начинаться с буквы")
            continue

        if user_login.lower() in banned_words:
            print("ЗАПРЕЩЕНО ЮЗАТЬ ТАКОЙ НИК")
            continue

        if user_login == user_login[0] * len(user_login):
            print("Ник не может состоять из одного символа, КОТОРЫЙ ТЫ НАСПАМИЛ КУЧУ РАЗ")
            continue

        number_counter = 0  

        for symbol in user_login:
            if symbol in numbers:
                number_counter += 1      
        
        if number_counter > 5:
            print("Бро, максимум 5 ЦИФР")
            continue

        symbol_counter = 0

        for symbol in user_login:
            if symbol in login_symbols:
                symbol_counter += 1

        if len(user_login) == symbol_counter:
            # print("Ваш ник говно, но он подходит")
            return True, user_login
        else:
            print("Ник должен состоять из Лондонских букв и не римских цифр")

def choose_password():
    while True:
        user_password = input("Введите пароль: ")
       
        if len(user_password) < 8:
            print("Минимальная длина пароля 8 символа")
            continue

        if len(user_password) > 15:
            print("Максимальная длина пароля 24 символа")
            continue

        if user_password == user_password[0] * len(user_password):
            print("Ник не может состоять из одного символа, КОТОРЫЙ ТЫ НАСПАМИЛ КУЧУ РАЗ")
            continue

        symbol_counter = 0

        for symbol in user_password:
            if symbol in password_symbols:
                symbol_counter += 1

        if len(user_password) == symbol_counter:
            print("Ваш пароль тоже говно, но он подходит")
            return True, user_password
        else:
            print("БРО, НЕЛЬЗЯ ТАКОЕ ЮЗАТЬ")

def handle_registration():
    while True:
        success, login = choose_username()
        if success == True:
            client.send(login.encode('utf-8'))
            response = client.recv(1024).decode('utf-8')

            if response == str(True):
                print("Ваш ник говно, но он подходит")
                break

            elif response == str(False):
                print("Такой юзернейм уже занят, попробуйте снова.")
    
    if response == str(True):
        while True:
            success, password = choose_password()
            if success == True:
                client.send(password.encode('utf-8'))
                break

    response = client.recv(1024).decode('utf-8')

    print(response)

    login_register()

def handle_login():
    while True:
        login = input("Введите ваш логин: ")
        
        client.send(login.encode('utf-8'))
        response = client.recv(1024).decode('utf-8')

        if response == str(True):
            break
        else:
            print("Такого пользователя не существует")

    while True:
        login = input("Введите ваш пароль: ")
        
        client.send(login.encode('utf-8'))
        response = client.recv(1024).decode('utf-8')

        if response == str(True):
            print("ДАРОВА, НОВЕНЬКИЙ")
            send_messages()
            break
        else:
            print("Неправильный пароль")

def login_register():
    print("1. Логин")
    print("2. Регистрация")
    
    # оиждание одобрения логина от сервака
    while True:
        auth_option = choose_auth_option() 
        client.send(auth_option.encode('utf-8'))
        response = client.recv(1024).decode('utf-8')

        if response == 'waiting_for_login':
            handle_login()
            break
        elif response == "waiting_for_registration":
            handle_registration()
            break

def main():
    try:
        client.connect((CLIENT_HOST, CLIENT_PORT))  
        print(f"Подключен к серверу {CLIENT_HOST}:{CLIENT_PORT}")
    except ConnectionRefusedError:
        print("Сервак офнут, смирись")
        exit()

    login_register()

main()