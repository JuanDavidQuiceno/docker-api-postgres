# Proyecto Docker – Escenario 3

Aplicación con dos contenedores que se comunican entre sí dentro de una red de Docker:

| Servicio | Rol | Imagen base |
|----------|-----|-------------|
| `app` | API REST (Node.js + Express) | `node:22.11-alpine` |
| `db`  | Base de datos PostgreSQL | `postgres:16.4-alpine` |

## Estructura

```
.
├── app/   # Contenedor 1: API
└── db/    # Contenedor 2: base de datos
```

> Documentación en construcción.
