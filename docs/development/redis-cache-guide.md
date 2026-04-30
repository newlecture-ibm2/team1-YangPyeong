# 🚀 Redis 캐시(Cache) 가이드

글로벌 인프라 캐시 설정이 완료되었습니다! 
기상청 데이터, 토양 정보, AI 예측 등 **외부 API 호출이나 무거운 DB 조회 로직에 꼭 캐시를 적용해 주세요!**

## ⏱️ 적용된 캐시 정책 (TTL)
| Cache Name | 설명 | 만료 시간(TTL) |
| --- | --- | --- |
| `weatherCache` | 기상청 단기/중기 예보 데이터 | **3시간** |
| `soilCache` | 농촌진흥청 흙토람 토양 데이터 | **24시간** |
| `aiCache` | AI 농작물 추천/수확량 예측 | **1시간** |

> 💡 *참고: `LocalDateTime`이 들어간 객체도 직렬화 에러가 나지 않도록 조치해 두었으니 안심하고 통째로 캐싱하셔도 됩니다.*

## 💻 사용 방법 (어노테이션 추가)
Service나 Adapter 메서드 상단에 `@Cacheable` 어노테이션만 붙이시면 끝입니다!

```java
// 1. 기상 데이터 조회 시 (3시간 캐시)
@Cacheable(value = "weatherCache", key = "#regionCode")
public WeatherResponse getLocalWeather(String regionCode) {
    // 최초 1회만 이 블록 안의 무거운 외부 API 호출이 실행됩니다.
    // 그 다음부터는 이 로직을 무시하고 Redis에서 즉시 값을 가져옵니다!
}

// 2. AI 예측 데이터 조회 시 (1시간 캐시)
@Cacheable(value = "aiCache", key = "#farmId")
public AiPrediction getCropPrediction(Long farmId) {
    // ...
}
```

## 🧹 (선택) 캐시를 강제로 지워야 할 때
만약 농장 정보가 수정되어서 기존에 저장된 AI 예측 캐시를 날려야 한다면 아래처럼 사용하세요.
```java
@CacheEvict(value = "aiCache", key = "#farmId")
public void updateFarmInfo(Long farmId, FarmDto dto) {
    // 농장 정보 업데이트 로직
    // 업데이트가 성공하면 해당 farmId의 AI 캐시는 즉시 삭제됩니다.
}
```

> **문의사항:** 캐시 설정 관련 문의는 Auth/Infra 담당(jiyoun)에게 남겨주세요!
