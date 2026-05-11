import sys
from sqlalchemy import create_engine, text

engine = create_engine("postgresql+psycopg://farm:farmbalance1234!@localhost:5151/farm_db")
with engine.connect() as conn:
    print("regions:")
    for row in conn.execute(text("SELECT id, code, name FROM regions LIMIT 5")):
        print(row)
