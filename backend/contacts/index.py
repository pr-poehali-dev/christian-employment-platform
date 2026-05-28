"""
API для приёма контактных сообщений с сайта.
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

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        name = body.get('name', '').strip()
        contact = body.get('contact', '').strip()
        message = body.get('message', '').strip()

        if not all([name, contact, message]):
            return {
                'statusCode': 400,
                'headers': CORS_HEADERS,
                'body': json.dumps({'error': 'Заполните все поля формы'}, ensure_ascii=False)
            }

        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO contact_messages (name, contact, message) VALUES (%s, %s, %s)",
                    (name, contact, message)
                )
            conn.commit()

        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({'success': True, 'message': 'Сообщение получено, мы свяжемся с вами'}, ensure_ascii=False)
        }

    return {
        'statusCode': 405,
        'headers': CORS_HEADERS,
        'body': json.dumps({'error': 'Method not allowed'})
    }
