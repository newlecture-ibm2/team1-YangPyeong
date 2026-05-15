-- =============================================
-- V6: gov 데이터 다운로드 이력 테이블 추가
-- DownloadHistoryJpaEntity와 매핑
-- =============================================

CREATE TABLE download_history (
    id          BIGSERIAL    PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users(id),
    type        VARCHAR(20)  NOT NULL,                       -- 다운로드 데이터 종류 (cultivation/sales/compare 등)
    format      VARCHAR(10)  NOT NULL,                       -- 파일 포맷 (csv/xlsx 등)
    start_date  DATE,                                        -- 조회 시작일
    end_date    DATE,                                        -- 조회 종료일
    town        VARCHAR(50),                                 -- 지역명
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- 사용자별 최근 이력 조회 인덱스 (findTop10ByUserIdOrderByCreatedAtDesc)
CREATE INDEX idx_download_history_user_created
    ON download_history (user_id, created_at DESC);
