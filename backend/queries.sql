BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name_user TEXT NOT NULL,
    email_user TEXT NOT NULL UNIQUE,
    password_login TEXT NOT NULL,
    last_login TIMESTAMP DEFAULT NULL,
    reset_token TEXT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMIT;