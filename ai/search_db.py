import os
import sys
from sqlalchemy import create_engine, text

# Add parent directory to path to import app config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://farm:farmbalance1234!@db:5432/farm_db")
engine = create_engine(DATABASE_URL)

search_terms = ["3.94", "farmbalance", "http", ".com", ".kr"]

def search_database():
    print("=== DB 전체에서 배포 주소 및 URL 관련 데이터 검색 시작 ===")
    
    with engine.connect() as conn:
        # Get list of all text columns in all tables in public schema
        query = text("""
            SELECT table_name, column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND data_type IN ('character varying', 'text', 'character')
        """)
        columns = conn.execute(query).fetchall()
        
        found_any = False
        for table, col in columns:
            # For each column, check if it contains any of our search terms
            conditions = []
            for term in search_terms:
                conditions.append(f"\"{col}\" ILIKE :term_{term.replace('.', '_')}")
            
            sql = f"SELECT \"{col}\" FROM \"{table}\" WHERE " + " OR ".join(conditions) + " LIMIT 10"
            
            params = {}
            for term in search_terms:
                params[f"term_{term.replace('.', '_')}"] = f"%{term}%"
                
            try:
                result = conn.execute(text(sql), params).fetchall()
                if result:
                    found_any = True
                    print(f"\n[발견] 테이블: {table} | 컬럼: {col}")
                    for row in result:
                        val = str(row[0])
                        # Highlight the matched term
                        print(f"  -> {val[:200]}")
            except Exception as e:
                # Some tables/columns might not exist or be accessible
                pass
                
        if not found_any:
            print("\n❌ DB 전체 텍스트 컬럼에서 배포 주소(3.94.108.113), 'farmbalance', 'http', '.com', '.kr'를 포함하는 유효한 배포 URL 레코드를 찾지 못했습니다.")

if __name__ == "__main__":
    search_database()
