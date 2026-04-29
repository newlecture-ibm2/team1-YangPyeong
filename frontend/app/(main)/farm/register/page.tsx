'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DaumPostcodeEmbed from 'react-daum-postcode';
import { useKakaoLoader } from 'react-kakao-maps-sdk';
import Input from '@/components/common/Input/Input';
import Dropdown from '@/components/common/Dropdown/Dropdown';
import Button from '@/components/common/Button/Button';
import Card from '@/components/common/Card/Card';
import Modal from '@/components/common/Modal/Modal';
import { useToast } from '@/components/common/Toast';
import { uploadFile } from '@/lib/upload.api';
import styles from './page.module.css';

interface DaumPostcodeData {
  zonecode: string;
  address: string;
  roadAddress: string;
  jibunAddress: string;
  autoJibunAddress: string;
  addressType: string;
  bname: string;
  bcode: string;
  buildingName: string;
  mountain: string;
  main_address_no: string;
  sub_address_no: string;
}

const CROP_OPTIONS = [
  { value: '배추', label: '🥬 배추' },
  { value: '고추', label: '🌶️ 고추' },
  { value: '당근', label: '🥕 당근' },
  { value: '양파', label: '🧅 양파' },
  { value: '감자', label: '🥔 감자' },
  { value: '토마토', label: '🍅 토마토' },
];

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
    cropTypes: [] as string[],
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
    // 좌표 (카카오 Maps JS SDK에서 변환)
    latitude: null as number | null,
    longitude: null as number | null,
  });

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

  const removeCrop = (crop: string) => {
    setFormData(prev => ({
      ...prev,
      cropTypes: prev.cropTypes.filter(t => t !== crop)
    }));
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

    try {
      const fileUrl = await uploadFile(file);
      setFormData((prev) => ({ ...prev, documentUrl: fileUrl }));
      toast.success('증빙 서류가 업로드되었습니다.');
    } catch {
      toast.error('파일 업로드에 실패했습니다.');
    }
  };

  // 카카오 우편번호 검색 완료 핸들러
  const handlePostcodeComplete = (data: DaumPostcodeData) => {
    // 농지의 특성을 고려한 주소 추출 우선순위 적용
    let finalAddress = data.roadAddress;

    if (!finalAddress) {
      finalAddress = data.jibunAddress;
    }

    if (!finalAddress) {
      finalAddress = data.autoJibunAddress;
    }

    // 만약 위 3개 필드가 모두 비어있다면 기본 address로 대체 (안전망)
    if (!finalAddress) {
      finalAddress = data.address;
    }

    setFormData((prev) => ({
      ...prev,
      zipCode: data.zonecode,
      baseAddress: finalAddress,
      bjdCode: data.bcode,
      isMountain: data.mountain === 'Y',
      mainNo: data.main_address_no,
      subNo: data.sub_address_no || '0', // 부번이 없으면 0
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
    if (formData.cropTypes.length === 0) {
      toast.error('주요 작물을 선택해주세요.');
      return;
    }

    // 백엔드 API로 전송 (좌표는 프론트엔드 카카오 Maps JS SDK에서 변환)
    const payload = {
      name: formData.name,
      registrationNumber: formData.registrationNumber,
      zipCode: formData.zipCode,
      address: formData.baseAddress,
      detailAddress: formData.detailAddress,
      area: Number(String(formData.area).replace(/,/g, '')),
      cropTypes: formData.cropTypes,
      operationStatus: formData.operationStatus,
      soilType: formData.soilType || null,
      ph: formData.ph ? Number(formData.ph) : null,
      organicMatter: formData.organicMatter ? Number(formData.organicMatter) : null,
      documentUrl: formData.documentUrl,
      // PNU 생성용 필드
      bjdCode: formData.bjdCode,
      isMountain: formData.isMountain,
      mainNo: formData.mainNo,
      subNo: formData.subNo,
      // 좌표 (카카오 Maps JS SDK에서 변환)
      latitude: formData.latitude,
      longitude: formData.longitude,
    };

    try {
      const res = await fetch('/api/farm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        toast.error(errorData.message || '농장 등록에 실패했습니다.');
        return;
      }

      toast.success('농장이 등록되었습니다. 관리자 승인 후 농업인 권한이 부여됩니다.');
      router.push('/farm');
    } catch {
      toast.error('서버와 통신에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <p className={styles.breadcrumb}>
          <Link href="/farm" className={styles.breadcrumbLink}>내 농장</Link> / 농장 등록
        </p>
        <h1 className={styles.title}>농장 <span style={{ fontStyle: 'italic', color: 'var(--color-primary)' }}>등록</span></h1>
        <p className={styles.subtitle}>새로운 농장을 등록하고 FarmBalance의 AI 분석과 수급 관리를 시작하세요.</p>
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
                    label="농업경영체 등록번호 (10자리)"
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
                  <p className={styles.fileHelperText}>
                    (지원 형식: jpg, png, pdf / 최대 크기: 5MB)
                  </p>
                  {formData.documentUrl && (
                    <p className={styles.uploadSuccess}>✅ 업로드 완료</p>
                  )}
                </div>
              </div>

              {/* 주소 검색 영역 */}
              <div className={styles.addressSection}>
                <div className={styles.addressRow}>
                  <Input
                    label="우편번호"
                    placeholder="우편번호"
                    value={formData.zipCode}
                    disabled
                    required
                  />
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
                    label="주요 작물"
                    options={CROP_OPTIONS}
                    placeholder="선택하세요"
                    multiple
                    required
                    value={formData.cropTypes.join(',')}
                    onChange={(val) => setFormData(prev => ({ ...prev, cropTypes: val.split(',').filter(Boolean) }))}
                  />
                  {formData.cropTypes.length > 0 && (
                    <div className={styles.tagList}>
                      {formData.cropTypes.map(crop => (
                        <span key={crop} className={styles.tag}>
                          {CROP_OPTIONS.find(o => o.value === crop)?.label || crop}
                          <button 
                            type="button" 
                            className={styles.tagRemoveBtn}
                            onClick={() => removeCrop(crop)}
                          >
                            ×
                          </button>
                        </span>
                      ))}
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
            <h3 className={styles.cardTitle}>토양 정보 (선택)</h3>
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
            <Button type="submit" variant="primary" style={{ flex: 1 }}>등록하기 →</Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>취소</Button>
          </div>
        </div>
      </form>

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
