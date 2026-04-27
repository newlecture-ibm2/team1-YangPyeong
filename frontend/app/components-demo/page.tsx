'use client';

import { useState } from 'react';
import Badge from '@/components/common/Badge/Badge';
import Button from '@/components/common/Button/Button';
import Card from '@/components/common/Card/Card';
import Input from '@/components/common/Input/Input';
import Modal from '@/components/common/Modal/Modal';
import styles from './page.module.css';

export default function ComponentsDemoPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

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
              <Input 
                as="select" 
                label="Select Box"
                options={[
                  { label: '옵션 1 선택', value: '1' },
                  { label: '옵션 2 선택', value: '2' }
                ]}
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

    </div>
  );
}
