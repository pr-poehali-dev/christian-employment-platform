"""
Защищённый API для администраторской панели.
Аутентификация по паролю через заголовок X-Admin-Password.
"""
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def check_auth(event: dict) -> bool:
    password = os.environ.get('ADMIN_PASSWORD', '')
    if not password:
        return False
    header = event.get('headers', {}).get('X-Admin-Password', '')
    return header == password

def ok(data: dict) -> dict:
    return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(data, ensure_ascii=False, default=str)}

def err(msg: str, code: int = 400) -> dict:
    return {'statusCode': code, 'headers': CORS, 'body': json.dumps({'error': msg}, ensure_ascii=False)}

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    # Проверка пароля
    if not check_auth(event):
        return err('Неверный пароль', 401)

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    section = params.get('section', 'vacancies')
    body = json.loads(event.get('body') or '{}')

    with get_conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:

            # ---- STATS ----
            if section == 'stats':
                cur.execute("SELECT COUNT(*) as cnt FROM vacancies WHERE is_active=TRUE")
                vac_active = cur.fetchone()['cnt']
                cur.execute("SELECT COUNT(*) as cnt FROM vacancies")
                vac_total = cur.fetchone()['cnt']
                cur.execute("SELECT COUNT(*) as cnt FROM resumes WHERE is_active=TRUE")
                res_active = cur.fetchone()['cnt']
                cur.execute("SELECT COUNT(*) as cnt FROM contact_messages WHERE is_read=FALSE")
                msgs_new = cur.fetchone()['cnt']
                cur.execute("SELECT COUNT(*) as cnt FROM vacancy_responses")
                responses = cur.fetchone()['cnt']
                cur.execute("SELECT COUNT(*) as cnt FROM blog_posts WHERE is_published=TRUE")
                posts = cur.fetchone()['cnt']
                return ok({'vac_active': vac_active, 'vac_total': vac_total,
                           'res_active': res_active, 'msgs_new': msgs_new,
                           'responses': responses, 'posts': posts})

            # ---- VACANCIES ----
            if section == 'vacancies':
                if method == 'GET':
                    cur.execute("SELECT * FROM vacancies ORDER BY created_at DESC")
                    rows = [dict(r) for r in cur.fetchall()]
                    return ok({'items': rows})

                if method == 'PUT':
                    vid = body.get('id')
                    is_active = body.get('is_active')
                    if vid is None:
                        return err('id обязателен')
                    cur.execute("UPDATE vacancies SET is_active=%s WHERE id=%s", (is_active, vid))
                    conn.commit()
                    return ok({'success': True})

                if method == 'DELETE':
                    vid = body.get('id')
                    if not vid:
                        return err('id обязателен')
                    cur.execute("UPDATE vacancies SET is_active=FALSE WHERE id=%s", (vid,))
                    conn.commit()
                    return ok({'success': True})

            # ---- RESUMES ----
            if section == 'resumes':
                if method == 'GET':
                    cur.execute("SELECT * FROM resumes ORDER BY created_at DESC")
                    rows = [dict(r) for r in cur.fetchall()]
                    return ok({'items': rows})

                if method == 'PUT':
                    rid = body.get('id')
                    is_active = body.get('is_active')
                    if rid is None:
                        return err('id обязателен')
                    cur.execute("UPDATE resumes SET is_active=%s WHERE id=%s", (is_active, rid))
                    conn.commit()
                    return ok({'success': True})

                if method == 'DELETE':
                    rid = body.get('id')
                    if not rid:
                        return err('id обязателен')
                    cur.execute("UPDATE resumes SET is_active=FALSE WHERE id=%s", (rid,))
                    conn.commit()
                    return ok({'success': True})

            # ---- MESSAGES ----
            if section == 'messages':
                if method == 'GET':
                    cur.execute("SELECT * FROM contact_messages ORDER BY created_at DESC")
                    rows = [dict(r) for r in cur.fetchall()]
                    cur.execute("UPDATE contact_messages SET is_read=TRUE WHERE is_read=FALSE")
                    conn.commit()
                    return ok({'items': rows})

            # ---- RESPONSES ----
            if section == 'responses':
                if method == 'GET':
                    cur.execute("""
                        SELECT vr.*, v.title as vacancy_title, v.organization
                        FROM vacancy_responses vr
                        LEFT JOIN vacancies v ON v.id = vr.vacancy_id
                        ORDER BY vr.created_at DESC
                    """)
                    rows = [dict(r) for r in cur.fetchall()]
                    return ok({'items': rows})

            # ---- BLOG ----
            if section == 'blog':
                if method == 'GET':
                    cur.execute("SELECT * FROM blog_posts ORDER BY created_at DESC")
                    rows = [dict(r) for r in cur.fetchall()]
                    return ok({'items': rows})

                if method == 'POST':
                    import re
                    title = body.get('title', '').strip()
                    content = body.get('content', '').strip()
                    if not title or not content:
                        return err('title и content обязательны')
                    slug = re.sub(r'[^a-z0-9]+', '-', body.get('slug', title).lower()).strip('-')
                    cur.execute(
                        """INSERT INTO blog_posts (title, slug, excerpt, content, tag, author, is_published)
                           VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                        (title, slug, body.get('excerpt', ''), content,
                         body.get('tag', ''), body.get('author', 'Редакция'),
                         body.get('is_published', True))
                    )
                    new_id = cur.fetchone()['id']
                    conn.commit()
                    return ok({'success': True, 'id': new_id})

                if method == 'PUT':
                    pid = body.get('id')
                    if not pid:
                        return err('id обязателен')
                    fields = ['title', 'excerpt', 'content', 'tag', 'author', 'is_published']
                    updates = {k: body[k] for k in fields if k in body}
                    if not updates:
                        return err('Нечего обновлять')
                    set_clause = ', '.join(f"{k}=%s" for k in updates)
                    cur.execute(
                        f"UPDATE blog_posts SET {set_clause}, updated_at=NOW() WHERE id=%s",
                        list(updates.values()) + [pid]
                    )
                    conn.commit()
                    return ok({'success': True})

                if method == 'DELETE':
                    pid = body.get('id')
                    if not pid:
                        return err('id обязателен')
                    cur.execute("UPDATE blog_posts SET is_published=FALSE WHERE id=%s", (pid,))
                    conn.commit()
                    return ok({'success': True})

    return err('Неизвестный раздел', 404)
