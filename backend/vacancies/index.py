"""
API для работы с вакансиями: получение списка, создание, отклик на вакансию.
"""
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')

    # POST /respond — отклик на вакансию
    if method == 'POST' and path.endswith('/respond'):
        body = json.loads(event.get('body') or '{}')
        vacancy_id = body.get('vacancy_id')
        name = body.get('name', '').strip()
        contact = body.get('contact', '').strip()
        message = body.get('message', '').strip()

        if not all([vacancy_id, name, contact]):
            return {
                'statusCode': 400,
                'headers': CORS_HEADERS,
                'body': json.dumps({'error': 'Заполните все обязательные поля'})
            }

        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO vacancy_responses (vacancy_id, name, contact, message) VALUES (%s, %s, %s, %s)",
                    (vacancy_id, name, contact, message)
                )
            conn.commit()

        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({'success': True, 'message': 'Отклик отправлен'})
        }

    # POST / — создать вакансию
    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        required = ['title', 'organization', 'city', 'specialty', 'employment_type']
        for field in required:
            if not body.get(field, '').strip():
                return {
                    'statusCode': 400,
                    'headers': CORS_HEADERS,
                    'body': json.dumps({'error': f'Поле {field} обязательно'})
                }

        with get_conn() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """INSERT INTO vacancies
                       (title, organization, city, salary_from, salary_to, specialty,
                        employment_type, description, requirements, tag, contact_email, contact_phone)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                       RETURNING id""",
                    (
                        body['title'], body['organization'], body['city'],
                        body.get('salary_from'), body.get('salary_to'),
                        body['specialty'], body['employment_type'],
                        body.get('description', ''), body.get('requirements', ''),
                        body.get('tag', ''), body.get('contact_email', ''),
                        body.get('contact_phone', '')
                    )
                )
                row = cur.fetchone()
            conn.commit()

        return {
            'statusCode': 201,
            'headers': CORS_HEADERS,
            'body': json.dumps({'success': True, 'id': row['id']})
        }

    # GET / — список вакансий с фильтрами
    params = event.get('queryStringParameters') or {}
    specialty = params.get('specialty', '')
    city = params.get('city', '')
    salary_min = params.get('salary_min', '')
    salary_max = params.get('salary_max', '')
    search = params.get('search', '')

    query = "SELECT * FROM vacancies WHERE is_active = TRUE"
    args = []

    if specialty:
        query += " AND specialty = %s"
        args.append(specialty)
    if city:
        query += " AND city = %s"
        args.append(city)
    if salary_min:
        query += " AND salary_to >= %s"
        args.append(int(salary_min))
    if salary_max:
        query += " AND salary_from <= %s"
        args.append(int(salary_max))
    if search:
        query += " AND (LOWER(title) LIKE %s OR LOWER(organization) LIKE %s)"
        args.append(f'%{search.lower()}%')
        args.append(f'%{search.lower()}%')

    query += " ORDER BY created_at DESC"

    with get_conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, args)
            rows = cur.fetchall()

    vacancies = []
    for r in rows:
        v = dict(r)
        v['created_at'] = str(v['created_at'])
        salary_parts = []
        if v['salary_from']:
            salary_parts.append(f"{v['salary_from']:,}".replace(',', ' '))
        if v['salary_to']:
            salary_parts.append(f"{v['salary_to']:,}".replace(',', ' '))
        v['salary'] = ' – '.join(salary_parts) + ' ₽' if salary_parts else 'По договорённости'
        vacancies.append(v)

    return {
        'statusCode': 200,
        'headers': CORS_HEADERS,
        'body': json.dumps({'vacancies': vacancies, 'total': len(vacancies)}, ensure_ascii=False)
    }
