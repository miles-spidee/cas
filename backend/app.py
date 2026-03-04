from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from backend.database import engine

app = FastAPI(title="MetaView API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/db/tables")
def get_tables():
    """Return list of all table names in the database."""
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    return {"tables": tables}


@app.get("/api/db/tables/{table_name}")
def get_table_data(table_name: str):
    """Return all rows and column names for a given table."""
    inspector = inspect(engine)
    available = inspector.get_table_names()

    if table_name not in available:
        return {"error": f"Table '{table_name}' not found", "columns": [], "rows": []}

    columns_info = inspector.get_columns(table_name)
    column_names = [col["name"] for col in columns_info]

    with engine.connect() as conn:
        result = conn.execute(text(f'SELECT * FROM "{table_name}"'))
        rows = [dict(zip(column_names, row)) for row in result.fetchall()]

    return {"table": table_name, "columns": column_names, "rows": rows, "count": len(rows)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
