'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DaumPostcodeEmbed from 'react-daum-postcode';
import Input from '@/components/common/Input/Input';
import Dropdown from '@/components/common/Dropdown/Dropdown';
import Button from '@/components/common/Button/Button';
import Card from '@/components/common/Card/Card';
import Modal from '@/components/common/Modal/Modal';
import { useToast } from '@/components/common/Toast';
import { useFarmDetail } from '../../_hooks/useFarm';
import { updateFarm } from '../../_lib/farm.api';
import styles from '../../register/page.module.css';

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

export default function FarmEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const { farm, isLoading: isFetching, removeFarm } = useFarmDetail(Number(id));

  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    documentUrl: '',
    // PNU 갱신을 위한 지번 주소 정보 (초기화는 상세 데이터 로드 후)
    bjdCode: '1111010100', // 임시 기본값
    isMountain: false,
    mainNo: '0001',
    subNo: '0000',
  });

  // 상세 데이터 로드 시 폼에 채우기
  useEffect(() => {
    if (farm) {
      setFormData({
        name: farm.name,
        registrationNumber: farm.registrationNumber || '',
        zipCode: '', // 백엔드에서 추가 저장 필요 시 보완
        baseAddress: farm.address,
        detailAddress: '', // 상세 주소 분리 저장 시 보완
        area: farm.area.toString(),
        pyeong: (farm.area / 3.3058).toFixed(1),
        cropTypes: farm.cropTypes,
        operationStatus: 'active',
        documentUrl: farm.documentUrl || '',
        bjdCode: farm.bjdCode || '1111010100',
        isMountain: false, // PNU에서 파싱 필요할 수 있음
        mainNo: '0001', // PNU에서 파싱 필요할 수 있음
        subNo: '0000', // PNU에서 파싱 필요할 수 있음
      });
    }
  }, [farm]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAreaChange = (value: string) => {
    const pyeongValue = value && !isNaN(Number(value)) ? (Number(value) / 3.3058).toFixed(1) : '';
    setFormData((prev) => ({ ...prev, area: value, pyeong: pyeongValue }));
  };

  const handlePyeongChange = (value: string) => {
    const m2Value = value && !isNaN(Number(value)) ? (Number(value) * 3.3058).toFixed(1) : '';
    setFormData((prev) => ({ ...prev, pyeong: value, area: m2Value }));
  };

  const handlePostcodeComplete = (data: DaumPostcodeData) => {
    const finalAddress = data.roadAddress || data.jibunAddress || data.address;
    setFormData((prev) => ({
      ...prev,
      zipCode: data.zonecode,
      baseAddress: finalAddress,
      bjdCode: data.bcode,
      isMountain: data.mountain === 'Y',
      mainNo: data.main_address_no,
      subNo: data.sub_address_no || '0',
    }));
    setIsPostcodeOpen(false);
    toast.success('주소가 변경되었습니다. 저장 시 PNU 정보가 갱신됩니다.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateFarm(Number(id), {
        name: formData.name,
        address: formData.baseAddress,
        area: Number(formData.area),
        cropTypes: formData.cropTypes,
        bjdCode: formData.bjdCode,
        isMountain: formData.isMountain,
        mainNo: formData.mainNo,
        subNo: formData.subNo,
        registrationNumber: formData.registrationNumber,
        documentUrl: formData.documentUrl,
      });
      toast.success('농장 정보가 수정되었습니다.');
      router.push('/farm');
    } catch (err: any) {
      toast.error(err.message || '수정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('정말로 이 농장을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      const success = await removeFarm();
      if (success) router.push('/farm');
    }
  };

  if (isFetching) return <div className={styles.container}><p>데이터를 불러오는 중...</p></div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <p className={styles.breadcrumb}>
          <Link href="/farm" className={styles.breadcrumbLink}>내 농장</Link> / 정보 수정
        </p>
        <h1 className={styles.title}>농장 <span style={{ fontStyle: 'italic', color: 'var(--color-primary)' }}>수정</span></h1>
        <p className={styles.subtitle}>농장 정보를 최신 상태로 유지해 주세요.</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.grid}>
        <div className={styles.formSection}>
          <Card>
            <h3 className={styles.cardTitle}>기본 정보</h3>
            <div className={styles.inputGroup}>
              <Input
                label="농장 이름"
                required
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
              <div className={styles.addressSection}>
                <div className={styles.addressRow}>
                  <Input label="우편번호" value={formData.zipCode} disabled style={{ flex: 1 }} />
                  <Button type="button" variant="outline" onClick={() => setIsPostcodeOpen(true)}>주소 검색</Button>
                </div>
                <Input label="기본 주소" value={formData.baseAddress} disabled required />
                <Input
                  label="상세 주소"
                  value={formData.detailAddress}
                  onChange={(e) => handleChange('detailAddress', e.target.value)}
                />
              </div>
              <div className={styles.row}>
                <Input
                  label="면적 (평)"
                  type="number"
                  value={formData.pyeong}
                  onChange={(e) => handlePyeongChange(e.target.value)}
                />
                <Input
                  label="면적 (㎡)"
                  type="number"
                  required
                  value={formData.area}
                  onChange={(e) => handleAreaChange(e.target.value)}
                />
              </div>
              <Dropdown
                label="주요 작물"
                options={CROP_OPTIONS}
                multiple
                required
                value={formData.cropTypes.join(',')}
                onChange={(val) => handleChange('cropTypes', val.split(',').filter(Boolean))}
              />
            </div>
          </Card>
        </div>

        <div className={styles.formSection}>
          <Card variant="dark">
            <h3 className={styles.cardTitle} style={{ color: 'var(--color-accent)' }}>⚠️ 주의사항</h3>
            <p style={{ color: 'white', fontSize: '14px', lineHeight: '1.6' }}>
              주소를 변경할 경우 필지 정보(PNU)가 재계산되며, 위치 기반 서비스 데이터가 갱신됩니다.
            </p>
          </Card>

          <div className={styles.buttonGroup} style={{ marginTop: '2rem' }}>
            <Button type="submit" variant="primary" style={{ flex: 1 }} disabled={isSubmitting}>
              {isSubmitting ? '저장 중...' : '변경사항 저장'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>취소</Button>
          </div>
          
          <div style={{ marginTop: '3rem', borderTop: '1px solid var(--color-border)', paddingTop: '2rem' }}>
            <p style={{ color: 'var(--color-text-light)', fontSize: '13px', marginBottom: '1rem' }}>
              더 이상 이 농장을 운영하지 않으시나요?
            </p>
            <Button type="button" variant="outline" onClick={handleDelete} style={{ color: '#E63946', borderColor: '#E63946' }}>
              농장 삭제하기
            </Button>
          </div>
        </div>
      </form>

      <Modal isOpen={isPostcodeOpen} onClose={() => setIsPostcodeOpen(false)} title="주소 검색">
        <div className={styles.postcodeWrapper}>
          <DaumPostcodeEmbed onComplete={handlePostcodeComplete} style={{ width: '100%', height: '460px' }} />
        </div>
      </Modal>
    </div>
  );
}
