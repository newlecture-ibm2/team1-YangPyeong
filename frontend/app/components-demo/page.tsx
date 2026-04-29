'use client';

import { useState } from 'react';
import Badge from '@/components/common/Badge/Badge';
import Button from '@/components/common/Button/Button';
import Card from '@/components/common/Card/Card';
import Input from '@/components/common/Input/Input';
import Modal from '@/components/common/Modal/Modal';
import Dropdown from '@/components/common/Dropdown/Dropdown';
import SearchInput from '@/components/common/SearchInput/SearchInput';
import FilterBar from '@/components/common/FilterBar/FilterBar';
import { useToast } from '@/components/common/Toast';
import styles from './page.module.css';

export default function ComponentsDemoPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toast = useToast();

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>🎨 FarmBalance UI Components Demo</h1>

      {/* 1. Button Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>1. Buttons</h2>
        
        <div className={styles.box}>
          <h3 style={{ marginBottom: '16px' }}>Variants</h3>
          <div className={styles.row}>
            <Button variant="primary">Primary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="dark">Dark</Button>
            <Button variant="kakao">Kakao</Button>
            <Button disabled>Disabled</Button>
          </div>
        </div>

        <div className={styles.box}>
          <h3 style={{ marginBottom: '16px' }}>Sizes</h3>
          <div className={styles.row}>
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
        </div>
      </section>

      {/* 2. Badge Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>2. Badges</h2>
        <div className={styles.box}>
          <div className={styles.row}>
            <Badge variant="green">Green (Default)</Badge>
            <Badge variant="lime">Lime</Badge>
            <Badge variant="orange">Orange</Badge>
            <Badge variant="red">Red</Badge>
            <Badge variant="gray">Gray</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="dark">Dark</Badge>
          </div>
        </div>
      </section>

      {/* 3. Input Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>3. Inputs & Forms</h2>
        <div className={styles.box}>
          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <Input label="Default Input" placeholder="텍스트를 입력하세요" />
              <Input label="Required Input" required placeholder="필수 입력값입니다" />
              <Input label="Disabled Input" disabled value="수정할 수 없습니다" />
            </div>
            
            <div className={styles.inputGroup}>
              <Dropdown 
                label="Select Box"
                options={[
                  { label: '옵션 1 선택', value: '1' },
                  { label: '옵션 2 선택', value: '2' }
                ]}
                placeholder="선택하세요"
              />
              <Input 
                as="textarea" 
                label="Textarea" 
                placeholder="여러 줄의 텍스트를 입력하세요" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. Card Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>4. Cards</h2>
        <div className={styles.box}>
          <div className={styles.grid}>
            <Card>
              <h3>Default Card</h3>
              <p style={{ color: '#666', marginTop: '8px' }}>
                기본적인 흰색 배경의 카드입니다. 내용물을 감싸는 역할을 합니다.
              </p>
            </Card>

            <Card variant="dark">
              <h3 style={{ color: '#fff' }}>Dark Card</h3>
              <p style={{ color: '#aaa', marginTop: '8px' }}>
                어두운 배경의 카드입니다. KPI나 주요 지표를 강조할 때 사용합니다.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* 5. Modal Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>5. Modals</h2>
        <div className={styles.box}>
          <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
          
          <Modal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)}
            title="모달 타이틀"
          >
            <p style={{ marginBottom: '24px' }}>
              이곳에 모달의 메인 컨텐츠가 들어갑니다. 백그라운드를 클릭하거나 우측 상단의 X 버튼, 또는 ESC 키를 눌러 닫을 수 있습니다.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>취소</Button>
              <Button onClick={() => setIsModalOpen(false)}>확인</Button>
            </div>
          </Modal>
        </div>
      </section>

      {/* 6. FilterBar & Search Components Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>6. Filters & Search</h2>
        <div className={styles.box}>
          <h3 style={{ marginBottom: '16px' }}>FilterBar (Combined)</h3>
          <p style={{ color: '#666', marginBottom: '16px', fontSize: '14px' }}>
            상단 필터 영역에 공통으로 쓰이는 레이아웃입니다. 모바일에서는 자동으로 세로 정렬됩니다.
          </p>
          <FilterBar
            dropdowns={[
              <Dropdown
                key="crop"
                options={[
                  { value: 'all', label: '전체 작물' },
                  { value: 'lettuce', label: '상추' },
                  { value: 'cabbage', label: '배추' }
                ]}
                value="all"
              />,
              <Dropdown
                key="status"
                options={[
                  { value: 'all', label: '전체 상태' },
                  { value: 'active', label: '판매중' },
                  { value: 'soldout', label: '품절' }
                ]}
                value="all"
              />
            ]}
            search={
              <SearchInput
                placeholder="작물명 검색..."
                onSearch={(val) => alert(`Search: ${val}`)}
              />
            }
          />

          <div className={styles.row} style={{ marginTop: '32px' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ marginBottom: '16px' }}>Individual Dropdown</h3>
              <Dropdown
                label="단독 사용 예시"
                options={[
                  { value: '1', label: '옵션 1' },
                  { value: '2', label: '옵션 2' }
                ]}
                placeholder="선택하세요"
              />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ marginBottom: '16px' }}>Individual SearchInput</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <SearchInput placeholder="아이콘만 있는 검색창" />
                <SearchInput 
                  placeholder="버튼이 포함된 검색창" 
                  onSearch={(val) => alert(val)} 
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Toast Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>7. Toast Notifications</h2>
        <div className={styles.box}>
          <h3 style={{ marginBottom: '16px' }}>알림 종류</h3>
          <div className={styles.row}>
            <Button 
              variant="primary" 
              onClick={() => toast.success('성공적으로 저장되었습니다!')}
            >
              성공 토스트 띄우기
            </Button>
            <Button 
              variant="outline" 
              onClick={() => toast.error('오류가 발생했습니다. 다시 시도해주세요.')}
            >
              에러 토스트 띄우기
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => toast.info('새로운 알림이 도착했습니다.')}
            >
              정보 토스트 띄우기
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
}
