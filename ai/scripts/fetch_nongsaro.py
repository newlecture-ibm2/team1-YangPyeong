"""
농사로 Open API 데이터 수집 → Flyway SQL 파일 자동 생성 스크립트

사용법:
    # 전체 수집
    python ai/scripts/fetch_nongsaro.py

    # 특정 서비스만
    python ai/scripts/fetch_nongsaro.py --service variety
    python ai/scripts/fetch_nongsaro.py --service schedule
    python ai/scripts/fetch_nongsaro.py --service pest
    python ai/scripts/fetch_nongsaro.py --service disaster
    python ai/scripts/fetch_nongsaro.py --service eco
    python ai/scripts/fetch_nongsaro.py --service advanced
    python ai/scripts/fetch_nongsaro.py --service cropebook

필수 패키지:
    pip install xmltodict httpx python-dotenv tqdm
"""

import os
import sys
import json
import time
import argparse
from datetime import datetime
from pathlib import Path
from typing import Optional

import httpx
import xmltodict
from dotenv import load_dotenv
from tqdm import tqdm

# ── 경로 설정 ──
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(ROOT_DIR / ".env")

BASE_URL = "http://api.nongsaro.go.kr/service"
MIGRATION_DIR = ROOT_DIR / "backend" / "src" / "main" / "resources" / "db" / "migration"

# API 호출 간 대기 시간 (초) — Rate Limit 방지
REQUEST_DELAY = 0.3


# ══════════════════════════════════════════════
# 공통 유틸리티
# ══════════════════════════════════════════════

def get_api_key(service: str) -> str:
    """서비스별 API 키 반환"""
    if service == "cropEbook":
        return os.getenv("NONGSARO_API_KEY_CROP_EBOOK", "")
    return os.getenv("NONGSARO_API_KEY_DEFAULT", "")


def fetch_xml(service: str, operation: str, params: Optional[dict] = None) -> dict:
    """농사로 API 호출 → XML → dict 변환"""
    url = f"{BASE_URL}/{service}/{operation}"
    query = {"apiKey": get_api_key(service)}
    if params:
        query.update(params)

    resp = httpx.get(url, params=query, timeout=30.0)
    resp.raise_for_status()
    data = xmltodict.parse(resp.text)

    # 에러 체크
    result_code = data.get("response", {}).get("header", {}).get("resultCode", "")
    if result_code != "00":
        msg = data.get("response", {}).get("header", {}).get("resultMsg", "알 수 없는 에러")
        print(f"  ⚠️ API 에러: [{result_code}] {msg}")
        return {}

    time.sleep(REQUEST_DELAY)
    return data


def extract_items(data: dict) -> list[dict]:
    """공통 응답 구조에서 items 추출"""
    if not data:
        return []
    try:
        body = data["response"]["body"]
        if body is None:
            return []
        items_wrapper = body.get("items")
        if items_wrapper is None:
            return []
        items = items_wrapper.get("item", [])
        if items is None:
            return []
        if isinstance(items, dict):
            items = [items]
        return items
    except (KeyError, TypeError, AttributeError):
        return []


def get_total_count(data: dict) -> int:
    """totalCount 추출"""
    try:
        return int(data["response"]["body"]["items"]["totalCount"])
    except (KeyError, TypeError, ValueError):
        return 0


def escape_sql(value: object) -> str:
    """SQL 값 이스케이프 (None → NULL, 문자열 → 따옴표 처리)"""
    if value is None:
        return "NULL"
    s = str(value).replace("'", "''")
    return f"'{s}'"


def fetch_all_pages(service: str, operation: str, extra_params: Optional[dict] = None) -> list[dict]:
    """페이징하여 전체 데이터 수집"""
    all_items: list[dict] = []
    page = 1
    total = None

    while True:
        params = {"pageNo": str(page), "numOfRows": "100"}
        if extra_params:
            params.update(extra_params)

        data = fetch_xml(service, operation, params)
        items = extract_items(data)

        if not items:
            break

        all_items.extend(items)

        if total is None:
            total = get_total_count(data)

        if total and len(all_items) >= total:
            break

        page += 1

    return all_items


# ══════════════════════════════════════════════
# 서비스별 수집 + SQL 생성 함수
# ══════════════════════════════════════════════

def generate_variety_sql() -> None:
    """품종 정보 수집 → SQL 생성"""
    print("\n📦 [1/7] 품종 정보 (varietyInfo) 수집 중...")
    items = fetch_all_pages("varietyInfo", "varietyList")
    print(f"  수집 완료: {len(items)}건")

    if not items:
        print("  ⚠️ 데이터 없음, 건너뜁니다.")
        return

    sql_path = MIGRATION_DIR / "V10_1__seed_nongsaro_varieties.sql"
    with open(sql_path, "w", encoding="utf-8") as f:
        f.write("-- 농사로 품종 정보 시드 데이터 (자동 생성)\n")
        f.write(f"-- 생성일: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")
        f.write(f"-- 총 {len(items)}건\n\n")

        for item in tqdm(items, desc="  SQL 생성"):
            raw = escape_sql(json.dumps(item, ensure_ascii=False))
            f.write(
                f"INSERT INTO nongsaro_varieties "
                f"(cntnts_no, variety_name, crop_name, category_code, "
                f"characteristics, breeding_inst, breeding_year, "
                f"image_url, attachment_url, file_name, raw_data) "
                f"VALUES ("
                f"{escape_sql(item.get('cntntsNo'))}, "
                f"{escape_sql(item.get('cntntsSj'))}, "
                f"{escape_sql(item.get('svcCodeNm'))}, "
                f"{escape_sql(item.get('upperSvcCode'))}, "
                f"{escape_sql(item.get('mainChartrInfo'))}, "
                f"{escape_sql(item.get('unbrngInsttInfo'))}, "
                f"{escape_sql(item.get('unbrngYear'))}, "
                f"{escape_sql(item.get('imgFileLink'))}, "
                f"{escape_sql(item.get('atchFileLink'))}, "
                f"{escape_sql(item.get('orginlFileNm'))}, "
                f"{raw}::jsonb"
                f") ON CONFLICT (cntnts_no) DO NOTHING;\n"
            )

    print(f"  ✅ 저장: {sql_path.name}")


def generate_schedule_sql() -> None:
    """농작업일정 시기별 수집 → SQL 생성"""
    print("\n📦 [2/7] 농작업일정 (farmWorkingPlanNew) 수집 중...")

    # 1단계: 품목코드 그룹 조회
    grp_data = fetch_xml("farmWorkingPlanNew", "workScheduleGrpList")
    groups = extract_items(grp_data)
    print(f"  품목그룹: {len(groups)}개")

    all_records: list[dict] = []

    for group in groups:
        code = group.get("kidofcomdtySeCode", "")
        name = group.get("codeNm", "")

        # 2단계: 품목별 일정 목록
        lst_data = fetch_xml("farmWorkingPlanNew", "workScheduleLst", {
            "kidofcomdtySeCode": code
        })
        schedules = extract_items(lst_data)

        for schedule in schedules:
            cntnts_no = schedule.get("cntntsNo", "")
            sj = schedule.get("sj", "")

            # 3단계: 시기별 상세
            era_data = fetch_xml("farmWorkingPlanNew", "workScheduleEraInfoJsonLst", {
                "cntntsNo": cntnts_no
            })
            era_items = extract_items(era_data)

            for era in era_items:
                all_records.append({
                    "cntnts_no": cntnts_no,
                    "crop_code": code,
                    "crop_name": name,
                    "farm_work_type": sj,
                    "info_type_code": era.get("infoSeCode", ""),
                    "info_type_name": era.get("infoSeCodeNm", ""),
                    "operation_name": era.get("opertNm", ""),
                    "start_month": era.get("beginMon"),
                    "start_period": era.get("beginEra"),
                    "end_month": era.get("endMon"),
                    "end_period": era.get("endEra"),
                    "duration_months": era.get("totalMon"),
                    "video_url": era.get("videoUrl"),
                    "raw": era,
                })

    print(f"  수집 완료: {len(all_records)}건")

    if not all_records:
        print("  ⚠️ 데이터 없음, 건너뜁니다.")
        return

    sql_path = MIGRATION_DIR / "V10_2__seed_nongsaro_schedules.sql"
    with open(sql_path, "w", encoding="utf-8") as f:
        f.write("-- 농사로 농작업일정 시드 데이터 (자동 생성)\n")
        f.write(f"-- 생성일: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")
        f.write(f"-- 총 {len(all_records)}건\n\n")

        for r in tqdm(all_records, desc="  SQL 생성"):
            raw = escape_sql(json.dumps(r["raw"], ensure_ascii=False))
            f.write(
                f"INSERT INTO nongsaro_farm_schedules "
                f"(cntnts_no, crop_code, crop_name, farm_work_type, "
                f"info_type_code, info_type_name, operation_name, "
                f"start_month, start_period, end_month, end_period, "
                f"duration_months, video_url, raw_data) "
                f"VALUES ("
                f"{escape_sql(r['cntnts_no'])}, "
                f"{escape_sql(r['crop_code'])}, "
                f"{escape_sql(r['crop_name'])}, "
                f"{escape_sql(r['farm_work_type'])}, "
                f"{escape_sql(r['info_type_code'])}, "
                f"{escape_sql(r['info_type_name'])}, "
                f"{escape_sql(r['operation_name'])}, "
                f"{escape_sql(r['start_month'])}, "
                f"{escape_sql(r['start_period'])}, "
                f"{escape_sql(r['end_month'])}, "
                f"{escape_sql(r['end_period'])}, "
                f"{escape_sql(r['duration_months'])}, "
                f"{escape_sql(r['video_url'])}, "
                f"{raw}::jsonb"
                f") ON CONFLICT (cntnts_no, operation_name, start_month) DO NOTHING;\n"
            )

    print(f"  ✅ 저장: {sql_path.name}")


def generate_pest_sql() -> None:
    """병해충 발생정보 수집 → SQL 생성"""
    print("\n📦 [3/7] 병해충 발생정보 (dbyhsCccrrncInfo) 수집 중...")
    items = fetch_all_pages("dbyhsCccrrncInfo", "dbyhsCccrrncInfoList")
    print(f"  수집 완료: {len(items)}건")

    if not items:
        return

    sql_path = MIGRATION_DIR / "V10_3__seed_nongsaro_pest.sql"
    with open(sql_path, "w", encoding="utf-8") as f:
        f.write("-- 농사로 병해충 발생정보 시드 데이터 (자동 생성)\n")
        f.write(f"-- 생성일: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")
        f.write(f"-- 총 {len(items)}건\n\n")

        for item in tqdm(items, desc="  SQL 생성"):
            f.write(
                f"INSERT INTO pest_occurrence_reports "
                f"(cntnts_no, title, report_year, pdf_url, file_name) "
                f"VALUES ("
                f"{escape_sql(item.get('cntntsNo'))}, "
                f"{escape_sql(item.get('cntntsSj'))}, "
                f"{escape_sql(item.get('pblicteYear'))}, "
                f"{escape_sql(item.get('downFile'))}, "
                f"{escape_sql(item.get('rtnOrginlFileNm'))}"
                f") ON CONFLICT (cntnts_no) DO NOTHING;\n"
            )

    print(f"  ✅ 저장: {sql_path.name}")


def _parse_disaster_type(title: str) -> Optional[str]:
    """제목에서 재해 유형을 파싱합니다."""
    if not title:
        return None
    if "고온해" in title or "폭염" in title:
        return "고온해(폭염)"
    if "저온해" in title or "동해" in title:
        return "저온해(동해)"
    if "홍수" in title:
        return "홍수해"
    if "태풍" in title:
        return "태풍"
    if "호우" in title or "집중호우" in title or "장마" in title:
        return "호우"
    if "가뭄" in title:
        return "가뭄"
    if "우박" in title:
        return "우박"
    if "냉해" in title:
        return "냉해"
    if "재해예방" in title or "재해 예방" in title or "자연재해" in title or "농업재해" in title:
        return "재해예방"
    return "기타"


def _build_file_url(item: dict) -> Optional[str]:
    """농사로 첨부파일 다운로드 URL을 조합합니다."""
    file_cours = item.get("rtnFileCours")
    file_nm = item.get("rtnStreFileNm")
    if file_cours and file_nm:
        return f"https://www.nongsaro.go.kr/{file_cours}/{file_nm}"
    return None


def generate_disaster_sql() -> None:
    """재해예방정보 수집 → SQL 생성"""
    print("\n📦 [4/7] 재해예방정보 (frcDsstrPrevnt) 수집 중...")
    items = fetch_all_pages("frcDsstrPrevnt", "frcDsstrPrevntLst")
    print(f"  수집 완료: {len(items)}건")

    if not items:
        return

    sql_path = MIGRATION_DIR / "V10_4__seed_nongsaro_disaster.sql"
    with open(sql_path, "w", encoding="utf-8") as f:
        f.write("-- 농사로 재해예방정보 시드 데이터 (자동 생성)\n")
        f.write(f"-- 생성일: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")
        f.write(f"-- 총 {len(items)}건\n\n")

        for item in tqdm(items, desc="  SQL 생성"):
            raw = escape_sql(json.dumps(item, ensure_ascii=False))
            title = item.get("cntntsSj", "")
            disaster_type = _parse_disaster_type(title)
            file_url = _build_file_url(item)

            f.write(
                f"INSERT INTO nongsaro_disaster_prevention "
                f"(cntnts_no, title, disaster_type, image_url, raw_data) "
                f"VALUES ("
                f"{escape_sql(item.get('cntntsNo'))}, "
                f"{escape_sql(title)}, "
                f"{escape_sql(disaster_type)}, "
                f"{escape_sql(file_url)}, "
                f"{raw}::jsonb"
                f") ON CONFLICT (cntnts_no) DO NOTHING;\n"
            )

    print(f"  ✅ 저장: {sql_path.name}")


def generate_eco_sql() -> None:
    """친환경 우수사례 수집 → SQL 생성"""
    print("\n📦 [5/7] 친환경 우수사례 (evrfrndFarmng) 수집 중...")
    items = fetch_all_pages("evrfrndFarmng", "evrfrndFarmngLst")
    print(f"  수집 완료: {len(items)}건")

    if not items:
        return

    sql_path = MIGRATION_DIR / "V10_5__seed_nongsaro_eco.sql"
    with open(sql_path, "w", encoding="utf-8") as f:
        f.write("-- 농사로 친환경 우수사례 시드 데이터 (자동 생성)\n")
        f.write(f"-- 생성일: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")
        f.write(f"-- 총 {len(items)}건\n\n")

        for item in tqdm(items, desc="  SQL 생성"):
            raw = escape_sql(json.dumps(item, ensure_ascii=False))
            f.write(
                f"INSERT INTO nongsaro_eco_farming "
                f"(cntnts_no, title, region_name, link_url, file_name, raw_data) "
                f"VALUES ("
                f"{escape_sql(item.get('cntntsNo'))}, "
                f"{escape_sql(item.get('cntntsSj'))}, "
                f"{escape_sql(item.get('areaNm'))}, "
                f"{escape_sql(item.get('linkUrl'))}, "
                f"{escape_sql(item.get('rtnOrginlFileNm'))}, "
                f"{raw}::jsonb"
                f") ON CONFLICT (cntnts_no) DO NOTHING;\n"
            )

    print(f"  ✅ 저장: {sql_path.name}")


def generate_advanced_sql() -> None:
    """첨단농업기술 수집 → SQL 생성"""
    print("\n📦 [6/7] 첨단농업기술 (uptodeFarmngTchnlgyInfo) 수집 중...")
    items = fetch_all_pages("uptodeFarmngTchnlgyInfo", "uptodeFarmngTchnlgyInfoLst")
    print(f"  수집 완료: {len(items)}건")

    if not items:
        return

    sql_path = MIGRATION_DIR / "V10_6__seed_nongsaro_advanced.sql"
    with open(sql_path, "w", encoding="utf-8") as f:
        f.write("-- 농사로 첨단농업기술 시드 데이터 (자동 생성)\n")
        f.write(f"-- 생성일: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")
        f.write(f"-- 총 {len(items)}건\n\n")

        for item in tqdm(items, desc="  SQL 생성"):
            raw = escape_sql(json.dumps(item, ensure_ascii=False))
            f.write(
                f"INSERT INTO nongsaro_advanced_tech "
                f"(cntnts_no, title, content, image_url, video_url, raw_data) "
                f"VALUES ("
                f"{escape_sql(item.get('classSubIdx'))}, "
                f"{escape_sql(item.get('classSubTitle'))}, "
                f"{escape_sql(item.get('classSubContents'))}, "
                f"NULL, "
                f"{escape_sql(item.get('classSubMovieUrl'))}, "
                f"{raw}::jsonb"
                f") ON CONFLICT (cntnts_no) DO NOTHING;\n"
            )

    print(f"  ✅ 저장: {sql_path.name}")


def generate_cropebook_sql() -> None:
    """작물별 재배기술 (cropEbook) 수집 → SQL 생성"""
    print("\n📦 [7/7] 작물별 재배기술 (cropEbook) 수집 중...")

    # 1단계: 대분류
    main_data = fetch_xml("cropEbook", "mainCategoryList")
    categories = extract_items(main_data)
    print(f"  대분류: {len(categories)}개")

    all_ebooks: list[dict] = []

    for cat in tqdm(categories, desc="  대분류"):
        main_code = cat.get("mainCategoryCode", "")

        # 2단계: 중분류
        mid_data = fetch_xml("cropEbook", "middleCategoryList", {
            "mainCategoryCode": main_code
        })
        mid_items = extract_items(mid_data)

        for mid in mid_items:
            mid_code = mid.get("middleCategoryCode", "")

            # 3단계: 소분류 (작물)
            sub_data = fetch_xml("cropEbook", "subCategoryList", {
                "middleCategoryCode": mid_code
            })
            sub_items = extract_items(sub_data)

            for sub in sub_items:
                crop_code = sub.get("subCategoryCode", "")
                crop_name = sub.get("subCategoryNm", "")

                # 4단계: ebook 목록
                ebook_data = fetch_xml("cropEbook", "ebookList", {
                    "subCategoryCode": crop_code
                })
                ebook_items = extract_items(ebook_data)

                for ebook in ebook_items:
                    all_ebooks.append({
                        "sub_category_code": crop_code,
                        "sub_category_nm": crop_name,
                        "ebook_code": ebook.get("ebookCode", ""),
                        "ebook_name": ebook.get("ebookName", ""),
                        "ebook_pdf_url": ebook.get("cropsEbookFile", ""),
                        "ebook_img_url": ebook.get("ebookImg", ""),
                        "raw": ebook,
                    })

    print(f"  수집 완료: {len(all_ebooks)}건")

    if not all_ebooks:
        return

    sql_path = MIGRATION_DIR / "V10_7__seed_nongsaro_cropebook.sql"
    with open(sql_path, "w", encoding="utf-8") as f:
        f.write("-- 농사로 작물별 재배기술 시드 데이터 (자동 생성)\n")
        f.write(f"-- 생성일: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")
        f.write(f"-- 총 {len(all_ebooks)}건\n\n")

        for e in tqdm(all_ebooks, desc="  SQL 생성"):
            f.write(
                f"INSERT INTO crop_guides "
                f"(sub_category_code, sub_category_nm, ebook_code, "
                f"ebook_name, ebook_pdf_url, ebook_img_url) "
                f"VALUES ("
                f"{escape_sql(e['sub_category_code'])}, "
                f"{escape_sql(e['sub_category_nm'])}, "
                f"{escape_sql(e['ebook_code'])}, "
                f"{escape_sql(e['ebook_name'])}, "
                f"{escape_sql(e['ebook_pdf_url'])}, "
                f"{escape_sql(e['ebook_img_url'])}"
                f") ON CONFLICT DO NOTHING;\n"
            )

    print(f"  ✅ 저장: {sql_path.name}")


# ══════════════════════════════════════════════
# 메인
# ══════════════════════════════════════════════

SERVICE_MAP = {
    "variety": generate_variety_sql,
    "schedule": generate_schedule_sql,
    "pest": generate_pest_sql,
    "disaster": generate_disaster_sql,
    "eco": generate_eco_sql,
    "advanced": generate_advanced_sql,
    "cropebook": generate_cropebook_sql,
}


def main() -> None:
    parser = argparse.ArgumentParser(description="농사로 API 데이터 수집 → Flyway SQL 생성")
    parser.add_argument(
        "--service",
        type=str,
        choices=list(SERVICE_MAP.keys()),
        help="특정 서비스만 수집 (생략 시 전체)",
    )
    args = parser.parse_args()

    print("=" * 60)
    print("🌾 농사로 데이터 수집 스크립트")
    print(f"   출력: {MIGRATION_DIR}")
    print("=" * 60)

    # 키 확인
    if not os.getenv("NONGSARO_API_KEY_DEFAULT"):
        print("❌ .env에 NONGSARO_API_KEY_DEFAULT가 설정되어 있지 않습니다.")
        sys.exit(1)

    if args.service:
        SERVICE_MAP[args.service]()
    else:
        for name, func in SERVICE_MAP.items():
            func()

    print("\n" + "=" * 60)
    print("🎉 수집 완료! 생성된 SQL 파일:")
    for f in sorted(MIGRATION_DIR.glob("V10_*__seed_nongsaro_*.sql")):
        print(f"   📄 {f.name}")
    print("=" * 60)


if __name__ == "__main__":
    main()
