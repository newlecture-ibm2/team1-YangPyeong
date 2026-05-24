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
import { useFarmDetail } from '../../useFarm';
import { updateFarm } from '../../_lib/farm.api';
import { getCultivations } from '../../_lib/cultivation.api';
import styles from '../../register/page.module.css';
import { generatePnuCode, getSoilTextureName, getDrainageName, getSoilDepthName } from '../../register/_lib/soilMapper';
import { fetchSoilAnalysis, type SoilAnalysisResult } from '../../register/_lib/soil.api';

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
  cultivations: { cropId: number; area: string; expectedYield: string; unit: string }[];
}

export default function FarmEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const { farm, isLoading: isFetching, removeFarm } = useFarmDetail(Number(id));

  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { dialog, showConfirm, handleConfirm, handleClose } = useModalDialog();

  // 토양 분석 결과 및 로딩 상태
  const [soilAnalysis, setSoilAnalysis] = useState<SoilAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
    cultivations: [],
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
        cropIds: Array.from(new Set(farm.cropIds || [])),
        operationStatus: 'active',
        documentUrl: farm.documentUrl || '',
        bjdCode: bjdCode,
        isMountain: isMountain,
        mainNo: mainNo,
        subNo: subNo,
        soilType: farm.soilType || '',
        ph: farm.ph?.toString() || '',
        organicMatter: farm.organicMatter?.toString() || '',
        cultivations: [], // 아래에서 별도로 로드
      });

      // 재배 상세 정보 로드
      getCultivations(Number(id)).then(data => {
        setFormData(prev => ({
          ...prev,
          cultivations: data.map(c => ({
            cropId: c.cropId,
            area: String(c.cultivationArea || ''),
            expectedYield: String(c.farmerEstimatedYield || ''),
            unit: c.yieldUnit || 'kg'
          }))
        }));
      }).catch(() => {});
    }
  }, [farm, id]);

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
    const extended = data as any;

    // 1. 산지 여부 판별
    const isMountain = (data.jibunAddress || data.address || '').includes('산 ') || extended.mountain === 'Y';

    // 2. 본번/부번 추출
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
    toast.success('주소가 변경되었습니다. 저장 시 PNU 정보가 갱신됩니다.');

    // --- 토양 분석 로직 추가 ---
    const pnu = generatePnuCode(
      data.bcode,
      isMountain,
      mainNo,
      subNo
    );
    
    setIsAnalyzing(true);
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
    }).catch(() => {
      setSoilAnalysis(null);
    }).finally(() => {
      setIsAnalyzing(false);
    });
  };

  const handleCropSelect = (cropIdStr: string) => {
    const cropId = Number(cropIdStr);
    if (!cropId) return;
    
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateFarm(Number(id), {
        name: formData.name,
        address: formData.baseAddress,
        area: Number(formData.area),
        cropIds: formData.cultivations.map(c => c.cropId),
        cultivations: formData.cultivations.map(c => ({
          cropId: c.cropId,
          area: Number(c.area) || 0,
          expectedYield: Number(c.expectedYield) || null
        })),
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
      if (farm?.certificationStatus === 'APPROVED') {
        router.push('/farm');
      } else {
        router.push('/mypage/farm-applications');
      }
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
      <div className="page-header">
        <div>
          <p className={styles.breadcrumb}>
            <Link href="/farm" className={styles.breadcrumbLink}>내 농장</Link> / 정보 수정
          </p>
          <h1 className="page-title">농장 <em>수정</em></h1>
          <p className={styles.subtitle}>농장 정보를 최신 상태로 유지해 주세요.</p>
        </div>
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
                  label="재배 작물 추가"
                  options={cropOptions.map(c => ({ value: String(c.id), label: c.name }))}
                  placeholder="작물을 선택하여 추가하세요"
                  value=""
                  onChange={handleCropSelect}
                />
                {formData.cultivations.length > 0 && (
                  <div className={styles.tagList} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                    {formData.cultivations.map(cult => {
                      const cropName = cropOptions.find(c => c.id === cult.cropId)?.name || `작물 ${cult.cropId}`;
                      return (
                        <div key={cult.cropId} style={{ border: '1px solid var(--color-border)', padding: '16px', borderRadius: '8px', position: 'relative', background: '#f8fafc' }}>
                          <button 
                            type="button" 
                            className={styles.tagRemoveBtn} 
                            onClick={() => removeCrop(cult.cropId)}
                            style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '18px' }}
                          >
                            ×
                          </button>
                          <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: 'var(--color-text)', fontWeight: 700 }}>🌱 {cropName}</h4>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ flex: 1 }}>
                              <Input
                                label="재배 면적 (㎡)"
                                type="number"
                                required
                                value={cult.area}
                                onChange={(e) => handleCultivationChange(cult.cropId, 'area', e.target.value)}
                              />
                              {cult.area && Number(cult.area) > 0 && (
                                <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--color-secondary)', display: 'flex', alignItems: 'flex-start', gap: '6px', background: 'rgba(45,106,79,0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(45,106,79,0.1)' }}>
                                  <span>💡</span>
                                  <div>
                                    <strong>가이드:</strong> 양평군 평균적으로 <strong>{cropName}</strong>은(는) 1㎡당 약 {(
                                      cropName.includes('감자') ? 3.0 : 
                                      cropName.includes('양파') ? 6.2 : 
                                      cropName.includes('배추') ? 8.5 : 
                                      cropName.includes('무') ? 7.0 : 2.5
                                    )}kg 생산됩니다.<br/>
                                    <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                                      입력하신 면적({cult.area}㎡) 기준, 약 <strong>{(Number(cult.area) * (
                                        cropName.includes('감자') ? 3.0 : 
                                        cropName.includes('양파') ? 6.2 : 
                                        cropName.includes('배추') ? 8.5 : 
                                        cropName.includes('무') ? 7.0 : 2.5
                                      )).toLocaleString()}kg</strong> 수확을 예상해 볼 수 있습니다.
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div style={{ flex: 1 }}>
                              <Input
                                label="예상 총생산량 (kg)"
                                type="number"
                                value={cult.expectedYield}
                                onChange={(e) => handleCultivationChange(cult.cropId, 'expectedYield', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className={styles.cardTitle} style={{ marginBottom: 0 }}>토양 정보 (선택)</h3>
              {isAnalyzing && <span style={{ fontSize: '12px', color: 'var(--color-primary)' }}>🔍 분석 중...</span>}
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
