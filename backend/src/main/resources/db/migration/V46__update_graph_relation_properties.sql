-- V46: graph_relation 테이블의 CULTIVATES 관계 properties에서 status 및 yield_unit 제거
-- (V33 마이그레이션 변경 불가 정책에 따른 후속 조치)

UPDATE graph.graph_relation
SET properties = properties - 'status' - 'yield_unit'
WHERE relation_type = 'CULTIVATES';
