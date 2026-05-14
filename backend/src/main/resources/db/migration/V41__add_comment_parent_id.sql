-- 댓글 계층 구조를 위한 parent_id 컬럼 추가
ALTER TABLE comments ADD COLUMN parent_id BIGINT;

-- 외래 키 제약 조건 추가 (자기 참조)
ALTER TABLE comments
ADD CONSTRAINT fk_comment_parent
FOREIGN KEY (parent_id) REFERENCES comments(id);

-- 인덱스 추가 (조회 성능 향상)
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
