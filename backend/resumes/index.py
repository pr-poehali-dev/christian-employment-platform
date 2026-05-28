"""
API для работы с резюме: получение списка и создание нового резюме.
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

    # POST / — создать резюме
    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        required = ['first_name', 'last_name', 'title', 'city', 'specialty', 'contact_email']
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
                    """INSERT INTO resumes
                       (first_name, last_name, title, city, salary_from, specialty,
                        experience_years, about, skills, contact_email, contact_phone)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                       RETURNING id""",
                    (
                        body['first_name'], body['last_name'], body['title'],
                        body['city'], body.get('salary_from'),
                        body['specialty'], body.get('experience_years', 0),
                        body.get('about', ''), body.get('skills', ''),
                        body['contact_email'], body.get('contact_phone', '')
                    )
                )
                row = cur.fetchone()
            conn.commit()

        return {
            'statusCode': 201,
            'headers': CORS_HEADERS,
            'body': json.dumps({'success': True, 'id': row['id']})
        }

    # GET / — список резюме с фильтрами
    params = event.get('queryStringParameters') or {}
    specialty = params.get('specialty', '')
    city = params.get('city', '')
    salary_min = params.get('salary_min', '')
    search = params.get('search', '')

    query = "SELECT id, first_name, last_name, title, city, salary_from, specialty, experience_years, about, skills, created_at FROM resumes WHERE is_active = TRUE"
    args = []

    if specialty:
        query += " AND specialty = %s"
        args.append(specialty)
    if city:
        query += " AND city = %s"
        args.append(city)
    if salary_min:
        query += " AND salary_from >= %s"
        args.append(int(salary_min))
    if search:
        query += " AND (LOWER(first_name || ' ' || last_name) LIKE %s OR LOWER(title) LIKE %s)"
        args.append(f'%{search.lower()}%')
        args.append(f'%{search.lower()}%')

    query += " ORDER BY created_at DESC"

    with get_conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, args)
            rows = cur.fetchall()

    resumes = []
    for r in rows:
        rv = dict(r)
        rv['created_at'] = str(rv['created_at'])
        rv['name'] = f"{rv['first_name']} {rv['last_name']}"
        rv['salary'] = f"от {rv['salary_from']:,} ₽".replace(',', ' ') if rv['salary_from'] else 'По договорённости'
        rv['exp'] = f"{rv['experience_years']} лет опыта" if rv['experience_years'] else 'Опыт не указан'
        resumes.append(rv)

    return {
        'statusCode': 200,
        'headers': CORS_HEADERS,
        'body': json.dumps({'resumes': resumes, 'total': len(resumes)}, ensure_ascii=False)
    }
