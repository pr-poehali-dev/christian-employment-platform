CREATE TABLE IF NOT EXISTS vacancies (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    organization VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    salary_from INTEGER,
    salary_to INTEGER,
    specialty VARCHAR(100) NOT NULL,
    employment_type VARCHAR(100) NOT NULL,
    description TEXT,
    requirements TEXT,
    tag VARCHAR(50) DEFAULT '',
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
)
