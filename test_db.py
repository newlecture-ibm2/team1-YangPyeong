import sys
from sqlalchemy import create_engine, text

engine = create_engine("postgresql+psycopg://farm:farmbalance1234!@localhost:5151/farm_db")
with engine.connect() as conn:
    print("graph_entity count:", conn.execute(text("SELECT COUNT(*) FROM graph_entity")).scalar())
    print("graph_relation count:", conn.execute(text("SELECT COUNT(*) FROM graph_relation")).scalar())
    print("Sample Entities:")
    for row in conn.execute(text("SELECT entity_type, name FROM graph_entity LIMIT 5")):
        print(row)
    print("Sample Relations:")
    for row in conn.execute(text("SELECT relation_type, from_entity_id, to_entity_id FROM graph_relation LIMIT 5")):
        print(row)
    
    # Check regions
    print("Regions in graph_entity:")
    for row in conn.execute(text("SELECT name FROM graph_entity WHERE entity_type='REGION'")):
        print(row)
