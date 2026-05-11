import sys
from sqlalchemy import create_engine, text

engine = create_engine("postgresql+psycopg://farm:farmbalance1234!@localhost:5151/farm_db")
with engine.connect() as conn:
    print("Checking balance_data.region_code vs regions.code:")
    for row in conn.execute(text("SELECT b.region_code, r.code FROM balance_data b LEFT JOIN regions r ON b.region_code LIKE r.code || '%' LIMIT 5")):
        print(row)
