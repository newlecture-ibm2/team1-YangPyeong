-- =============================================
-- V17: 사용자 약관 동의 이력 테이블 생성
-- =============================================

CREATE TABLE IF NOT EXISTS user_agreements (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agreement_type  VARCHAR(50) NOT NULL, -- 'TERMS_OF_SERVICE', 'PRIVACY_POLICY', 'MARKETING', etc.
    version         VARCHAR(20) NOT NULL, -- 약관 버전 (예: 'v1.0')
    is_agreed       BOOLEAN NOT NULL,
    agreed_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 성능을 위한 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_user_agreements_user_id ON user_agreements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_agreements_type_user ON user_agreements(agreement_type, user_id);

-- 기존 사용자들에 대해 기본적인 동의 내역이 있다고 가정할 경우 (선택 사항)
-- 여기서는 신규 가입자부터 적용하는 것으로 합니다.
