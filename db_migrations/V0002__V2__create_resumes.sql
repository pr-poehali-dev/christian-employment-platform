CREATE TABLE IF NOT EXISTS resumes (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    salary_from INTEGER,
    specialty VARCHAR(100) NOT NULL,
    experience_years INTEGER DEFAULT 0,
    about TEXT,
    skills TEXT,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
)
