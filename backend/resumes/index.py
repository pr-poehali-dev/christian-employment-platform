"""
API для работы с резюме: список, создание, получение/обновление своего резюме по токену.
"""
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def ok(data, code=200):
    return {'statusCode': code, 'headers': CORS, 'body': json.dumps(data, ensure_ascii=False, default=str)}

def err(msg, code=400):
    return {'statusCode': code, 'headers': CORS, 'body': json.dumps({'error': msg}, ensure_ascii=False)}

def get_user_by_token(cur, token):
    cur.execute(
        "SELECT u.* FROM users u JOIN user_sessions s ON s.user_id = u.id WHERE s.token = %s AND s.expires_at > NOW()",
        (token,)
    )
    return cur.fetchone()

def format_resume(r):
    rv = dict(r)
    rv['created_at'] = str(rv.get('created_at', ''))
    rv['name'] = f"{rv.get('first_name', '')} {rv.get('last_name', '')}".strip()
    sf = rv.get('salary_from')
    rv['salary'] = f"от {sf:,} ₽".replace(',', ' ') if sf else 'По договорённости'
    exp = rv.get('experience_years', 0) or 0
    rv['exp'] = f"{exp} {'год' if exp == 1 else 'года' if 2 <= exp <= 4 else 'лет'} опыта" if exp else 'Опыт не указан'
    return rv

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    token = (event.get('headers') or {}).get('X-Session-Token', '')
    body = json.loads(event.get('body') or '{}') if method in ('POST', 'PUT') else {}

    # ── GET ?action=mine — моё резюме ──────────────────────────────
    if method == 'GET' and params.get('action') == 'mine':
        if not token:
            return err('Требуется авторизация', 401)
        with get_conn() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                user = get_user_by_token(cur, token)
                if not user:
                    return err('Сессия истекла', 401)
                cur.execute(
                    "SELECT * FROM resumes WHERE user_id = %s ORDER BY created_at DESC LIMIT 1",
                    (user['id'],)
                )
                row = cur.fetchone()
        if not row:
            return ok({'resume': None})
        return ok({'resume': format_resume(row)})

    # ── PUT — обновить своё резюме ─────────────────────────────────
    if method == 'PUT':
        if not token:
            return err('Требуется авторизация', 401)
        with get_conn() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                user = get_user_by_token(cur, token)
                if not user:
                    return err('Сессия истекла', 401)
                rid = body.get('id')
                if not rid:
                    return err('id резюме обязателен')
                cur.execute("SELECT id FROM resumes WHERE id = %s AND user_id = %s", (rid, user['id']))
                if not cur.fetchone():
                    return err('Резюме не найдено', 404)
                allowed = ['title', 'city', 'specialty', 'experience_years', 'salary_from', 'about', 'skills', 'contact_phone', 'is_active']
                updates = {k: body[k] for k in allowed if k in body}
                if updates:
                    set_clause = ', '.join(f"{k}=%s" for k in updates)
                    cur.execute(f"UPDATE resumes SET {set_clause} WHERE id=%s", list(updates.values()) + [rid])
                conn.commit()
        return ok({'success': True})

    # ── POST — создать резюме ──────────────────────────────────────
    if method == 'POST':
        required = ['first_name', 'last_name', 'title', 'city', 'specialty', 'contact_email']
        for field in required:
            if not str(body.get(field, '')).strip():
                return err(f'Поле {field} обязательно')

        # Определяем user_id по токену (если есть)
        user_id = None
        if token:
            with get_conn() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    u = get_user_by_token(cur, token)
                    if u:
                        user_id = u['id']

        with get_conn() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """INSERT INTO resumes
                       (first_name, last_name, title, city, salary_from, specialty,
                        experience_years, about, skills, contact_email, contact_phone, user_id)
                       VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                       RETURNING id""",
                    (
                        body['first_name'], body['last_name'], body['title'],
                        body['city'], body.get('salary_from'),
                        body['specialty'], body.get('experience_years', 0),
                        body.get('about', ''), body.get('skills', ''),
                        body['contact_email'], body.get('contact_phone', ''), user_id
                    )
                )
                row = cur.fetchone()
            conn.commit()
        return ok({'success': True, 'id': row['id']}, 201)

    # ── GET — список с фильтрами ───────────────────────────────────
    specialty = params.get('specialty', '')
    city = params.get('city', '')
    salary_min = params.get('salary_min', '')
    search = params.get('search', '')

    query = "SELECT id, first_name, last_name, title, city, salary_from, specialty, experience_years, about, skills, created_at FROM resumes WHERE is_active = TRUE"
    args = []
    if specialty:
        query += " AND specialty = %s"; args.append(specialty)
    if city:
        query += " AND city = %s"; args.append(city)
    if salary_min:
        query += " AND salary_from >= %s"; args.append(int(salary_min))
    if search:
        query += " AND (LOWER(first_name || ' ' || last_name) LIKE %s OR LOWER(title) LIKE %s)"
        args += [f'%{search.lower()}%', f'%{search.lower()}%']
    query += " ORDER BY created_at DESC"

    with get_conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, args)
            rows = cur.fetchall()

    return ok({'resumes': [format_resume(r) for r in rows], 'total': len(rows)})
