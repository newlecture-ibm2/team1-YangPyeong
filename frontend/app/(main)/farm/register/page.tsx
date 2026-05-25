'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DaumPostcodeEmbed, { type Address } from 'react-daum-postcode';
import { useKakaoLoader } from 'react-kakao-maps-sdk';
import Input from '@/components/common/Input/Input';
import Dropdown from '@/components/common/Dropdown/Dropdown';
import Button from '@/components/common/Button/Button';
import Card from '@/components/common/Card/Card';
import Modal from '@/components/common/Modal/Modal';
import { useToast } from '@/components/common/Toast';
import { uploadFile } from '@/lib/upload.api';
import { generatePnuCode, getSoilTextureName, getDrainageName, getSoilDepthName } from './_lib/soilMapper';
import { fetchSoilAnalysis, type SoilAnalysisResult } from './_lib/soil.api';
import styles from './page.module.css';

interface CropOption {
  id: number;
  name: string;
  categoryId: number;
}

export default function FarmRegisterPage() {
  const router = useRouter();
  const toast = useToast();

  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);

  // 카카오 Maps JS SDK 로드 (Geocoder 사용을 위해)
  useKakaoLoader({
    appkey: process.env.NEXT_PUBLIC_KAKAO_MAP_JS_KEY as string,
    libraries: ['services'],
  });

  const [formData, setFormData] = useState({
    name: '',
    registrationNumber: '',
    zipCode: '',
    baseAddress: '',
    detailAddress: '',
    area: '',
    pyeong: '',
    // 작물별 상세 등록 정보
    cultivations: [] as { cropId: number; area: string; expectedYield: string; unit: string }[],
    operationStatus: 'active',
    soilType: '',
    ph: '',
    organicMatter: '',
    documentUrl: '',
    // PNU 생성용 필드 추가
    bjdCode: '',
    isMountain: false,
    mainNo: '',
    subNo: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });

  // 토양 분석 결과 상태
  const [soilAnalysis, setSoilAnalysis] = useState<SoilAnalysisResult | null>(null);
  const [isFetchingSoil, setIsFetchingSoil] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 작물 마스터 목록 가져오기
  const [cropOptions, setCropOptions] = useState<CropOption[]>([]);
  useEffect(() => {
    fetch('/api/admin/crops')
      .then(res => res.json())
      .then(json => { if (json.success) setCropOptions(json.data || []); })
      .catch(() => {});
  }, []);

  const handleChange = (field: string, value: string) => {
    if (field === 'registrationNumber') {
      const onlyNumbers = value.replace(/[^0-9]/g, '').slice(0, 10);
      setFormData((prev) => ({ ...prev, [field]: onlyNumbers }));
      return;
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // 면적 단위 변환 로직 (1평 = 3.3058㎡)
  const handleAreaChange = (value: string) => {
    const pyeongValue = value && !isNaN(Number(value)) ? (Number(value) / 3.3058).toFixed(1) : '';
    setFormData((prev) => ({ ...prev, area: value, pyeong: pyeongValue }));
  };

  const handlePyeongChange = (value: string) => {
    const m2Value = value && !isNaN(Number(value)) ? (Number(value) * 3.3058).toFixed(1) : '';
    setFormData((prev) => ({ ...prev, pyeong: value, area: m2Value }));
  };

  const handleCropSelect = (cropIdStr: string) => {
    const cropId = Number(cropIdStr);
    if (!cropId) return;
    
    // 이미 있는 작물이면 무시, 아니면 추가
    if (!formData.cultivations.find(c => c.cropId === cropId)) {
      setFormData(prev => ({
        ...prev,
        cultivations: [...prev.cultivations, { cropId, area: '', expectedYield: '', unit: 'kg' }]
      }));
    }
  };

  const removeCrop = (cropId: number) => {
    setFormData(prev => ({
      ...prev,
      cultivations: prev.cultivations.filter(c => c.cropId !== cropId)
    }));
  };

  const handleCultivationChange = (cropId: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      cultivations: prev.cultivations.map(c => 
        c.cropId === cropId ? { ...c, [field]: value } : c
      )
    }));
  };

  // 파일 상태 추가
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // 임시 가이드: 작물별 대략적인 1㎡당 평균 생산량(kg) (실제 데이터 연동 전 임시값)
  const getAverageYieldPerSqm = (cropName: string) => {
    if (cropName.includes('감자')) return 3.5;
    if (cropName.includes('양파')) return 5.0;
    if (cropName.includes('벼') || cropName.includes('쌀')) return 0.5;
    if (cropName.includes('고구마')) return 2.8;
    return 2.0; // 기본값
  };

  // 이미지 파일 업로드 핸들러
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 타입 검증 (jpg, png, pdf)
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('지원되지 않는 파일 형식입니다. (jpg, png, pdf만 가능)');
      return;
    }

    // 파일 크기 검증 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('파일 크기는 5MB 이하만 가능합니다.');
      return;
    }

    // 파일을 즉시 업로드하지 않고 state에 저장 (submit 시 함께 전송)
    setSelectedFile(file);
    toast.success('증빙 서류가 선택되었습니다. (등록 시 자동 분석됩니다)');
  };

  // 카카오 우편번호 검색 완료 핸들러
  const handlePostcodeComplete = (data: Address) => {
    // Address 타입에 포함되지 않는 확장 필드는 안전하게 접근
    const extended = data as any;

    // 농지의 특성을 고려한 주소 추출 우선순위 적용
    let finalAddress = data.roadAddress;

    if (!finalAddress) {
      finalAddress = data.jibunAddress;
    }

    if (!finalAddress && extended.autoJibunAddress) {
      finalAddress = extended.autoJibunAddress;
    }

    // 만약 위 3개 필드가 모두 비어있다면 기본 address로 대체 (안전망)
    if (!finalAddress) {
      finalAddress = data.address;
    }

    // 1. 산지 여부 판별 (지번 주소나 기본 주소에 '산 '이 포함되어 있는지 확인하거나 mountain 필드가 'Y'인지 체크)
    const isMountain = (data.jibunAddress || data.address || '').includes('산 ') || extended.mountain === 'Y';

    // 2. 본번/부번 추출 (Daum Postcode API의 camelCase 명세에 맞춰 mainAddressNo/subAddressNo 우선, 없으면 fallback)
    const mainNo = extended.mainAddressNo || extended.main_address_no || '0001';
    const subNo = extended.subAddressNo || extended.sub_address_no || '0';

    setFormData((prev) => ({
      ...prev,
      zipCode: data.zonecode,
      baseAddress: finalAddress,
      bjdCode: data.bcode,
      isMountain: isMountain,
      mainNo: mainNo,
      subNo: subNo,
    }));
    setIsPostcodeOpen(false);

    // 카카오 Maps JS SDK Geocoder로 주소 → 좌표 변환
    if (window.kakao?.maps?.services) {
      const geocoder = new window.kakao.maps.services.Geocoder();
      geocoder.addressSearch(finalAddress, (result: Array<{ x: string; y: string }>, status: string) => {
        if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
          setFormData((prev) => ({
            ...prev,
            latitude: parseFloat(result[0].y),
            longitude: parseFloat(result[0].x),
          }));
        }
      });
    }

    toast.success('주소가 입력되었습니다.');

    // --- 토양 분석 로직 추가 ---
    const pnu = generatePnuCode(data.bcode, isMountain, mainNo, subNo);
    
    setIsFetchingSoil(true);
    fetchSoilAnalysis(pnu).then(result => {
      if (result) {
        setSoilAnalysis(result);
        
        if (result.isBjdAverage) {
          toast.info('해당 필지의 정밀 데이터가 없어 인근 지역 평균값을 불러왔습니다.', 5000);
        } else {
          toast.success('해당 필지의 토양 분석 데이터를 불러왔습니다.');
        }
        
        // 토양 유형 자동 선택 (코드 매핑)
        let mappedType = '';
        if (result.soilTexture === '01') mappedType = 'sand';
        else if (result.soilTexture === '02') mappedType = 'sandy_loam';
        else if (result.soilTexture === '03') mappedType = 'loam';
        else if (['05', '06', '12'].includes(result.soilTexture)) mappedType = 'clay';
        
        if (mappedType) {
          setFormData(prev => ({ 
            ...prev, 
            soilType: mappedType,
            ph: result.ph || prev.ph,
            organicMatter: result.organicMatter ? (parseFloat(result.organicMatter) / 10).toFixed(1) : prev.organicMatter
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            ph: result.ph || prev.ph,
            organicMatter: result.organicMatter ? (parseFloat(result.organicMatter) / 10).toFixed(1) : prev.organicMatter
          }));
        }
      } else {
        setSoilAnalysis(null);
      }
    }).finally(() => {
      setIsFetchingSoil(false);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    if (formData.name.length < 2) {
      toast.error('농장명은 2자 이상 입력해주세요.');
      return;
    }
    if (!formData.baseAddress) {
      toast.error('주소 검색을 통해 주소를 입력해주세요.');
      return;
    }
    if (!formData.area || isNaN(Number(formData.area))) {
      toast.error('유효한 면적(숫자)을 입력해주세요.');
      return;
    }

    if (!selectedFile) {
      toast.error('증빙 서류를 업로드해주세요.');
      return;
    }

    const totalFarmArea = Number(String(formData.area).replace(/,/g, ''));
    const totalCultivationArea = formData.cultivations.reduce((sum, c) => sum + (Number(c.area) || 0), 0);
    
    if (totalCultivationArea > totalFarmArea) {
      toast.error(`작물 재배 면적의 합계(${totalCultivationArea}㎡)가 농장 전체 면적(${totalFarmArea}㎡)을 초과할 수 없습니다.`);
      return;
    }

    setIsSubmitting(true);
    toast.info('농장 정보를 등록하고 서류를 분석 중입니다. 잠시만 기다려주세요...', 8000);

    try {
      // 1. 파일 스토리지 업로드하여 URL 획득 (화면 표시용)
      const fileUrl = await uploadFile(selectedFile);

      // 백엔드 API로 전송 (좌표는 프론트엔드 카카오 Maps JS SDK에서 변환)
      const payload = {
        name: formData.name,
        registrationNumber: formData.registrationNumber,
        zipCode: formData.zipCode,
        address: formData.baseAddress,
        detailAddress: formData.detailAddress,
        area: totalFarmArea,
        // cropIds 대신 cultivations 전달 (cropIds는 하위호환용으로 일단 유지)
        cropIds: formData.cultivations.map(c => c.cropId),
        cultivations: formData.cultivations.map(c => ({
          cropId: c.cropId,
          area: Number(c.area) || 0,
          expectedYield: Number(c.expectedYield) || null
        })),
        operationStatus: formData.operationStatus,
        soilType: formData.soilType || null,
        ph: formData.ph ? Number(formData.ph) : null,
        organicMatter: formData.organicMatter ? Number(formData.organicMatter) : null,
        documents: [
          { type: '농업경영체 등록 확인서', name: selectedFile.name, url: fileUrl }
        ],
        // PNU 생성용 필드
        bjdCode: formData.bjdCode,
        isMountain: formData.isMountain,
        mainNo: formData.mainNo,
        subNo: formData.subNo,
        // 좌표 (카카오 Maps JS SDK에서 변환)
        latitude: formData.latitude,
        longitude: formData.longitude,
      };

      const formDataObj = new FormData();
      formDataObj.append('request', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
      formDataObj.append('file', selectedFile);

      const res = await fetch('/api/farm', {
        method: 'POST',
        body: formDataObj,
      });

      if (!res.ok) {
        const errorData = await res.json();
        // 백엔드 ApiResponse 구조(error.message)에 맞게 맵핑
        const errorMessage = errorData?.error?.message || errorData?.message || '농장 등록에 실패했습니다. 유효한 문서인지 확인해주세요.';
        toast.error(errorMessage);
        return;
      }

      toast.success('농장이 등록되었습니다. 관리자 승인 후 농업인 권한이 부여됩니다.');
      router.push('/mypage/farm-applications');
    } catch {
      toast.error('서버와 통신에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className="page-header">
        <div>
          <p className={styles.breadcrumb}>
            <Link href="/farm" className={styles.breadcrumbLink}>내 농장</Link> / 농장 등록
          </p>
          <h1 className="page-title">농장 <em>등록</em></h1>
          <p className={styles.subtitle}>새로운 농장을 등록하고 FarmBalance의 AI 분석과 수급 관리를 시작하세요.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.grid}>
        <div className={styles.formSection}>
          <Card>
            <h3 className={styles.cardTitle}>기본 정보</h3>
            <div className={styles.inputGroup}>
              <div className={styles.row}>
                <Input
                  label="농장 이름"
                  placeholder="예: 양평 해맑은 농장"
                  required
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                />
              </div>
              <div className={styles.row}>
                <div>
                  <Input
                    label="농업경영체 등록번호"
                    placeholder="예: 1234567890"
                    value={formData.registrationNumber}
                    onChange={(e) => handleChange('registrationNumber', e.target.value)}
                  />
                </div>
                <div className={styles.fileUploadWrapper}>
                  <label className={styles.fileLabel}>
                    증빙 서류 업로드
                    <span className={styles.tooltipIcon} title="농업경영체 등록확인서 등 본인 확인이 가능한 서류 이미지를 업로드해주세요.">
                      💡
                    </span>
                  </label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileUpload}
                    className={styles.fileInput}
                  />
                  <div style={{ marginTop: '8px', fontSize: '13px' }}>
                    <p style={{ fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '4px' }}>
                      [허용 증명서] 농업경영체 등록 확인서, 토지대장, 농지대장
                    </p>
                    <p className={styles.fileHelperText}>
                      (지원 형식: jpg, png, pdf / 최대 크기: 5MB)
                    </p>
                    <p style={{ color: 'var(--color-danger)', fontWeight: 'bold', marginTop: '6px' }}>
                      ⚠️ 주의: 개인 간 작성한 '임대차계약서' 등 사문서는 온라인 진위확인이 불가하여 자동 반려됩니다.
                    </p>
                  </div>
                  {selectedFile && (
                    <p className={styles.uploadSuccess}>✅ {selectedFile.name} 선택됨</p>
                  )}
                  {formData.documentUrl && !selectedFile && (
                    <p className={styles.uploadSuccess}>✅ 업로드 완료</p>
                  )}
                </div>
              </div>

              {/* 주소 검색 영역 */}
              <div className={styles.addressSection}>
                <div className={styles.addressRow}>
                  <div style={{ flex: 1 }}>
                    <Input
                      label="우편번호"
                      placeholder="우편번호"
                      value={formData.zipCode}
                      disabled
                      required
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className={styles.searchBtn}
                    onClick={() => setIsPostcodeOpen(true)}
                  >
                    주소 검색
                  </Button>
                </div>
                <p className={styles.addressHelperText}>
                  💡 도로명 주소가 없는 농지는 지번 주소(동/리 + 번지)로 검색해 주세요.
                </p>
                <Input
                  label="기본 주소"
                  placeholder="주소 검색 버튼을 클릭하세요"
                  value={formData.baseAddress}
                  disabled
                  required
                />
                <Input
                  label="상세 주소"
                  placeholder="예) 비닐하우스 A동, 마을회관 우측 밭"
                  value={formData.detailAddress}
                  onChange={(e) => handleChange('detailAddress', e.target.value)}
                />
              </div>

              <div className={styles.row}>
                <Input
                  label="면적 (평)"
                  type="number"
                  placeholder="0"
                  value={formData.pyeong}
                  onChange={(e) => handlePyeongChange(e.target.value)}
                />
                <Input
                  label="면적 (㎡)"
                  type="number"
                  placeholder="0"
                  required
                  value={formData.area}
                  onChange={(e) => handleAreaChange(e.target.value)}
                />
              </div>
              <p className={styles.areaHelperText}>
                💡 평 또는 ㎡ 중 하나만 입력하면 자동으로 환산됩니다.
              </p>
              <div className={styles.row}>
                <div className={styles.inputGroup} style={{ gap: '8px' }}>
                  <Dropdown
                    label="재배 작물 추가"
                    options={cropOptions.map(c => ({ value: String(c.id), label: c.name }))}
                    placeholder="재배할 작물을 선택하세요"
                    value=""
                    onChange={handleCropSelect}
                  />
                  
                  {formData.cultivations.length > 0 && (
                    <div className={styles.cultivationList}>
                      {formData.cultivations.map((cult, idx) => {
                        const cropName = cropOptions.find(c => c.id === cult.cropId)?.name || `작물 ${cult.cropId}`;
                        const avgPerSqm = getAverageYieldPerSqm(cropName);
                        const expectedAvg = cult.area && !isNaN(Number(cult.area)) 
                          ? (Number(cult.area) * avgPerSqm).toLocaleString() 
                          : '0';

                        return (
                          <div key={cult.cropId} className={styles.cultivationItem} style={{ border: '1px solid var(--color-border)', padding: '16px', borderRadius: '8px', marginTop: '12px', position: 'relative' }}>
                            <button 
                              type="button" 
                              onClick={() => removeCrop(cult.cropId)}
                              style={{ position: 'absolute', top: '12px', right: '12px', background: 'transparent', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '18px' }}
                            >
                              ✕
                            </button>
                            <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: 'var(--color-text)' }}>🌱 {cropName}</h4>
                            
                            <div style={{ display: 'flex', gap: '12px' }}>
                              <Input
                                label={`${cropName} 재배 면적 (㎡)`}
                                placeholder="예: 500"
                                type="number"
                                required
                                value={cult.area}
                                onChange={(e) => handleCultivationChange(cult.cropId, 'area', e.target.value)}
                              />
                              <Input
                                label="예상 총생산량 (kg)"
                                placeholder="예: 2500"
                                type="number"
                                required
                                value={cult.expectedYield}
                                onChange={(e) => handleCultivationChange(cult.cropId, 'expectedYield', e.target.value)}
                              />
                            </div>
                            
                            {/* 초급농업인 가이드 힌트 */}
                            <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--color-secondary)', display: 'flex', alignItems: 'flex-start', gap: '6px', background: 'rgba(45,106,79,0.05)', padding: '10px', borderRadius: '6px' }}>
                              <span>💡</span>
                              <div>
                                <strong>가이드:</strong> 평균적으로 <strong>{cropName}</strong>은(는) 1㎡당 약 {avgPerSqm}kg 생산됩니다.<br/>
                                {cult.area ? (
                                  <span style={{ color: 'var(--color-primary)' }}>
                                    입력하신 면적({cult.area}㎡) 기준, 대략 <strong>{expectedAvg}kg</strong> 수확을 예상해 볼 수 있습니다.
                                  </span>
                                ) : (
                                  <span>면적을 입력하시면 지역 평균 예상 수확량을 계산해 드립니다.</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <Dropdown
                  label="운영상태"
                  options={[
                    { value: 'active', label: '운영중' },
                    { value: 'pause', label: '휴경' },
                    { value: 'closed', label: '폐업' },
                  ]}
                  value={formData.operationStatus}
                  onChange={(val) => handleChange('operationStatus', val)}
                />
              </div>
            </div>
          </Card>
        </div>

        <div className={styles.formSection}>
          <Card variant="dark">
            <h3 className={styles.cardTitle} style={{ color: 'var(--color-accent)' }}>💡 등록 안내</h3>
            <ul className={styles.infoList}>
              <li>등록 후 AI 기반 맞춤 추천을 받을 수 있습니다</li>
              <li>수급 알림을 통해 최적 출하 시기를 안내받습니다</li>
              <li>재배 이력이 자동으로 기록됩니다</li>
              <li>지자체 보조금 정보를 받을 수 있습니다</li>
            </ul>
          </Card>

          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className={styles.cardTitle} style={{ marginBottom: 0 }}>토양 정보 (선택)</h3>
              {isFetchingSoil && <span style={{ fontSize: '12px', color: 'var(--color-primary)' }}>🔍 토양 정보 분석 중...</span>}
            </div>

            {/* AI 토양 분석 결과 표시 영역 */}
            {soilAnalysis && (
              <div style={{ 
                background: 'rgba(45,106,79,0.05)', 
                padding: '16px', 
                borderRadius: '12px', 
                marginBottom: '20px',
                border: '1px dashed var(--color-primary-light)'
              }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '8px' }}>
                  {soilAnalysis.isBjdAverage 
                    ? '💡 인근 지역 평균 토양 분석 (추천값)' 
                    : '✨ 흙토람 실시간 토양 분석 결과'}
                </p>
                {soilAnalysis.isBjdAverage && (
                  <p style={{ fontSize: '12px', color: 'var(--color-secondary)', marginBottom: '10px', lineHeight: '1.4' }}>
                    해당 필지의 정밀 검사 기록이 확인되지 않아, 주소지 법정동의 평균 통계 데이터를 바탕으로 가이드를 제공해 드립니다.
                  </p>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
                  <div>
                    <span style={{ color: 'var(--color-secondary)', marginRight: '4px' }}>• 토성:</span>
                    <strong>{getSoilTextureName(soilAnalysis.soilTexture)}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-secondary)', marginRight: '4px' }}>• 배수:</span>
                    <strong>{getDrainageName(soilAnalysis.drainage)}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-secondary)', marginRight: '4px' }}>• 토심:</span>
                    <strong>{getSoilDepthName(soilAnalysis.soilDepth)}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-secondary)', marginRight: '4px' }}>• pH:</span>
                    <strong>{soilAnalysis.ph || '데이터 없음'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-secondary)', marginRight: '4px' }}>• 유기물:</span>
                    <strong>{soilAnalysis.organicMatter ? `${soilAnalysis.organicMatter} g/kg` : '데이터 없음'}</strong>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-secondary)', alignSelf: 'center' }}>
                    * PNU: {soilAnalysis.pnuCd}
                  </div>
                </div>
              </div>
            )}

            <div className={styles.inputGroup}>
              <Dropdown
                label="토양 유형"
                options={[
                  { value: 'sand', label: '사질토' },
                  { value: 'loam', label: '양토' },
                  { value: 'clay', label: '점토' },
                  { value: 'sandy_loam', label: '사양토' },
                ]}
                placeholder="선택하세요"
                value={formData.soilType}
                onChange={(val) => handleChange('soilType', val)}
              />
              <div className={styles.row}>
                <Input
                  label="pH"
                  placeholder="6.0 ~ 7.0"
                  value={formData.ph}
                  onChange={(e) => handleChange('ph', e.target.value)}
                />
                <Input
                  label="유기물 (%)"
                  placeholder="2.5"
                  value={formData.organicMatter}
                  onChange={(e) => handleChange('organicMatter', e.target.value)}
                />
              </div>
            </div>
          </Card>

          <p className={styles.submitNotice}>
            💡 등록하신 정보는 관리자 검토 및 승인 후 최종 반영되며, 이후 농업인 권한이 부여됩니다.
          </p>
          <div className={styles.buttonGroup}>
            <Button type="submit" variant="primary" style={{ flex: 1 }} disabled={isSubmitting}>
              {isSubmitting ? '문서 분석 및 등록 중...' : '등록하기 →'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
              취소
            </Button>
          </div>
        </div>
      </form>

      {/* AI OCR 분석 중 오버레이 스피너 */}
      {isSubmitting && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            width: '48px', height: '48px',
            border: '4px solid var(--color-border)',
            borderTop: '4px solid var(--color-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '20px'
          }}></div>
          <p style={{ fontWeight: 'bold', color: 'var(--color-primary)', fontSize: '18px', marginBottom: '8px' }}>
            ✨ AI가 증빙 서류를 분석하고 있습니다...
          </p>
          <p style={{ fontSize: '14px', color: 'var(--color-secondary)' }}>
            화면을 닫지 말고 잠시만 기다려주세요. (최대 10초 소요)
          </p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* 카카오 우편번호 검색 모달 */}
      <Modal
        isOpen={isPostcodeOpen}
        onClose={() => setIsPostcodeOpen(false)}
        title="주소 검색"
      >
        <div className={styles.postcodeWrapper}>
          <DaumPostcodeEmbed
            onComplete={handlePostcodeComplete}
            style={{ width: '100%', height: '460px' }}
          />
        </div>
      </Modal>
    </div>
  );
}
