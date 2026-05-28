CREATE TABLE IF NOT EXISTS vacancy_responses (
    id SERIAL PRIMARY KEY,
    vacancy_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(255) NOT NULL,
    message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
)
