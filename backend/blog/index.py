"""
API для работы со статьями блога: список, одна статья по slug.
"""
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    params = event.get('queryStringParameters') or {}
    slug = params.get('slug', '')

    with get_conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            if slug:
                cur.execute(
                    "SELECT * FROM blog_posts WHERE slug = %s AND is_published = TRUE",
                    (slug,)
                )
                row = cur.fetchone()
                if not row:
                    return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Статья не найдена'})}
                post = dict(row)
                post['created_at'] = str(post['created_at'])
                post['updated_at'] = str(post['updated_at'])
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'post': post}, ensure_ascii=False)}
            else:
                tag = params.get('tag', '')
                query = "SELECT id, title, slug, excerpt, tag, author, created_at FROM blog_posts WHERE is_published = TRUE"
                args = []
                if tag:
                    query += " AND tag = %s"
                    args.append(tag)
                query += " ORDER BY created_at DESC"
                cur.execute(query, args)
                rows = cur.fetchall()
                posts = []
                for r in rows:
                    p = dict(r)
                    p['created_at'] = str(p['created_at'])
                    posts.append(p)
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'posts': posts, 'total': len(posts)}, ensure_ascii=False)}
