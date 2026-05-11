import sys
from sqlalchemy import create_engine, text

engine = create_engine("postgresql+psycopg://farm:farmbalance1234!@localhost:5151/farm_db")
with engine.connect() as conn:
    for row in conn.execute(text("SELECT relation_type, count(*) FROM graph_relation GROUP BY relation_type")):
        print(row)
