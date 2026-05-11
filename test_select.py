import sys
from sqlalchemy import create_engine, text

engine = create_engine("postgresql+psycopg://farm:farmbalance1234!@localhost:5151/farm_db")
with engine.connect() as conn:
    print("Checking balance_data to CROP:")
    for row in conn.execute(text("SELECT b.crop_id, g_crop.id FROM balance_data b LEFT JOIN graph_entity g_crop ON g_crop.entity_type = 'CROP' AND g_crop.source_id = b.crop_id LIMIT 5")):
        print(row)
    print("Checking balance_data to REGION:")
    for row in conn.execute(text("SELECT b.region_code, g_region.id FROM balance_data b LEFT JOIN graph_entity g_region ON g_region.entity_type = 'REGION' AND g_region.entity_key = b.region_code LIMIT 5")):
        print(row)
