-- V25__seed_2024_crop_statistics_to_rag.sql
-- 경기도 양평군 친환경농업과(Eco-friendly Agriculture Division) 공식 2024년 기준 식량작물 생산 통계 텍스트 RAG 적재

DO $$
DECLARE
    v_category_id BIGINT;
    v_user_id BIGINT;
BEGIN
    -- 1. RAG 카테고리 생성 및 조회
    SELECT id INTO v_category_id FROM rag_categories WHERE name = '양평군 농업 통계' LIMIT 1;
    IF v_category_id IS NULL THEN
        INSERT INTO rag_categories (name, description, display_order, is_active, created_at)
        VALUES ('양평군 농업 통계', '양평군 친환경농업과 공식 농산물 생산량 및 재배면적 통계 보고서', 10, TRUE, CURRENT_TIMESTAMP)
        RETURNING id INTO v_category_id;
    END IF;

    -- 2. 담당 유저 조회 (시연농부)
    SELECT id INTO v_user_id FROM users WHERE email = 'farmer1@test.com' LIMIT 1;
    IF v_user_id IS NULL THEN
        SELECT id INTO v_user_id FROM users ORDER BY id ASC LIMIT 1;
    END IF;

    -- 3. 맥류잡곡 RAG 문서 등록
    IF NOT EXISTS (SELECT 1 FROM rag_documents WHERE title = '2024년 양평군 맥류잡곡 생산량 통계') THEN
        INSERT INTO rag_documents (user_id, category_id, title, content_type, text_content, status, created_at)
        VALUES (
            v_user_id,
            v_category_id,
            '2024년 양평군 맥류잡곡 생산량 통계',
            'TEXT',
            E'양평군 친환경농업과 공식 2024년 맥류 및 잡곡 생산 통계 자료입니다.\n\n' ||
            E'[맥류 (Wheat and Barley)]\n' ||
            E'단위 : ha(면적), 톤(생산량), kg/10a(단수)\n' ||
            E'- 겉보리 (Unhulled Barley) 2024년: 면적 4.4 ha, 단수 229.5 kg/10a, 생산량 10.1 톤\n' ||
            E'- 쌀보리 (Naked Barley) 2024년: 면적 3.3 ha, 단수 230.3 kg/10a, 생산량 7.6 톤\n' ||
            E'- 맥류 합계 2024년: 면적 7.7 ha, 생산량 17.7 톤\n\n' ||
            E'[잡곡 (Miscellaneous Grains)]\n' ||
            E'단위 : ha(면적), 톤(생산량), kg/10a(단수)\n' ||
            E'- 옥수수 (Corn) 2024년: 면적 181.4 ha, 단수 544.5 kg/10a, 생산량 987.5 톤\n' ||
            E'- 메밀 (Buckwheat) 2024년: 면적 13.8 ha, 단수 78.3 kg/10a, 생산량 10.8 톤\n' ||
            E'- 기타잡곡 2024년: 면적 11.4 ha, 단수 325.4 kg/10a, 생산량 37.1 톤\n' ||
            E'- 잡곡 합계 2024년: 면적 206.7 ha, 생산량 1,035.4 톤\n\n' ||
            E'※ 출처: 양평군청 친환경농업과 (Eco-friendly Agriculture Division)',
            'ACTIVE',
            CURRENT_TIMESTAMP
        );
    END IF;

    -- 4. 미곡 RAG 문서 등록
    IF NOT EXISTS (SELECT 1 FROM rag_documents WHERE title = '2024년 양평군 미곡 생산량 통계') THEN
        INSERT INTO rag_documents (user_id, category_id, title, content_type, text_content, status, created_at)
        VALUES (
            v_user_id,
            v_category_id,
            '2024년 양평군 미곡 생산량 통계',
            'TEXT',
            E'양평군 친환경농업과 공식 2024년 미곡(벼/쌀) 생산 통계 자료입니다.\n\n' ||
            E'[미곡 (Rice)]\n' ||
            E'단위 : ha(면적), 톤(생산량), kg/10a(단수)\n' ||
            E'- 논벼 (Paddy Rice) 2024년: 면적 2,627.7 ha, 단수 460.3 kg/10a, 생산량 12,094.0 톤\n' ||
            E'- 밭벼 (Upland Rice) 2024년: 면적 0 ha, 생산량 0 톤\n' ||
            E'- 미곡 합계 2024년: 면적 2,627.7 ha, 생산량 12,094.0 톤 (정곡 백미 환산 생산량 기준)\n\n' ||
            E'※ 출처: 양평군청 친환경농업과 (Eco-friendly Agriculture Division)',
            'ACTIVE',
            CURRENT_TIMESTAMP
        );
    END IF;

    -- 5. 식량작물생산량 RAG 문서 등록
    IF NOT EXISTS (SELECT 1 FROM rag_documents WHERE title = '2024년 양평군 식량작물 생산량 총괄 통계') THEN
        INSERT INTO rag_documents (user_id, category_id, title, content_type, text_content, status, created_at)
        VALUES (
            v_user_id,
            v_category_id,
            '2024년 양평군 식량작물 생산량 총괄 통계',
            'TEXT',
            E'양평군 친환경농업과 공식 2024년 식량작물 생산량 총괄(정곡 백미 기준) 통계 자료입니다.\n\n' ||
            E'[식량작물 생산량 총괄 (Production of Food Grain)]\n' ||
            E'단위 : ha(면적), 톤(생산량)\n' ||
            E'- 미곡 (Rice) 2024년: 면적 2,627.7 ha, 생산량 12,094.0 톤\n' ||
            E'- 맥류 (Wheat & Barley) 2024년: 면적 8.0 ha, 생산량 18.0 톤\n' ||
            E'- 잡곡 (Miscellaneous Grains) 2024년: 면적 206.7 ha, 생산량 1,035.4 톤\n' ||
            E'- 두류 (Beans / 콩류) 2024년: 면적 432.9 ha, 생산량 604.3 톤 (단수 환산: 약 139.6 kg/10a)\n' ||
            E'- 서류 (Potatoes / 감자 및 고구마류) 2024년: 면적 230.6 ha, 생산량 3,006.5 톤 (단수 환산: 약 1,303.8 kg/10a)\n' ||
            E'- 식량작물 합계 2024년: 총 면적 3,505.6 ha, 총 생산량 16,757.9 톤\n\n' ||
            E'※ 출처: 양평군청 친환경농업과 (Eco-friendly Agriculture Division)',
            'ACTIVE',
            CURRENT_TIMESTAMP
        );
    END IF;

END $$;
