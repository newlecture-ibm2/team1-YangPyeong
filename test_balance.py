import sys
from sqlalchemy import create_engine, text

engine = create_engine("postgresql+psycopg://farm:farmbalance1234!@localhost:5151/farm_db")
with engine.connect() as conn:
    print("balance_data count:", conn.execute(text("SELECT COUNT(*) FROM balance_data")).scalar())
    for row in conn.execute(text("SELECT * FROM balance_data LIMIT 5")):
        print(row)
