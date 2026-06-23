"""
API вакансий: список, создание, отклик с уведомлением на email.
"""
import json
import os
import smtplib
import psycopg2
from psycopg2.extras import RealDictCursor
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def send_email(subject: str, html: str):
    smtp_from = os.environ.get('SMTP_FROM', '')
    smtp_pass = os.environ.get('SMTP_PASSWORD', '')
    notify_to = os.environ.get('NOTIFY_EMAIL', '')
    if not all([smtp_from, smtp_pass, notify_to]):
        return  # Секреты не заданы — пропускаем

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = f'Благодать <{smtp_from}>'
    msg['To'] = notify_to
    msg.attach(MIMEText(html, 'html', 'utf-8'))

    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as s:
        s.login(smtp_from, smtp_pass)
        s.sendmail(smtp_from, notify_to, msg.as_string())

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')

    # ── POST /respond — отклик ──────────────────────────────────
    if method == 'POST' and path.endswith('/respond'):
        body = json.loads(event.get('body') or '{}')
        vacancy_id = body.get('vacancy_id')
        name = body.get('name', '').strip()
        contact = body.get('contact', '').strip()
        message = body.get('message', '').strip()

        if not all([vacancy_id, name, contact]):
            return {'statusCode': 400, 'headers': CORS,
                    'body': json.dumps({'error': 'Заполните все обязательные поля'})}

        # Сохраняем в БД
        vacancy_title = ''
        vacancy_org = ''
        with get_conn() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    "INSERT INTO vacancy_responses (vacancy_id, name, contact, message) VALUES (%s,%s,%s,%s)",
                    (vacancy_id, name, contact, message)
                )
                # Берём название вакансии для письма
                cur.execute("SELECT title, organization FROM vacancies WHERE id=%s", (vacancy_id,))
                vac = cur.fetchone()
                if vac:
                    vacancy_title = vac['title']
                    vacancy_org = vac['organization']
            conn.commit()

        # Отправляем email
        html = f"""
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#5c3d2e;border-bottom:2px solid #f0e6d3;padding-bottom:12px">
            ✝ Новый отклик на вакансию
          </h2>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#888;width:140px">Вакансия</td>
                <td style="padding:8px 0;font-weight:bold">{vacancy_title} — {vacancy_org}</td></tr>
            <tr><td style="padding:8px 0;color:#888">Соискатель</td>
                <td style="padding:8px 0">{name}</td></tr>
            <tr><td style="padding:8px 0;color:#888">Контакт</td>
                <td style="padding:8px 0"><a href="mailto:{contact}" style="color:#5c3d2e">{contact}</a></td></tr>
          </table>
          {f'<div style="margin-top:16px;background:#faf7f3;border-left:3px solid #c8956c;padding:12px 16px;color:#444">{message}</div>' if message else ''}
          <p style="margin-top:24px;color:#888;font-size:13px">
            Управляйте откликами в <a href="#" style="color:#5c3d2e">админ-панели</a>.
          </p>
        </div>
        """
        try:
            send_email(f'Новый отклик: {vacancy_title}', html)
        except Exception:
            pass  # Не блокируем ответ при ошибке письма

        return {'statusCode': 200, 'headers': CORS,
                'body': json.dumps({'success': True, 'message': 'Отклик отправлен'}, ensure_ascii=False)}

    # ── POST / — создать вакансию ────────────────────────────────
    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        required = ['title', 'organization', 'city', 'specialty', 'employment_type']
        for field in required:
            if not body.get(field, '').strip():
                return {'statusCode': 400, 'headers': CORS,
                        'body': json.dumps({'error': f'Поле {field} обязательно'})}

        with get_conn() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """INSERT INTO vacancies
                       (title, organization, city, salary_from, salary_to, specialty,
                        employment_type, description, requirements, tag, contact_email, contact_phone)
                       VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
                    (body['title'], body['organization'], body['city'],
                     body.get('salary_from'), body.get('salary_to'),
                     body['specialty'], body['employment_type'],
                     body.get('description', ''), body.get('requirements', ''),
                     body.get('tag', ''), body.get('contact_email', ''),
                     body.get('contact_phone', ''))
                )
                row = cur.fetchone()
            conn.commit()

        # Уведомление о новой вакансии
        html = f"""
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#5c3d2e;border-bottom:2px solid #f0e6d3;padding-bottom:12px">
            ✝ Новая вакансия на сайте
          </h2>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#888;width:140px">Название</td>
                <td style="padding:8px 0;font-weight:bold">{body['title']}</td></tr>
            <tr><td style="padding:8px 0;color:#888">Организация</td>
                <td style="padding:8px 0">{body['organization']}</td></tr>
            <tr><td style="padding:8px 0;color:#888">Город</td>
                <td style="padding:8px 0">{body['city']}</td></tr>
            <tr><td style="padding:8px 0;color:#888">Специальность</td>
                <td style="padding:8px 0">{body['specialty']}</td></tr>
            <tr><td style="padding:8px 0;color:#888">Контакт</td>
                <td style="padding:8px 0">{body.get('contact_email','')}</td></tr>
          </table>
        </div>
        """
        try:
            send_email(f'Новая вакансия: {body["title"]}', html)
        except Exception:
            pass

        return {'statusCode': 201, 'headers': CORS,
                'body': json.dumps({'success': True, 'id': row['id']})}

    # ── GET / — список вакансий ──────────────────────────────────
    params = event.get('queryStringParameters') or {}
    specialty = params.get('specialty', '')
    city = params.get('city', '')
    salary_min = params.get('salary_min', '')
    salary_max = params.get('salary_max', '')
    search = params.get('search', '')

    query = "SELECT * FROM vacancies WHERE is_active = TRUE"
    args = []
    if specialty:
        query += " AND specialty = %s"; args.append(specialty)
    if city:
        query += " AND city = %s"; args.append(city)
    if salary_min:
        query += " AND salary_to >= %s"; args.append(int(salary_min))
    if salary_max:
        query += " AND salary_from <= %s"; args.append(int(salary_max))
    if search:
        query += " AND (LOWER(title) LIKE %s OR LOWER(organization) LIKE %s)"
        args += [f'%{search.lower()}%', f'%{search.lower()}%']
    query += " ORDER BY created_at DESC"

    with get_conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, args)
            rows = cur.fetchall()

    vacancies = []
    for r in rows:
        v = dict(r)
        v['created_at'] = str(v['created_at'])
        parts = []
        if v['salary_from']: parts.append(f"{v['salary_from']:,}".replace(',', ' '))
        if v['salary_to']:   parts.append(f"{v['salary_to']:,}".replace(',', ' '))
        v['salary'] = ' – '.join(parts) + ' ₽' if parts else 'По договорённости'
        vacancies.append(v)

    return {'statusCode': 200, 'headers': CORS,
            'body': json.dumps({'vacancies': vacancies, 'total': len(vacancies)}, ensure_ascii=False)}
