"""
API: контактные сообщения + авторизация пользователей (register, login, me, update, logout).
Email-уведомления через Gmail SMTP.
"""
import json
import os
import hashlib
import secrets
import smtplib
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def send_email(subject: str, html: str):
    smtp_from = os.environ.get('SMTP_FROM', '')
    smtp_pass = os.environ.get('SMTP_PASSWORD', '')
    notify_to = os.environ.get('NOTIFY_EMAIL', '')
    if not all([smtp_from, smtp_pass, notify_to]):
        return
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = f'Благодать <{smtp_from}>'
    msg['To'] = notify_to
    msg.attach(MIMEText(html, 'html', 'utf-8'))
    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as s:
        s.login(smtp_from, smtp_pass)
        s.sendmail(smtp_from, notify_to, msg.as_string())

def hash_pw(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()

def ok(data: dict) -> dict:
    return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(data, ensure_ascii=False, default=str)}

def err(msg: str, code: int = 400) -> dict:
    return {'statusCode': code, 'headers': CORS, 'body': json.dumps({'error': msg}, ensure_ascii=False)}

def get_user_by_token(cur, token: str):
    cur.execute(
        "SELECT u.* FROM users u JOIN user_sessions s ON s.user_id = u.id WHERE s.token = %s AND s.expires_at > NOW()",
        (token,)
    )
    return cur.fetchone()

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')
    body = json.loads(event.get('body') or '{}')
    token = (event.get('headers') or {}).get('X-Session-Token', '')

    # ─── AUTH routes ───────────────────────────────────────────────
    if action == 'register' and method == 'POST':
        email = body.get('email', '').strip().lower()
        password = body.get('password', '').strip()
        role = body.get('role', '')
        first_name = body.get('first_name', '').strip()
        last_name = body.get('last_name', '').strip()

        if not all([email, password, role, first_name, last_name]):
            return err('Заполните все обязательные поля')
        if role not in ('employer', 'seeker'):
            return err('Неверная роль')
        if len(password) < 6:
            return err('Пароль должен быть не менее 6 символов')

        with get_conn() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT id FROM users WHERE email = %s", (email,))
                if cur.fetchone():
                    return err('Пользователь с таким email уже существует')
                cur.execute(
                    "INSERT INTO users (email, password_hash, role, first_name, last_name, organization, city, phone) VALUES (%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id",
                    (email, hash_pw(password), role, first_name, last_name,
                     body.get('organization', ''), body.get('city', ''), body.get('phone', ''))
                )
                user_id = cur.fetchone()['id']
                token_val = secrets.token_urlsafe(32)
                expires = datetime.now() + timedelta(days=30)
                cur.execute("INSERT INTO user_sessions (user_id, token, expires_at) VALUES (%s,%s,%s)", (user_id, token_val, expires))
            conn.commit()
        return ok({'success': True, 'token': token_val, 'role': role, 'first_name': first_name})

    if action == 'login' and method == 'POST':
        email = body.get('email', '').strip().lower()
        password = body.get('password', '').strip()
        if not email or not password:
            return err('Введите email и пароль')
        with get_conn() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT * FROM users WHERE email = %s AND is_active = TRUE", (email,))
                user = cur.fetchone()
                if not user or user['password_hash'] != hash_pw(password):
                    return err('Неверный email или пароль')
                token_val = secrets.token_urlsafe(32)
                cur.execute("INSERT INTO user_sessions (user_id, token, expires_at) VALUES (%s,%s,%s)", (user['id'], token_val, datetime.now() + timedelta(days=30)))
            conn.commit()
        return ok({'success': True, 'token': token_val, 'role': user['role'], 'first_name': user['first_name'], 'last_name': user['last_name'], 'id': user['id']})

    if action == 'me':
        if not token:
            return err('Требуется авторизация', 401)
        with get_conn() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                user = get_user_by_token(cur, token)
                if not user:
                    return err('Сессия истекла', 401)
                u = dict(user)
                u.pop('password_hash', None)
                return ok({'user': u})

    if action == 'update' and method == 'PUT':
        if not token:
            return err('Требуется авторизация', 401)
        with get_conn() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                user = get_user_by_token(cur, token)
                if not user:
                    return err('Сессия истекла', 401)
                allowed = ['first_name', 'last_name', 'organization', 'city', 'about', 'phone']
                updates = {k: body[k] for k in allowed if k in body}
                if updates:
                    set_clause = ', '.join(f"{k}=%s" for k in updates)
                    cur.execute(f"UPDATE users SET {set_clause} WHERE id=%s", list(updates.values()) + [user['id']])
            conn.commit()
        return ok({'success': True})

    if action == 'logout' and method == 'POST':
        if token:
            with get_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute("UPDATE user_sessions SET expires_at=NOW() WHERE token=%s", (token,))
                conn.commit()
        return ok({'success': True})

    # ─── CONTACT message ─────────────────────────────────────────
    if method == 'POST' and not action:
        name = body.get('name', '').strip()
        contact = body.get('contact', '').strip()
        message = body.get('message', '').strip()
        if not all([name, contact, message]):
            return err('Заполните все поля формы')
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("INSERT INTO contact_messages (name, contact, message) VALUES (%s,%s,%s)", (name, contact, message))
            conn.commit()

        # Email-уведомление
        html = f"""
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#5c3d2e;border-bottom:2px solid #f0e6d3;padding-bottom:12px">
            ✝ Новое сообщение с сайта
          </h2>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#888;width:120px">Имя</td>
                <td style="padding:8px 0;font-weight:bold">{name}</td></tr>
            <tr><td style="padding:8px 0;color:#888">Контакт</td>
                <td style="padding:8px 0"><a href="mailto:{contact}" style="color:#5c3d2e">{contact}</a></td></tr>
          </table>
          <div style="margin-top:16px;background:#faf7f3;border-left:3px solid #c8956c;padding:12px 16px;color:#444;line-height:1.6">
            {message}
          </div>
          <p style="margin-top:24px;color:#888;font-size:13px">
            Сообщение сохранено в <a href="#" style="color:#5c3d2e">админ-панели</a>.
          </p>
        </div>
        """
        try:
            send_email(f'Сообщение от {name}', html)
        except Exception:
            pass

        return ok({'success': True, 'message': 'Сообщение получено, мы свяжемся с вами'})

    return err('Неизвестный запрос', 404)