-- Se ejecuta automaticamente la primera vez que se crea el volumen de datos,
-- sobre la base indicada en MYSQL_DATABASE.
CREATE TABLE IF NOT EXISTS notes (
    id         INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    text       TEXT         NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO notes (text) VALUES ('Nota inicial creada por el script de la base de datos');
