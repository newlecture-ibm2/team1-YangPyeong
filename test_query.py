import sys
from sqlalchemy import create_engine, text

engine = create_engine("postgresql+psycopg://farm:farmbalance1234!@localhost:5151/farm_db")
with engine.connect() as conn:
    query = text("""
        SELECT c.name as crop, 
               rhc.properties->>'balance_status' as status, 
               rhc.properties->>'supply_ratio' as ratio
        FROM graph_entity reg
        JOIN graph_relation rhc ON rhc.from_entity_id = reg.id AND rhc.relation_type = 'REGION_HAS_CROP'
        JOIN graph_entity c ON c.id = rhc.to_entity_id
        WHERE reg.name = :region
    """)
    result = conn.execute(query, {"region": "양평군"})
    rows = result.fetchall()
    print("REGION_HAS_CROP for 양평군:", len(rows))
    for row in rows:
        print(row)
