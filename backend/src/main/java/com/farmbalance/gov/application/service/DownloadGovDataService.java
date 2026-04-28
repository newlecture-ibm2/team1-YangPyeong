package com.farmbalance.gov.application.service;

import com.farmbalance.gov.application.port.in.DownloadGovDataUseCase;
import com.farmbalance.gov.application.port.out.GovDataQueryPort;
import com.farmbalance.gov.domain.model.GovDownloadFormat;
import com.farmbalance.gov.domain.model.GovDownloadType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * 지자체 데이터 내보내기 서비스
 * DB 조회 → XLSX 또는 CSV 형식으로 OutputStream에 기록합니다.
 * 서버에 파일을 저장하지 않습니다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DownloadGovDataService implements DownloadGovDataUseCase {

    private final GovDataQueryPort queryPort;

    @Override
    public void exportData(GovDownloadType type, GovDownloadFormat format,
                           LocalDate startDate, LocalDate endDate,
                           String town, OutputStream out) {

        List<Map<String, Object>> rows = queryData(type, startDate, endDate, town);
        log.info("[Gov Export] type={}, format={}, rows={}", type, format, rows.size());

        if (format == GovDownloadFormat.XLSX) {
            writeXlsx(rows, type, out);
        } else {
            writeCsv(rows, type, out);
        }
    }

    /** 유형별 데이터 조회 */
    private List<Map<String, Object>> queryData(GovDownloadType type,
                                                 LocalDate startDate, LocalDate endDate,
                                                 String town) {
        return switch (type) {
            case CULTIVATION -> queryPort.queryCultivation(startDate, endDate, town);
            case BALANCE -> queryPort.queryBalance(startDate, endDate, town);
            case SALES -> queryPort.querySales(startDate, endDate, town);
            case FARM -> queryPort.queryFarms(startDate, endDate, town);
        };
    }

    /** 유형별 컬럼 헤더 정의 */
    private String[] getHeaders(GovDownloadType type) {
        return switch (type) {
            case CULTIVATION -> new String[]{"읍면", "농가명", "작물명", "재배면적㎡", "예상생산량kg", "등록일"};
            case BALANCE -> new String[]{"작물명", "지역", "공급률", "상태", "경고수준", "권고사항"};
            case SALES -> new String[]{"주문일", "상품명", "판매자", "판매량", "단가", "매출액"};
            case FARM -> new String[]{"농가명", "대표자", "읍면", "면적㎡", "주요작물", "승인상태"};
        };
    }

    /** XLSX 파일 생성 → OutputStream */
    private void writeXlsx(List<Map<String, Object>> rows, GovDownloadType type, OutputStream out) {
        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet(type.name());
            String[] headers = getHeaders(type);

            // 헤더 스타일
            CellStyle headerStyle = wb.createCellStyle();
            Font headerFont = wb.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // 헤더 행
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // 데이터 행
            for (int r = 0; r < rows.size(); r++) {
                Row row = sheet.createRow(r + 1);
                Map<String, Object> data = rows.get(r);
                for (int c = 0; c < headers.length; c++) {
                    Cell cell = row.createCell(c);
                    Object val = data.get(headers[c]);
                    if (val instanceof Number num) {
                        cell.setCellValue(num.doubleValue());
                    } else {
                        cell.setCellValue(val != null ? val.toString() : "");
                    }
                }
            }

            // 열 폭 자동 조정
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            wb.write(out);
        } catch (Exception e) {
            log.error("[Gov Export] XLSX 생성 실패", e);
            throw new RuntimeException("XLSX 생성 실패", e);
        }
    }

    /** CSV 파일 생성 → OutputStream (UTF-8 BOM 포함) */
    private void writeCsv(List<Map<String, Object>> rows, GovDownloadType type, OutputStream out) {
        try {
            // UTF-8 BOM (Excel에서 한글 깨짐 방지)
            out.write(new byte[]{(byte) 0xEF, (byte) 0xBB, (byte) 0xBF});

            PrintWriter pw = new PrintWriter(new OutputStreamWriter(out, StandardCharsets.UTF_8), true);
            String[] headers = getHeaders(type);

            // 헤더 행
            pw.println(String.join(",", headers));

            // 데이터 행
            for (Map<String, Object> data : rows) {
                StringBuilder line = new StringBuilder();
                for (int c = 0; c < headers.length; c++) {
                    if (c > 0) line.append(",");
                    Object val = data.get(headers[c]);
                    String str = val != null ? val.toString() : "";
                    // 쉼표·줄바꿈 포함 시 큰따옴표로 감싸기
                    if (str.contains(",") || str.contains("\n") || str.contains("\"")) {
                        str = "\"" + str.replace("\"", "\"\"") + "\"";
                    }
                    line.append(str);
                }
                pw.println(line);
            }
            pw.flush();
        } catch (Exception e) {
            log.error("[Gov Export] CSV 생성 실패", e);
            throw new RuntimeException("CSV 생성 실패", e);
        }
    }
}
