import sys
from sqlalchemy import create_engine, text

engine = create_engine("postgresql+psycopg://farm:farmbalance1234!@localhost:5151/farm_db")
with engine.connect() as conn:
    print("policy_data.region_code sample:")
    for row in conn.execute(text("SELECT region_code FROM policy_data LIMIT 5")):
        print(row)
