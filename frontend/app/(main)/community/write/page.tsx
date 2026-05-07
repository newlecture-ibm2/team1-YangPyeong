'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createPost, updatePost, getPostDetail, getCategories } from '../_lib/community.api';
import { uploadFile } from '@/lib/upload.api';
import styles from './PostWrite.module.css';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import type { CategoryResponse } from '../_lib/community.types';

/**
 * 게시글 작성/수정 페이지 (Client Component)
 */
import { Suspense } from 'react';

/**
 * 게시글 작성/수정 컨텐츠 (useSearchParams 사용으로 인해 Suspense 내부에 위치해야 함)
 */
function PostWriteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const postId = searchParams.get('postId');
  const isEditMode = !!postId;

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    categoryId: 1,
    content: '',
    isNotice: false,
  });

  // 카테고리 및 기존 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      const catRes = await getCategories();
      if (catRes.success && catRes.data) {
        setCategories(catRes.data);
      }

      if (isEditMode) {
        const postRes = await getPostDetail(Number(postId));
        if (postRes.success && postRes.data) {
          const { title, categoryId, content, isNotice } = postRes.data;
          setFormData({ title, categoryId, content, isNotice });
        }
      }
    };
    fetchData();
  }, [isEditMode, postId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const url = await uploadFile(file);
      // 에디터 내용에 이미지 삽입 (단순 텍스트 방식)
      setFormData(prev => ({
        ...prev,
        content: prev.content + `\n![이미지](${url})\n`
      }));
    } catch (error) {
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      alert('제목과 내용을 모두 입력해 주세요.');
      return;
    }

    setLoading(true);
    try {
      const response = isEditMode 
        ? await updatePost(Number(postId), formData)
        : await createPost(formData);

      if (response.success) {
        alert(isEditMode ? '수정되었습니다.' : '등록되었습니다.');
        router.push(isEditMode ? `/community/${postId}` : '/community');
        router.refresh();
      } else {
        alert(response.error?.message || '실패했습니다.');
      }
    } catch (error) {
      alert('오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1>{isEditMode ? '지식' : '새로운'} <em>{isEditMode ? '수정하기' : '지식 공유하기'}</em></h1>
        <p>{isEditMode ? '내용을 보완하여 지식을 풍성하게 만들어주세요.' : '파머들과 함께 나눌 소중한 정보를 작성해 주세요.'}</p>
      </header>

      <Card className={styles.formCard}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>카테고리</label>
            <select 
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value) })}
              className={styles.select}
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>제목</label>
            <input 
              type="text"
              placeholder="제목을 입력하세요"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={styles.input}
              maxLength={100}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <div className={styles.contentHeader}>
              <label>내용</label>
              <label className={styles.uploadBtn}>
                📷 이미지 첨부
                <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
              </label>
            </div>
            <textarea 
              placeholder="내용을 입력하세요"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className={styles.textarea}
              maxLength={5000}
              required
            ></textarea>
          </div>

          <div className={styles.submitSection}>
            <Button 
                variant="outline" 
                size="md" 
                type="button" 
                onClick={() => router.back()}
                disabled={loading}
            >
              취소
            </Button>
            <Button 
                variant="primary" 
                size="md" 
                type="submit" 
                disabled={loading}
            >
              {loading ? '등록 중...' : '등록하기'}
            </Button>
          </div>
        </form>
      </Card>
    </main>
  );
}

/**
 * 메인 페이지 컴포넌트
 */
export default function PostWritePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PostWriteContent />
    </Suspense>
  );
}
