-- 타 지역 정책 삭제 (양평군, 경기도, 국가 기관 외)
DELETE FROM policy_data
WHERE organization IS NOT NULL
  AND organization NOT LIKE '%양평%'
  AND organization NOT LIKE '%경기%'
  AND organization NOT LIKE '%농림%'
  AND organization NOT LIKE '%농촌%'
  AND organization NOT LIKE '%산림%'
  AND organization NOT LIKE '%정부%'
  AND organization NOT LIKE '%공사%'
  AND organization NOT LIKE '%재단%'
  AND organization NOT LIKE '%원'
  AND organization NOT LIKE '%부'
  AND organization NOT LIKE '%청'
  AND organization NOT LIKE '%위원회%'
  AND organization NOT LIKE '%본부%'
  AND organization NOT LIKE '%농협%'
  AND (
      organization LIKE '%시 %' OR
      organization LIKE '%군 %' OR
      organization LIKE '%구 %' OR
      organization LIKE '%도 %' OR
      organization LIKE '%특별시%' OR
      organization LIKE '%광역시%' OR
      organization LIKE '%자치도%' OR
      organization LIKE '%자치시%' OR
      organization LIKE '%시' OR
      organization LIKE '%군' OR
      organization LIKE '%구' OR
      organization LIKE '%도'
  );
