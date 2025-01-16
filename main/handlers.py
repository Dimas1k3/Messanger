import hashlib
import smtplib
import random
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from data import banned_words, numbers, login_symbols, password_symbols
from data import sender_email, sender_password, smtp_port, smtp_server

def validate_username(user_login):
    if len(user_login) < 3:
        return False, "usernameGroup", "Минимальная длина ника 3 символа"

    if len(user_login) > 15:
        return False, "usernameGroup", "Максимальная длина ника 15 символов"

    if not str(user_login)[0].isalpha():
        return False, "usernameGroup", "Ник должен начинаться с буквы"

    if user_login.lower() in banned_words:
        return False, "usernameGroup", "Запрещено юзать такой ник"

    if user_login == user_login[0] * len(user_login):
        return False, "usernameGroup", "Ник не может состоять из одного символа"

    number_counter = 0  
    for symbol in user_login:
        if symbol in numbers:
            number_counter += 1      
    if number_counter > 5:
        return False, "usernameGroup", "Бро, максимум 5 цифр в нике"

    symbol_counter = 0
    for symbol in user_login:
        if symbol in login_symbols:
            symbol_counter += 1

    if len(user_login) != symbol_counter:
        return False, "usernameGroup", "Ник должен состоять из букв и цифр"

    return True, user_login

def validate_email(email):
    if "@" not in email or email[0] == "@" or email[-1] == "@":
        return False, "emailGroup", "Email должен содержать '@', и он не может быть в начале или конце"

    try:
        user, domain = email.split("@", 1)
    except ValueError:
        return False, "emailGroup", "Некорректный формат email"

    if not user:
        return False, "emailGroup", "Имя пользователя не может быть пустым"
    if not domain:
        return False, "emailGroup", "Доменная часть не может быть пустой"

    for i in range(len(user) - 1):
        if user[i] == '.' and user[i + 1] == '.':
            return False, "emailGroup", "Две точки подряд в имени пользователя"

    for i in range(len(domain) - 1):
        if domain[i] == '.' and domain[i + 1] == '.':
            return False, "emailGroup", "Две точки подряд в доменной части"

    if "." not in domain:
        return False, "emailGroup", "Доменная часть должна содержать хотя бы одну точку"

    if domain[0] == "." or domain[-1] == ".":
        return False, "emailGroup", "Точка не может быть в начале или конце домена"

    return True, "emailGroup", "Корректный email"

def validate_password(user_password):
    if len(user_password) < 8:
        return False, "passwordGroup", "Минимальная длина пароля 8 символов"

    if len(user_password) > 24:
        return False, "passwordGroup", "Максимальная длина пароля 24 символа"

    if user_password == user_password[0] * len(user_password):
        return False, "passwordGroup", "Пароль не может состоять из одного символа"

    symbol_counter = 0
    for symbol in user_password:
        if symbol in password_symbols:
            symbol_counter += 1

    if len(user_password) == symbol_counter:
        return True, user_password

    return False, "passwordGroup", "Пароль должен состоять из букв и цифр"

def hash_password(password):
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def send_verification_code(recipient_email):
    code = random.randint(100000, 999999)
    
    subject = "Ваш код подтверждения"
    body = f"Ваш код подтверждения: {code}"

    msg = MIMEMultipart()
    msg["From"] = sender_email
    msg["To"] = recipient_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))
    
    with smtplib.SMTP(smtp_server, smtp_port) as server:
        server.starttls()  
        server.login(sender_email, sender_password)  
        server.sendmail(sender_email, recipient_email, msg.as_string())
    
    return code