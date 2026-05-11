import sys
from sqlalchemy import create_engine, text

engine = create_engine("postgresql+psycopg://farm:farmbalance1234!@localhost:5151/farm_db")
with engine.connect() as conn:
    with open("../backend/src/main/resources/db/migration/V34__fix_graph_region_joins.sql", "r") as f:
        sql = f.read()
    conn.execute(text(sql))
    conn.commit()
    print("V34 executed successfully")
    
    print("Checking REGION_HAS_CROP relation count:")
    print(conn.execute(text("SELECT COUNT(*) FROM graph_relation WHERE relation_type = 'REGION_HAS_CROP'")).scalar())
    
    print("Checking OBSERVED_IN relation count:")
    print(conn.execute(text("SELECT COUNT(*) FROM graph_relation WHERE relation_type = 'OBSERVED_IN'")).scalar())
