import sys
from sqlalchemy import create_engine, text

engine = create_engine("postgresql+psycopg://farm:farmbalance1234!@localhost:5151/farm_db")
with engine.connect() as conn:
    for row in conn.execute(text("SELECT id, entity_key, name FROM graph_entity WHERE entity_type = 'REGION' LIMIT 5")):
        print(row)
