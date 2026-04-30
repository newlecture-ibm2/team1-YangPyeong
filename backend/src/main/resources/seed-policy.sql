-- ═══════════════════════════════════════════════════════════════
-- FarmBalance — 정책(policy_data) DDL 확장 + Seed 데이터
-- ═══════════════════════════════════════════════════════════════
-- [주의] TRUNCATE, id 범위 삭제 금지
-- [주의] Seed 데이터는 source='SEED' AND external_id LIKE 'SEED_POLICY_%' 기준으로만 관리
-- ═══════════════════════════════════════════════════════════════

-- ── 1. DDL: policy_data 테이블 확장 ──

-- 정규화 컬럼 추가 (IF NOT EXISTS로 안전)
ALTER TABLE policy_data ADD COLUMN IF NOT EXISTS source VARCHAR(30);
ALTER TABLE policy_data ADD COLUMN IF NOT EXISTS title VARCHAR(500);
ALTER TABLE policy_data ADD COLUMN IF NOT EXISTS organization VARCHAR(200);
ALTER TABLE policy_data ADD COLUMN IF NOT EXISTS region_code VARCHAR(10);
ALTER TABLE policy_data ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE policy_data ADD COLUMN IF NOT EXISTS target VARCHAR(200);
ALTER TABLE policy_data ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE policy_data ADD COLUMN IF NOT EXISTS support_amount VARCHAR(100);
ALTER TABLE policy_data ADD COLUMN IF NOT EXISTS apply_start DATE;
ALTER TABLE policy_data ADD COLUMN IF NOT EXISTS apply_end DATE;
ALTER TABLE policy_data ADD COLUMN IF NOT EXISTS source_url VARCHAR(1000);

-- raw_data 컬럼 추가 (신규 또는 data 컬럼과 별도로 추가)
-- 기존 data 컬럼은 하위 호환을 위해 유지하며, raw_data를 신규 추가합니다.
-- 만약 data → raw_data 마이그레이션이 필요하면 아래 주석을 해제하세요.
ALTER TABLE policy_data ADD COLUMN IF NOT EXISTS raw_data JSONB;

-- [MIGRATION 옵션] 기존 data 컬럼이 있고 raw_data로 이전하려면 아래 주석 해제:
-- DO $$
-- BEGIN
--     IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='policy_data' AND column_name='data')
--        AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='policy_data' AND column_name='raw_data')
--     THEN
--         UPDATE policy_data SET raw_data = data WHERE raw_data IS NULL AND data IS NOT NULL;
--         -- ALTER TABLE policy_data DROP COLUMN data;  -- 완전 삭제 시 주석 해제
--     END IF;
-- END $$;

-- 복합 유니크 제약 (external_id + source)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uk_policy_data_external_source'
    ) THEN
        -- 기존 external_id 단독 유니크 제거 (있으면)
        ALTER TABLE policy_data DROP CONSTRAINT IF EXISTS policy_data_external_id_key;
        ALTER TABLE policy_data ADD CONSTRAINT uk_policy_data_external_source
            UNIQUE (external_id, source);
    END IF;
END $$;

-- 검색 성능 인덱스
CREATE INDEX IF NOT EXISTS idx_policy_data_source ON policy_data(source);
CREATE INDEX IF NOT EXISTS idx_policy_data_region_code ON policy_data(region_code);
CREATE INDEX IF NOT EXISTS idx_policy_data_category ON policy_data(category);
CREATE INDEX IF NOT EXISTS idx_policy_data_apply_end ON policy_data(apply_end);
CREATE INDEX IF NOT EXISTS idx_policy_data_deleted_at ON policy_data(deleted_at);

-- ── 2. Seed 데이터 (멱등 upsert) ──
-- source='SEED' AND external_id LIKE 'SEED_POLICY_%' 기준으로만 삭제
-- id 범위 삭제 금지, TRUNCATE 금지
DELETE FROM policy_data
WHERE source = 'SEED' AND external_id LIKE 'SEED_POLICY_%';

-- ── 3. Seed 데이터 삽입 (15건) ──
INSERT INTO policy_data (external_id, source, title, organization, region_code, category, target, content, support_amount, apply_start, apply_end, source_url, raw_data, fetched_at, created_at, updated_at)
VALUES
('SEED_POLICY_001', 'SEED',
 '청년 농업인 영농 정착 지원사업',
 '양평군청 농업정책과',
 '4183', '청년농', '만 18세~40세 청년 농업인',
 '영농 정착 초기 3년간 월 110만원(최대) 지원, 영농기반 구축자금 최대 3억원 융자, 농업 경영체 등록 및 영농교육 이수 필수',
 '월 110만원 (최대 3년)', '2026-03-01', '2026-09-30',
 'https://www.mafra.go.kr/young-farmer',
 '{"policyId":"YF-2026-001","ministry":"농림축산식품부"}',
 NOW(), NOW(), NOW()),

('SEED_POLICY_002', 'SEED',
 '친환경 농업 육성 및 인증 지원사업',
 '경기도 농업기술원',
 '41', '친환경', '친환경 인증 신청 농가',
 '유기농·무농약 인증비 지원(건당 최대 100만원), 친환경 농자재 구입비 보조(50%), 토양개량제 및 생물농약 지원',
 '300만원 (연간)', '2026-01-01', '2026-06-30',
 'https://www.gg.go.kr/eco-farming',
 '{"policyId":"ECO-2026-001","province":"경기도"}',
 NOW(), NOW(), NOW()),

('SEED_POLICY_003', 'SEED',
 '스마트팜 설비 및 ICT 장비 보조사업',
 '농림축산식품부',
 '0000', '스마트팜', '시설원예·축산 농가',
 '환경제어 시스템, 자동 관수장치, CCTV 등 ICT 장비 설치비의 50% 보조(최대 1,000만원), 스마트팜 운영교육 무료 제공',
 '최대 1,000만원', '2026-02-01', '2026-12-31',
 'https://www.smartfarmkorea.net',
 '{"policyId":"SF-2026-001","ministry":"농림축산식품부"}',
 NOW(), NOW(), NOW()),

('SEED_POLICY_004', 'SEED',
 '귀농·귀촌 정착 통합 패키지',
 '양평군청',
 '4183', '귀농귀촌', '귀농·귀촌 이주 계획자 및 5년 이내 귀농인',
 '정착 지원금 700만원, 농지 임차료 지원(연 200만원), 주거 안정자금 융자, 영농 기술교육 프로그램 연계',
 '700만원', '2026-01-15', '2026-08-31',
 'https://www.yangpyeong.go.kr/return-farm',
 '{"policyId":"RF-2026-001","localGov":"양평군"}',
 NOW(), NOW(), NOW()),

('SEED_POLICY_005', 'SEED',
 '농업 기계화 촉진 보조사업',
 '양평군 농업기술센터',
 '4183', '농기계', '등록 농업인',
 '트랙터, 이앙기, 콤바인, 관리기 등 농기계 구입비의 50% 보조(국비 30% + 도비 10% + 군비 10%), 노후 농기계 교체 시 추가 10% 지원',
 '최대 2,000만원', '2026-03-01', '2026-07-31',
 'https://www.yangpyeong.go.kr/agri-machine',
 '{"policyId":"AM-2026-001","localGov":"양평군"}',
 NOW(), NOW(), NOW()),

('SEED_POLICY_006', 'SEED',
 '농작물 재해보험 보험료 지원',
 '농림축산식품부 / NH농협',
 '0000', '재해보험', '농업경영체 등록 농가',
 '태풍, 우박, 폭우, 가뭄 등 자연재해로 인한 농작물 피해 보상, 보험료의 50% 국비 지원 + 지자체 추가 지원(20%)',
 '보험료 70% 지원', '2026-01-01', '2026-12-31',
 'https://www.nhfarmins.com',
 '{"policyId":"FI-2026-001","ministry":"농림축산식품부"}',
 NOW(), NOW(), NOW()),

('SEED_POLICY_007', 'SEED',
 '시설원예 현대화 지원사업',
 '경기도청 농정국',
 '41', '시설하우스', '시설원예 재배 농가',
 '내재해형 하우스 설치, 보온커튼·순환팬 등 에너지 절감시설, 양액재배시스템 구축비 보조(국비50%+도비20%+자부담30%)',
 '최대 5,000만원', '2026-02-15', '2026-10-31',
 'https://www.gg.go.kr/greenhouse',
 '{"policyId":"GH-2026-001","province":"경기도"}',
 NOW(), NOW(), NOW()),

('SEED_POLICY_008', 'SEED',
 '로컬푸드 직매장 입점 지원',
 '양평군 로컬푸드센터',
 '4183', '로컬푸드', '양평군 소재 소규모 농가',
 '로컬푸드 직매장 입점 수수료 면제(1년), 포장재 및 바코드 제작 지원, GAP 인증 취득비 보조, 온라인 판매 교육',
 '수수료 면제 + 200만원', '2026-04-01', '2026-11-30',
 'https://www.yangpyeong.go.kr/local-food',
 '{"policyId":"LF-2026-001","localGov":"양평군"}',
 NOW(), NOW(), NOW()),

('SEED_POLICY_009', 'SEED',
 '우량 종자·모종 보급 사업',
 '양평군 농업기술센터',
 '4183', '종자', '양평군 등록 농가',
 '벼, 잡곡, 채소류 우량 종자 무상 보급(선착순), 모종(고추·토마토·배추 등) 할인 보급, 종자 품질검사 지원',
 '종자 무상 보급', '2026-02-01', '2026-05-31',
 'https://www.yangpyeong.go.kr/seed-supply',
 '{"policyId":"SS-2026-001","localGov":"양평군"}',
 NOW(), NOW(), NOW()),

('SEED_POLICY_010', 'SEED',
 '농업 전문 교육 및 컨설팅 지원',
 '양평군 농업기술센터',
 '4183', '농업교육', '전 농업인',
 '작물별 재배기술 교육(월 2회), 스마트농업 실습교육(분기별), 병해충 방제 전문가 현장 컨설팅, 농업 경영 실무교육',
 '교육비 전액 무료', '2026-01-01', '2026-12-31',
 'https://www.yangpyeong.go.kr/agri-edu',
 '{"policyId":"AE-2026-001","localGov":"양평군"}',
 NOW(), NOW(), NOW()),

('SEED_POLICY_011', 'SEED',
 '농촌 태양광 발전 설비 보조사업',
 '산업통상자원부 / 한국에너지공단',
 '0000', '에너지', '농업인 및 농업법인',
 '비닐하우스·축사 지붕 태양광 설치비 보조(설치비의 40%), 잉여전력 판매 수익 보장, 탄소중립 포인트 추가 지급',
 '설치비 40% 보조', '2026-03-01', '2026-09-30',
 'https://www.energy.or.kr/solar-farm',
 '{"policyId":"SOL-2026-001","ministry":"산업통상자원부"}',
 NOW(), NOW(), NOW()),

('SEED_POLICY_012', 'SEED',
 '여성농업인 역량 강화 및 복지 지원',
 '농림축산식품부',
 '0000', '복지', '여성 농업인',
 '여성농업인 건강검진 지원, 농작업 편의장비 보조, 여성농업인센터 프로그램 운영, 출산·육아 지원금 지급',
 '최대 250만원', '2026-01-01', '2026-12-31',
 'https://www.mafra.go.kr/women-farmer',
 '{"policyId":"WF-2026-001","ministry":"농림축산식품부"}',
 NOW(), NOW(), NOW()),

('SEED_POLICY_013', 'SEED',
 '농산물 6차산업 가공 창업 지원',
 '경기도 농업기술원',
 '41', '가공창업', '농업 경영체 등록 농가 및 예비 창업자',
 '농산물 가공시설 설치비 보조(최대 3,000만원), 식품 위생 인허가 컨설팅, 브랜드·패키지 디자인 지원, 온라인 판로 연계',
 '최대 3,000만원', '2026-04-01', '2026-10-31',
 'https://www.gg.go.kr/6th-industry',
 '{"policyId":"6I-2026-001","province":"경기도"}',
 NOW(), NOW(), NOW()),

('SEED_POLICY_014', 'SEED',
 '친환경 축산 농가 전환 지원사업',
 '양평군청 축산과',
 '4183', '축산', '양평군 축산 농가',
 '동물복지 인증 취득비 지원, 방목장 설치비 보조, 가축분뇨 자원화시설 지원, 항생제 저감 사양관리 컨설팅',
 '최대 1,500만원', '2026-02-01', '2026-08-31',
 'https://www.yangpyeong.go.kr/eco-livestock',
 '{"policyId":"EL-2026-001","localGov":"양평군"}',
 NOW(), NOW(), NOW()),

('SEED_POLICY_015', 'SEED',
 '농업인 안전재해 공제 보험료 지원',
 '농업안전보건원',
 '0000', '안전', '농업경영체 등록 농업인',
 '농작업 중 상해·질병 보장 공제 보험료의 50% 지원, 농기계 사고 특약 추가 보장, 산재 미적용 농업인 안전망 확대',
 '보험료 50% 지원', '2026-01-01', '2026-12-31',
 'https://www.rda.go.kr/safety',
 '{"policyId":"AS-2026-001","ministry":"농업안전보건원"}',
 NOW(), NOW(), NOW());
