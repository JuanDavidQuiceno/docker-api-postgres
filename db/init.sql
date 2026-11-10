-- Se ejecuta automáticamente la primera vez que se crea el volumen de datos
CREATE TABLE IF NOT EXISTS notes (
    id         SERIAL PRIMARY KEY,
    text       TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO notes (text) VALUES ('Nota inicial creada por el script de la base de datos');
