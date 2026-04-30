# 📁 파일 업로드 가이드

> **작성일**: 2026-04-29  
> **대상**: FarmBalance 전체 팀원

---

## 1. 전체 흐름

```
[프론트 컴포넌트]
    │
    │  uploadFile(file)  ← lib/upload.api.ts
    │
    ▼
[BFF Route Handler]      ← app/api/uploads/route.ts
    │
    │  FormData 프록시 + JWT 토큰 자동 첨부
    │
    ▼
[백엔드 Controller]      ← global/upload/GlobalUploadController.java
    │
    │  POST /api/uploads (MultipartFile)
    │
    ▼
[LocalUploadFileAdapter] ← global/upload/LocalUploadFileAdapter.java
    │
    │  UUID 파일명으로 저장 → /uploads/{uuid}.확장자 URL 반환
    │
    ▼
[정적 서빙]              ← CorsConfig.java (addResourceHandlers)
    │
    │  /uploads/xxx.jpg 요청 → 실제 파일 응답
    ▼
[브라우저에서 이미지 표시]
```

---

## 2. 프론트에서 사용하는 방법

### 2.1 기본 사용법 (파일 1개 업로드)

```typescript
import { uploadFile } from '@/lib/upload.api';

// input[type="file"] onChange 핸들러 안에서
const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    const fileUrl = await uploadFile(file);  // "/uploads/abc-123.jpg"
    console.log('업로드 완료:', fileUrl);
    // fileUrl을 상태에 저장하여 폼 데이터와 함께 전송
  } catch (error) {
    console.error('업로드 실패:', error);
  }
};
```

### 2.2 JSX 예시

```tsx
<input
  type="file"
  accept="image/*"
  onChange={handleFileUpload}
/>

{/* 업로드된 이미지 미리보기 */}
{fileUrl && <img src={fileUrl} alt="업로드된 이미지" />}
```

### 2.3 여러 파일 업로드

```typescript
const handleMultiUpload = async (files: File[]) => {
  const urls = await Promise.all(files.map((f) => uploadFile(f)));
  // urls = ["/uploads/aaa.jpg", "/uploads/bbb.jpg", ...]
};
```

---

## 3. 관련 파일 목록

| 레이어 | 파일 경로 | 역할 |
|--------|-----------|------|
| **프론트 유틸** | `frontend/lib/upload.api.ts` | `uploadFile(file)` — FormData 전송 |
| **BFF Route** | `frontend/app/api/uploads/route.ts` | 프론트 → 백엔드 파일 프록시 (JWT 자동 첨부) |
| **백엔드 Controller** | `backend/.../global/upload/GlobalUploadController.java` | `POST /api/uploads` 엔드포인트 |
| **백엔드 Port** | `backend/.../global/upload/UploadFilePort.java` | 업로드 인터페이스 |
| **백엔드 Adapter** | `backend/.../global/upload/LocalUploadFileAdapter.java` | 로컬 디스크 저장 (UUID 파일명) |
| **정적 서빙** | `backend/.../global/config/CorsConfig.java` | `/uploads/**` 정적 리소스 핸들러 |

---

## 4. 설정값

### application.yml (백엔드)

```yaml
spring:
  servlet:
    multipart:
      max-file-size: 10MB       # 파일 1개 최대 크기
      max-request-size: 20MB    # 요청 전체 최대 크기

file:
  upload:
    dir: uploads/               # 저장 경로 (기본값)
```

### 제한 사항

| 항목 | 값 |
|------|----|
| 파일 1개 최대 크기 | 10MB |
| 요청 전체 최대 크기 | 20MB |
| 저장 위치 | `{프로젝트루트}/uploads/` (로컬), Docker 볼륨 (배포) |
| 반환 URL 형식 | `/uploads/{uuid}.{확장자}` |

---

## 5. 주의사항

1. **`uploadFile()` 반환값**은 `/uploads/xxx.jpg` 형태의 **상대 경로**입니다.
   - 이 URL을 DB에 저장하고, 프론트에서 `<img src={url} />`로 사용합니다.

2. **인증이 필요합니다.** BFF Route에서 쿠키의 JWT 토큰을 자동으로 백엔드에 전달합니다.
   - 로그인하지 않은 상태에서는 업로드 시 401 에러가 발생할 수 있습니다.

3. **파일 타입 제한은 프론트에서 처리**합니다.
   - `<input accept="image/*" />` 또는 `accept=".pdf,.jpg,.png"` 등으로 제한하세요.

4. **`/uploads/` 폴더는 Git에 올라가지 않습니다.** (`.gitignore` 확인)

---

## 6. 현재 사용 중인 페이지

| 페이지 | 파일 | 용도 |
|--------|------|------|
| 농장 등록 | `farm/register/page.tsx` | 토지증명서 이미지 업로드 |

> 새로운 페이지에서 파일 업로드가 필요하면 `uploadFile()`을 import하여 동일하게 사용하면 됩니다.
