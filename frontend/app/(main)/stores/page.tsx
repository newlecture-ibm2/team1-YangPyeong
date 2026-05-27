'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Map, MapMarker, useKakaoLoader } from 'react-kakao-maps-sdk';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import FilterBar from '@/components/common/FilterBar/FilterBar';
import SearchInput from '@/components/common/SearchInput/SearchInput';
import Dropdown from '@/components/common/Dropdown/Dropdown';
import ModalDialog from '@/components/common/Modal/ModalDialog';
import { useModalDialog } from '@/components/common/Modal/useModalDialog';
import Link from 'next/link';
import styles from './stores.module.css';

interface Store {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  category: string;
}

export default function StoreMapPage() {
  const [loading, error] = useKakaoLoader({
    appkey: process.env.NEXT_PUBLIC_KAKAO_MAP_JS_KEY as string,
    libraries: ['services', 'clusterer'],
  });

  const [mapCenter, setMapCenter] = useState({ lat: 37.4913, lng: 127.4876 }); // 양평군 기본 중심
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [visibleStores, setVisibleStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [isExpandedSearch, setIsExpandedSearch] = useState(false); // 반경 확대 검색 여부
  
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('종묘사'); // 기본 검색어
  
  // Kakao Map 객체를 ref로 관리 (useCallback 의존성 순환 방지)
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const isFirstLoad = useRef(true);
  const { dialog, showAlert, handleConfirm, handleClose } = useModalDialog();

  // 카카오맵 검색 결과 → Store 변환 헬퍼
  const toStores = (data: kakao.maps.services.PlacesSearchResult): Store[] =>
    data.map((item) => ({
      id: item.id,
      name: item.place_name,
      address: item.road_address_name || item.address_name,
      lat: parseFloat(item.y),
      lng: parseFloat(item.x),
      phone: item.phone,
      category: item.category_name.split(' > ').pop() || '',
    }));

  // 반경 확대 fallback 검색 (bounds 검색 0건 시 호출)
  const searchWithRadius = useCallback((query: string, radius: number = 20000) => {
    const map = mapRef.current;
    if (!map || !window.kakao?.maps?.services) return;

    const ps = new kakao.maps.services.Places();
    const center = map.getCenter();
    const location = new kakao.maps.LatLng(center.getLat(), center.getLng());

    ps.keywordSearch(query, (data, status) => {
      if (status === kakao.maps.services.Status.OK) {
        setVisibleStores(toStores(data));
        setIsExpandedSearch(true);
      } else {
        setVisibleStores([]);
        setIsExpandedSearch(false);
      }
    }, { location, radius, sort: kakao.maps.services.SortBy.DISTANCE });
  }, []);

  // 장소 검색 함수 — 명시적 호출 시에만 실행 (의존성 없음)
  const searchPlaces = useCallback((forceExpand?: boolean) => {
    const map = mapRef.current;
    if (!map || !window.kakao?.maps?.services) return;

    let query = searchKeyword.trim();
    
    // 카테고리와 검색어를 함께 조합
    if (selectedCategory && query) {
      query = `${selectedCategory} ${query}`;
    } else if (!query) {
      query = selectedCategory;
    }

    const ps = new kakao.maps.services.Places();
    const bounds = map.getBounds();

    // 강제 확대 검색 요청
    if (forceExpand && query) {
      searchWithRadius(query);
      return;
    }

    // '전체' 카테고리이고 검색어가 없을 때: 대표 3가지 키워드로 동시 검색 후 병합
    if (!query && selectedCategory === '') {
      const searchOpts = { bounds };
      Promise.all([
        new Promise<{data: kakao.maps.services.PlacesSearchResult; status: kakao.maps.services.Status}>((resolve) => ps.keywordSearch('종묘사', (data, status) => resolve({ data, status }), searchOpts)),
        new Promise<{data: kakao.maps.services.PlacesSearchResult; status: kakao.maps.services.Status}>((resolve) => ps.keywordSearch('농자재', (data, status) => resolve({ data, status }), searchOpts)),
        new Promise<{data: kakao.maps.services.PlacesSearchResult; status: kakao.maps.services.Status}>((resolve) => ps.keywordSearch('직매장', (data, status) => resolve({ data, status }), searchOpts))
      ]).then(results => {
        let allStores: kakao.maps.services.PlacesSearchResult = [];
        results.forEach(res => {
          if (res.status === kakao.maps.services.Status.OK && res.data) {
            allStores = allStores.concat(res.data);
          }
        });
        
        // 중복 제거 (id 기준)
        const uniqueStores = allStores.filter((store, index, self) => 
          index === self.findIndex((s) => s.id === store.id)
        );
        
        if (uniqueStores.length > 0) {
          setVisibleStores(toStores(uniqueStores));
          setIsExpandedSearch(false);
        } else {
          // bounds 내 0건 → 반경 20km로 재검색
          searchWithRadius('종묘사 농자재 직매장');
        }
      });
      return;
    }

    // 빈 키워드라면 API 호출 방지
    if (!query) {
      setVisibleStores([]);
      setIsExpandedSearch(false);
      return;
    }

    ps.keywordSearch(query, (data, status) => {
      if (status === kakao.maps.services.Status.OK) {
        setVisibleStores(toStores(data));
        setIsExpandedSearch(false);
      } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
        // bounds 내 0건 → 반경 20km 확대 검색 자동 시도
        searchWithRadius(query);
      } else {
        console.warn('카카오맵 장소 검색 결과 없음 (코드:', status, ')');
      }
    }, { bounds });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKeyword, selectedCategory, searchWithRadius]);

  // 내 위치 찾기 (버튼 클릭 전용)
  const findMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      showAlert('위치 정보를 지원하지 않는 브라우저입니다.', '위치 정보 오류');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
        setMapCenter(loc);
        setUserLocation(loc);
        const map = mapRef.current;
        if (map && window.kakao) {
          map.setCenter(new window.kakao.maps.LatLng(loc.lat, loc.lng));
          // 지도 이동 후 약간의 지연을 두고 검색 (idle 이벤트에 위임)
        }
      },
      () => {
        console.warn('위치 정보 가져오기 실패 — 기본 위치 사용');
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }, []);

  // 지도 생성 완료 시 + 첫 로딩 시 위치 찾기
  const handleMapCreate = useCallback((map: kakao.maps.Map) => {
    mapRef.current = map;

    // 첫 로딩 시 내 위치로 이동 시도
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
            setMapCenter(loc);
            setUserLocation(loc);
            map.setCenter(new window.kakao.maps.LatLng(loc.lat, loc.lng));
            // idle 이벤트가 자동으로 searchPlaces를 호출할 것
          },
          () => {
            // 위치 실패 → 기본 양평군 좌표에서 검색 실행
            searchPlaces();
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      } else {
        searchPlaces();
      }
    }
  }, [searchPlaces]);

  // 지도 이동이 멈추면 검색 (디바운스 역할)
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const handleMapIdle = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      searchPlaces();
    }, 300); // 300ms 디바운스
  }, [searchPlaces]);

  const handleStoreClick = (store: Store) => {
    setSelectedStoreId(store.id);
    setMapCenter({ lat: store.lat, lng: store.lng });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchPlaces();
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
            <Link href="/" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>홈</Link> › 동네 가게
          </div>
          <h1 className="page-title">
            동네 <em>가게</em>
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)', maxWidth: '600px', lineHeight: '1.7' }}>
            양평군 주변 종묘사, 농자재, 직매장을 지도에서 찾아보세요.
          </p>
        </div>
      </div>
      
      <div className={styles.searchBar} data-guide="stores-search">
        <FilterBar
          dropdowns={[
            <Dropdown
              key="category"
              options={[
                { value: '', label: '카테고리: 전체' },
                { value: '직매장', label: '농산물 직매장' },
                { value: '종묘사', label: '종묘상/농약' },
                { value: '농자재', label: '농자재' }
              ]}
              value={selectedCategory}
              onChange={(value) => {
                setSelectedCategory(value);
                setSearchKeyword(''); // 카테고리 선택시 검색어 초기화
              }}
            />
          ]}
          search={
            <SearchInput
              placeholder="가게명, 장소 조회 검색 (예: 종묘사, 비료)"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onSearch={() => searchPlaces()}
              fullWidth
            />
          }
        />
      </div>

      <div className={styles.contentWrapper}>
        <div className={styles.mapSection} data-guide="stores-map">
          <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10 }}>
            <button 
              onClick={findMyLocation}
              style={{
                background: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#444',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              📍 내 위치로 이동
            </button>
          </div>
          {loading ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>지도 로딩중...</div>
          ) : error ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'red' }}>
              지도 로드 실패. 카카오 개발자 콘솔의 활성화 설정을 확인해주세요.
            </div>
          ) : (
            <Map
              center={mapCenter}
              style={{ width: '100%', height: '100%' }}
              level={userLocation ? 6 : 9}
              onCreate={handleMapCreate}
              onIdle={handleMapIdle}
            >
              {userLocation && (
                <MapMarker 
                  position={userLocation}
                  image={{
                    src: 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png',
                    size: { width: 40, height: 42 },
                  }}
                  title="현재 내 위치"
                />
              )}

              {visibleStores.map(store => (
                <MapMarker
                  key={`${store.id}-${selectedStoreId === store.id ? 'selected' : 'default'}`}
                  position={{ lat: store.lat, lng: store.lng }}
                  onClick={() => handleStoreClick(store)}
                  image={
                    selectedStoreId === store.id 
                    ? { src: 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png', size: { width: 24, height: 35 } } 
                    : undefined
                  }
                />
              ))}
            </Map>
          )}
        </div>

        <div className={styles.listSection}>
          {isExpandedSearch && visibleStores.length > 0 && (
            <div style={{ padding: '8px 12px', background: '#FFF8E1', borderRadius: '8px', margin: '0 0 8px', fontSize: '13px', color: '#8D6E00', textAlign: 'center' }}>
              📍 주변 20km 반경으로 확대 검색된 결과입니다
            </div>
          )}
          {visibleStores.length === 0 ? (
            <div className={styles.emptyState}>
              <p>현재 검색된 매장이 없습니다.</p>
              <span style={{ fontSize: '12px', display: 'block', marginBottom: '12px' }}>양평군 지역 특성상 등록된 매장이 적을 수 있습니다.</span>
              <button
                onClick={() => searchPlaces(true)}
                style={{
                  background: 'var(--color-primary, #2D6A4F)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                🔍 주변 지역으로 넓혀 검색
              </button>
            </div>
          ) : (
            visibleStores.map(store => (
              <div key={store.id} style={{ display: 'contents' }}>
                <Card 
                  className={`${styles.storeCard} ${selectedStoreId === store.id ? styles.active : ''}`}
                  onClick={() => handleStoreClick(store)}
                >
                  <div className={styles.cardHeader}>
                    <h3 className={styles.storeName}>{store.name}</h3>
                  </div>
                  <div className={styles.cropList} style={{ marginBottom: '12px' }}>
                    {store.category && (
                       <Badge variant="green">{store.category}</Badge>
                    )}
                  </div>
                  <div className={styles.address}>
                    📍 {store.address}
                  </div>
                  {store.phone && (
                    <div className={styles.address} style={{ marginTop: '4px', color: '#7c9861' }}>
                      📞 {store.phone}
                    </div>
                  )}
                </Card>
              </div>
            ))
          )}
        </div>
      </div>

      <ModalDialog
        {...dialog}
        onConfirm={handleConfirm}
        onClose={handleClose}
      />
    </div>
  );
}
