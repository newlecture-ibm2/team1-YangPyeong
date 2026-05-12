-- ==========================================
-- GraphRAG-lite 테이블을 graph 전용 schema로 이동
-- public schema의 운영 테이블과 AI 분석용 graph 테이블을 분리한다.
-- ==========================================

-- 1. graph schema 생성
CREATE SCHEMA IF NOT EXISTS graph;

-- 2. public.graph_relation을 graph schema로 이동 (FK가 graph_entity를 참조하므로 먼저 이동)
DO $$
BEGIN
    -- public.graph_relation이 존재하고, graph.graph_relation은 아직 없을 때만 이동
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'graph_relation')
       AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'graph' AND tablename = 'graph_relation') THEN
        ALTER TABLE public.graph_relation SET SCHEMA graph;
        RAISE NOTICE 'public.graph_relation → graph.graph_relation 이동 완료';
    ELSE
        RAISE NOTICE 'graph_relation 이동 건너뜀 (이미 graph schema에 존재하거나 public에 없음)';
    END IF;
END $$;

-- 3. public.graph_entity를 graph schema로 이동
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'graph_entity')
       AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'graph' AND tablename = 'graph_entity') THEN
        ALTER TABLE public.graph_entity SET SCHEMA graph;
        RAISE NOTICE 'public.graph_entity → graph.graph_entity 이동 완료';
    ELSE
        RAISE NOTICE 'graph_entity 이동 건너뜀 (이미 graph schema에 존재하거나 public에 없음)';
    END IF;
END $$;

-- 4. 검증: 이동 결과 확인
-- SELECT schemaname, tablename FROM pg_tables WHERE tablename IN ('graph_entity', 'graph_relation');
-- 기대 결과:
-- graph | graph_entity
-- graph | graph_relation

-- 참고:
-- ALTER TABLE ... SET SCHEMA 는 테이블의 인덱스, 제약 조건(UNIQUE, FK 등),
-- 시퀀스(BIGSERIAL)도 함께 이동시킨다.
-- 따라서 uq_graph_entity, uq_graph_relation, idx_graph_* 인덱스 모두 자동 보존된다.
