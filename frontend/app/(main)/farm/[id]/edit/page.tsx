'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DaumPostcodeEmbed, { type Address } from 'react-daum-postcode';
import Input from '@/components/common/Input/Input';
import Dropdown from '@/components/common/Dropdown/Dropdown';
import Button from '@/components/common/Button/Button';
import Card from '@/components/common/Card/Card';
import Modal from '@/components/common/Modal/Modal';
import ModalDialog from '@/components/common/Modal/ModalDialog';
import { useModalDialog } from '@/components/common/Modal/useModalDialog';
import { useToast } from '@/components/common/Toast';
import { uploadFile } from '@/lib/upload.api';
import { useFarmDetail } from '../../_hooks/useFarm';
import { updateFarm } from '../../_lib/farm.api';
import styles from '../../register/page.module.css';

interface CropOption {
  id: number;
  name: string;
  categoryId: number;
}

interface FarmFormData {
  name: string;
  registrationNumber: string;
  zipCode: string;
  baseAddress: string;
  detailAddress: string;
  area: string;
  pyeong: string;
  cropIds: number[];
  operationStatus: string;
  soilType: string;
  ph: string;
  organicMatter: string;
  documentUrl: string;
  bjdCode: string;
  isMountain: boolean;
  mainNo: string;
  subNo: string;
}

export default function FarmEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const { farm, isLoading: isFetching, removeFarm } = useFarmDetail(Number(id));

  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { dialog, showConfirm, handleConfirm, handleClose } = useModalDialog();

  // 작물 마스터 목록 가져오기
  const [cropOptions, setCropOptions] = useState<CropOption[]>([]);
  useEffect(() => {
    fetch('/api/admin/crops')
      .then(res => res.json())
      .then(json => { if (json.success) setCropOptions(json.data || []); })
      .catch(() => {});
  }, []);

  const [formData, setFormData] = useState<FarmFormData>({
    name: '',
    registrationNumber: '',
    zipCode: '',
    baseAddress: '',
    detailAddress: '',
    area: '',
    pyeong: '',
    cropIds: [],
    operationStatus: 'active',
    soilType: '',
    ph: '',
    organicMatter: '',
    documentUrl: '',
    bjdCode: '',
    isMountain: false,
    mainNo: '',
    subNo: '',
  });

  // 상세 데이터 로드 시 폼에 채우기
  useEffect(() => {
    if (farm) {
      // PNU 파싱 (19자리: 법정동10 + 산구분1 + 본번4 + 부번4)
      let bjdCode = farm.bjdCode || '';
      let isMountain = false;
      let mainNo = '0001';
      let subNo = '0000';
      
      if (farm.pnuCode && farm.pnuCode.length === 19) {
        if (!bjdCode) bjdCode = farm.pnuCode.substring(0, 10); // bjdCode가 없으면 PNU에서 추출
        isMountain = farm.pnuCode.substring(10, 11) === '2';
        mainNo = farm.pnuCode.substring(11, 15);
        subNo = farm.pnuCode.substring(15, 19);
      }

      setFormData({
        name: farm.name,
        registrationNumber: farm.registrationNumber || '',
        zipCode: '', 
        baseAddress: farm.address,
        detailAddress: '', 
        area: farm.area.toString(),
        pyeong: (farm.area / 3.3058).toFixed(1),
        cropIds: farm.cropIds || [],
        operationStatus: 'active',
        documentUrl: farm.documentUrl || '',
        bjdCode: bjdCode,
        isMountain: isMountain,
        mainNo: mainNo,
        subNo: subNo,
        soilType: farm.soilType || '',
        ph: farm.ph?.toString() || '',
        organicMatter: farm.organicMatter?.toString() || '',
      });
    }
  }, [farm]);

  const handleChange = (field: keyof FarmFormData, value: string | boolean | number[]) => {
    if (field === 'registrationNumber' && typeof value === 'string') {
      const onlyNumbers = value.replace(/[^0-9]/g, '').slice(0, 10);
      setFormData((prev) => ({ ...prev, [field]: onlyNumbers }));
      return;
    }
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileUrl = await uploadFile(file);
      setFormData((prev) => ({ ...prev, documentUrl: fileUrl }));
      toast.success('증빙 서류가 업로드되었습니다.');
    } catch {
      toast.error('파일 업로드에 실패했습니다.');
    }
  };

  const handlePostcodeComplete = (data: Address) => {
    const finalAddress = data.roadAddress || data.jibunAddress || data.address;
    // Address 타입에 포함되지 않는 확장 필드는 안전하게 접근
    const extended = data as Address & { mountain?: string; main_address_no?: string; sub_address_no?: string };
    setFormData((prev) => ({
      ...prev,
      zipCode: data.zonecode,
      baseAddress: finalAddress,
      bjdCode: data.bcode,
      isMountain: extended.mountain === 'Y',
      mainNo: extended.main_address_no || '0001',
      subNo: extended.sub_address_no || '0',
    }));
    setIsPostcodeOpen(false);
    toast.success('주소가 변경되었습니다. 저장 시 PNU 정보가 갱신됩니다.');
  };

  const removeCrop = (cropId: number) => {
    setFormData(prev => ({
      ...prev,
      cropIds: prev.cropIds.filter(id => id !== cropId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateFarm(Number(id), {
        name: formData.name,
        address: formData.baseAddress,
        area: Number(formData.area),
        cropIds: formData.cropIds,
        bjdCode: formData.bjdCode || undefined,
        isMountain: formData.isMountain,
        mainNo: formData.mainNo || undefined,
        subNo: formData.subNo || undefined,
        registrationNumber: formData.registrationNumber || undefined,
        documentUrl: formData.documentUrl || undefined,
        soilType: formData.soilType || undefined,
        ph: formData.ph ? Number(formData.ph) : undefined,
        organicMatter: formData.organicMatter ? Number(formData.organicMatter) : undefined,
      });
      toast.success('농장 정보가 수정되었습니다.');
      router.push('/farm');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '수정에 실패했습니다.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await showConfirm('정말로 이 농장을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.');
    if (confirmed) {
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
              <div className={styles.row}>
                <Input
                  label="농업경영체 등록번호"
                  placeholder="예: 1234567890"
                  value={formData.registrationNumber}
                  onChange={(e) => handleChange('registrationNumber', e.target.value)}
                />
                <div className={styles.fileUploadWrapper}>
                  <label className={styles.fileLabel}>증빙 서류 업로드</label>
                  <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileUpload} className={styles.fileInput} />
                  {formData.documentUrl && <p className={styles.uploadSuccess}>✅ 업로드됨</p>}
                </div>
              </div>
              <div className={styles.addressSection}>
                <div className={styles.addressRow}>
                  <div style={{ flex: 1 }}>
                    <Input label="우편번호" value={formData.zipCode} disabled />
                  </div>
                  <Button type="button" variant="outline" className={styles.searchBtn} onClick={() => setIsPostcodeOpen(true)}>주소 검색</Button>
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
              <div className={styles.inputGroup} style={{ gap: '8px' }}>
                <Dropdown
                  label="재배 작물"
                  options={cropOptions.map(c => ({ value: String(c.id), label: c.name }))}
                  multiple
                  required
                  value={formData.cropIds.map(String).join(',')}
                  onChange={(val) => handleChange('cropIds', val.split(',').filter(Boolean).map(Number))}
                />
                {formData.cropIds.length > 0 && (
                  <div className={styles.tagList}>
                    {formData.cropIds.map(cropId => (
                      <span key={cropId} className={styles.tag}>
                        {cropOptions.find(c => c.id === cropId)?.name || cropId}
                        <button type="button" className={styles.tagRemoveBtn} onClick={() => removeCrop(cropId)}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
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

      <ModalDialog
        {...dialog}
        onConfirm={handleConfirm}
        onClose={handleClose}
      />
    </div>
  );
}
