'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Modal from '@/components/common/Modal/Modal'
import Button from '@/components/common/Button/Button'
import Badge from '@/components/common/Badge/Badge'
import Card from '@/components/common/Card/Card'
import Input from '@/components/common/Input/Input'
import Dropdown from '@/components/common/Dropdown/Dropdown'
import FilterBar from '@/components/common/FilterBar/FilterBar'
import ModalDialog from '@/components/common/Modal/ModalDialog'
import { useModalDialog } from '@/components/common/Modal/useModalDialog'
import { useToast } from '@/components/common/Toast'
import ResponsiveTable from '@/components/common/ResponsiveTable/ResponsiveTable'
import styles from './RagPage.module.css'
import type {
  RagCategory,
  RagDocument,
  CreateRagCategoryRequest,
  UpdateRagCategoryRequest,
  CreateRagDocumentRequest,
  UpdateRagDocumentRequest,
} from '../_lib/rag.types'
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  fetchDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  syncDocuments,
  syncGraphRag,
} from '../_lib/rag.api'

type Tab = 'documents' | 'categories' | 'graph'

export default function RagPage() {
  const [tab, setTab] = useState<Tab>('documents')
  const [categories, setCategories] = useState<RagCategory[]>([])
  const [documents, setDocuments] = useState<RagDocument[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [isGraphSyncing, setIsGraphSyncing] = useState(false)
  const toast = useToast()
  const toastRef = useRef(toast)
  toastRef.current = toast
  const { dialog, showConfirm, handleConfirm, handleClose } = useModalDialog()

  // 모달 상태
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<RagCategory | null>(null)
  const [editingDocument, setEditingDocument] = useState<RagDocument | null>(null)

  // 데이터 로드
  const loadCategories = useCallback(async () => {
    try {
      const data = await fetchCategories()
      setCategories(data)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '카테고리 목록을 불러오지 못했습니다.'
      toastRef.current.error(msg)
    }
  }, [])

  const loadDocuments = useCallback(async () => {
    try {
      const categoryId = selectedCategoryId !== 'all' ? Number(selectedCategoryId) : undefined
      const data = await fetchDocuments(categoryId)
      setDocuments(data)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '문서 목록을 불러오지 못했습니다.'
      toastRef.current.error(msg)
    }
  }, [selectedCategoryId])

  useEffect(() => {
    setLoading(true)
    Promise.all([loadCategories(), loadDocuments()]).finally(() => setLoading(false))
  }, [loadCategories, loadDocuments])

  // ── 카테고리 CRUD ──
  const handleSaveCategory = async (data: CreateRagCategoryRequest | UpdateRagCategoryRequest) => {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, data as UpdateRagCategoryRequest)
        toast.success('카테고리가 수정되었습니다.')
      } else {
        await createCategory(data as CreateRagCategoryRequest)
        toast.success('카테고리가 생성되었습니다.')
      }
      setShowCategoryModal(false)
      setEditingCategory(null)
      await loadCategories()
    } catch (e: any) {
      toast.error(e.message || '저장 중 오류가 발생했습니다.')
    }
  }

  const handleDeleteCategory = async (id: number) => {
    const confirmed = await showConfirm('이 카테고리를 삭제하시겠습니까?')
    if (!confirmed) return
    try {
      await deleteCategory(id)
      toast.success('카테고리가 삭제되었습니다.')
      await loadCategories()
    } catch (e: any) {
      toast.error(e.message || '삭제 중 오류가 발생했습니다.')
    }
  }

  // ── 문서 CRUD ──
  const handleSaveDocument = async (data: CreateRagDocumentRequest | UpdateRagDocumentRequest, file?: File) => {
    try {
      if (editingDocument) {
        await updateDocument(editingDocument.id, data as UpdateRagDocumentRequest)
        toast.success('문서가 수정되었습니다.')
      } else {
        await createDocument(data as CreateRagDocumentRequest, file)
        toast.success('문서가 등록되었습니다.')
      }
      setShowDocumentModal(false)
      setEditingDocument(null)
      await loadDocuments()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '저장 중 오류가 발생했습니다.'
      toast.error(msg)
    }
  }

  const handleDeleteDocument = async (id: number) => {
    const confirmed = await showConfirm('이 문서를 삭제하시겠습니까?')
    if (!confirmed) return
    try {
      await deleteDocument(id)
      toast.success('문서가 삭제되었습니다.')
      await loadDocuments()
    } catch (e: any) {
      toast.error(e.message || '삭제 중 오류가 발생했습니다.')
    }
  }

  // 카테고리 이름 조회 헬퍼
  const getCategoryName = (categoryId: number): string => {
    return categories.find((c) => c.id === categoryId)?.name ?? '-'
  }

  const handleSync = async () => {
    try {
      toast.info('AI 챗봇 일반 지식 동기화를 시작합니다. 시간이 걸릴 수 있습니다.')
      await syncDocuments()
      toast.success('동기화가 완료되었습니다. 이제 챗봇이 최신 문서를 사용합니다.')
    } catch (e: any) {
      toast.error(e.message || '동기화 중 오류가 발생했습니다.')
    }
  }

  const handleGraphSync = async () => {
    try {
      setIsGraphSyncing(true)
      toast.info('AI 추천용 지식 그래프 재구축을 시작합니다. 잠시만 기다려주세요.')
      await syncGraphRag()
      toast.success('AI 지식 그래프 갱신이 완료되었습니다! 이제 AI가 최신 데이터를 바탕으로 추천합니다.')
    } catch (e: any) {
      toast.error(e.message || '지식 그래프 동기화 중 오류가 발생했습니다.')
    } finally {
      setIsGraphSyncing(false)
    }
  }

  if (loading) {
    return <div className={styles.loading}>데이터를 불러오는 중...</div>
  }

  return (
    <div className={styles.ragPage}>
      {/* 헤더 */}
      <div className={styles.header}>
        <h1 className={styles.title}>AI 챗봇 학습 데이터 관리</h1>
        <p className={styles.subtitle}>AI 챗봇이 농업인들에게 정확한 답변과 맞춤형 추천을 제공할 수 있도록, 기초 지식(매뉴얼, 정책)과 데이터 연결망을 관리합니다.</p>
      </div>

      {/* 탭 */}
      <div className={styles.tabs}>
        <Button
          variant={tab === 'documents' ? 'primary' : 'outline'}
          onClick={() => setTab('documents')}
        >
          📄 일반 지식 (문서) 관리
        </Button>
        <Button
          variant={tab === 'categories' ? 'primary' : 'outline'}
          onClick={() => setTab('categories')}
        >
          🗂️ 지식 카테고리 관리
        </Button>
        <Button
          variant={tab === 'graph' ? 'primary' : 'outline'}
          onClick={() => setTab('graph')}
        >
          🕸️ 추천용 지식 그래프 관리
        </Button>
      </div>

      <Card>
        {/* ════ 문서 탭 ════ */}
        {tab === 'documents' && (
          <>
            <div className={styles.toolbar}>
              <div style={{ flex: 1, maxWidth: '400px' }}>
                <FilterBar
                  dropdowns={[
                    <Dropdown
                      key="category"
                      options={[
                        { value: 'all', label: '전체 카테고리' },
                        ...categories.map(c => ({ value: String(c.id), label: c.name }))
                      ]}
                      value={selectedCategoryId}
                      onChange={setSelectedCategoryId}
                    />
                  ]}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="outline" onClick={handleSync}>
                  🔄 AI 챗봇 동기화
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setEditingDocument(null)
                    setShowDocumentModal(true)
                  }}
                >
                  + 문서 추가
                </Button>
              </div>
            </div>

            {documents.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>📭</div>
                등록된 문서가 없습니다.
              </div>
            ) : (
              <ResponsiveTable<RagDocument & Record<string, unknown>>
                columns={[
                  { key: 'title', label: '제목', render: (doc) => <strong>{doc.title}</strong> },
                  { key: 'category', label: '카테고리', render: (doc) => getCategoryName(doc.categoryId) },
                  { key: 'contentType', label: '유형', render: (doc) => (
                    <Badge variant={doc.contentType === 'FILE' ? 'dark' : 'outline'}>
                      {doc.contentType}
                    </Badge>
                  )},
                  { key: 'preview', label: '내용 미리보기', render: (doc) => (
                    <div className={styles.textPreview}>
                      {doc.contentType === 'TEXT'
                        ? doc.textContent ?? '-'
                        : doc.fileName ?? doc.fileUrl ?? '-'}
                    </div>
                  )},
                  { key: 'status', label: '상태', render: (doc) => (
                    <Badge variant={doc.status === 'ACTIVE' ? 'green' : 'red'}>
                      {doc.status === 'ACTIVE' ? '활성' : '삭제됨'}
                    </Badge>
                  )},
                  { key: 'createdAt', label: '등록일', render: (doc) => new Date(doc.createdAt).toLocaleDateString('ko-KR') },
                  { key: 'actions', label: '관리', render: (doc) => (
                    <div className={styles.actions}>
                      <Button size="sm" variant="outline" onClick={() => {
                        setEditingDocument(doc)
                        setShowDocumentModal(true)
                      }}>수정</Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteDocument(doc.id)} className={styles.dangerText}>
                        삭제
                      </Button>
                    </div>
                  )}
                ]}
                data={documents as any}
                rowKey={(doc) => String(doc.id)}
                emptyMessage="등록된 문서가 없습니다."
              />
            )}
          </>
        )}

        {/* ════ 카테고리 탭 ════ */}
        {tab === 'categories' && (
          <>
            <div className={styles.toolbar} style={{ justifyContent: 'flex-end' }}>
              <Button
                variant="primary"
                onClick={() => {
                  setEditingCategory(null)
                  setShowCategoryModal(true)
                }}
              >
                + 카테고리 추가
              </Button>
            </div>

            {categories.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>🗂️</div>
                등록된 카테고리가 없습니다.
              </div>
            ) : (
              <ResponsiveTable<RagCategory & Record<string, unknown>>
                columns={[
                  { key: 'name', label: '카테고리명', render: (cat) => <strong>{cat.name}</strong> },
                  { key: 'description', label: '설명', render: (cat) => cat.description ?? '-' },
                  { key: 'displayOrder', label: '표시 순서', render: (cat) => cat.displayOrder },
                  { key: 'isActive', label: '상태', render: (cat) => (
                    <Badge variant={cat.isActive ? 'green' : 'gray'}>
                      {cat.isActive ? '활성' : '비활성'}
                    </Badge>
                  )},
                  { key: 'createdAt', label: '등록일', render: (cat) => new Date(cat.createdAt).toLocaleDateString('ko-KR') },
                  { key: 'actions', label: '관리', render: (cat) => (
                    <div className={styles.actions}>
                      <Button size="sm" variant="outline" onClick={() => {
                        setEditingCategory(cat)
                        setShowCategoryModal(true)
                      }}>수정</Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteCategory(cat.id)} className={styles.dangerText}>
                        삭제
                      </Button>
                    </div>
                  )}
                ]}
                data={categories as any}
                rowKey={(cat) => String(cat.id)}
                emptyMessage="등록된 카테고리가 없습니다."
              />
            )}
          </>
        )}

        {/* ════ 지식 그래프 탭 ════ */}
        {tab === 'graph' && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--color-text)' }}>AI 추천용 지식 그래프 동기화</h2>
              <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                AI가 맞춤형 농작물 및 보조금 정책을 추천할 때 사용하는 <strong>'지식 그래프 데이터(지역 ↔ 작물 ↔ 정책 ↔ 농가)'</strong>를 최신 상태로 강제 갱신합니다.<br/>
                (기본적으로 매일 새벽 3시에 자동 갱신됩니다.)
              </p>
            </div>
            
            <div style={{ padding: '16px', backgroundColor: 'var(--color-background-soft)', borderRadius: '8px', borderLeft: '4px solid var(--color-warning)' }}>
              <p style={{ color: 'var(--color-warning-dark)', margin: 0, fontSize: '0.9rem' }}>
                <strong>※ 주의사항:</strong> 새로운 보조금 정책을 등록했거나 농가 정보가 크게 변경되어 <strong>즉시 AI에게 반영해야 할 경우</strong>에만 수동으로 실행해 주세요.
              </p>
            </div>

            <div style={{ marginTop: '16px' }}>
              <Button 
                variant="primary" 
                onClick={handleGraphSync} 
                disabled={isGraphSyncing}
                style={{ padding: '12px 24px', fontSize: '1.05rem' }}
              >
                {isGraphSyncing ? '⏳ AI 지식 그래프 재구축 중...' : '🔄 지식 그래프 수동 동기화'}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ════ 카테고리 모달 ════ */}
      {showCategoryModal && (
        <CategoryFormModal
          category={editingCategory}
          onSave={handleSaveCategory}
          onClose={() => {
            setShowCategoryModal(false)
            setEditingCategory(null)
          }}
        />
      )}

      {/* ════ 문서 모달 ════ */}
      {showDocumentModal && (
        <DocumentFormModal
          document={editingDocument}
          categories={categories}
          onSave={handleSaveDocument}
          onClose={() => {
            setShowDocumentModal(false)
            setEditingDocument(null)
          }}
        />
      )}

      <ModalDialog
        {...dialog}
        onConfirm={handleConfirm}
        onClose={handleClose}
      />
    </div>
  )
}

// ── 카테고리 폼 모달 ──
interface CategoryFormProps {
  category: RagCategory | null
  onSave: (data: CreateRagCategoryRequest | UpdateRagCategoryRequest) => Promise<void>
  onClose: () => void
}

function CategoryFormModal({ category, onSave, onClose }: CategoryFormProps) {
  const [name, setName] = useState(category?.name ?? '')
  const [description, setDescription] = useState(category?.description ?? '')
  const [displayOrder, setDisplayOrder] = useState(category?.displayOrder ?? 0)
  const [isActive, setIsActive] = useState(category?.isActive ? 'true' : 'false')
  const toast = useToast()

  const handleSubmit = () => {
    if (!name.trim()) return toast.error('카테고리명을 입력하세요.')
    onSave({ name, description, displayOrder, ...(category ? { isActive: isActive === 'true' } : {}) })
  }

  return (
    <Modal isOpen={true} title={category ? '카테고리 수정' : '카테고리 추가'} onClose={onClose}>
      <div className={styles.formGroup}>
        <Input label="카테고리명 *" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 정책, 병해충, 재배기술" />
      </div>
      <div className={styles.formGroup}>
        <Input label="설명" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="카테고리에 대한 설명" />
      </div>
      <div className={styles.formGroup}>
        <Input label="표시 순서" type="number" value={String(displayOrder)} onChange={(e) => setDisplayOrder(Number(e.target.value))} />
      </div>
      {category && (
        <div className={styles.formGroup}>
          <Dropdown
            label="활성 여부"
            options={[{ value: 'true', label: '활성' }, { value: 'false', label: '비활성' }]}
            value={isActive}
            onChange={(val) => setIsActive(val)}
          />
        </div>
      )}
      <div className={styles.formActions}>
        <Button variant="outline" onClick={onClose}>취소</Button>
        <Button variant="primary" onClick={handleSubmit}>{category ? '수정' : '생성'}</Button>
      </div>
    </Modal>
  )
}

// ── 문서 폼 모달 ──
interface DocumentFormProps {
  document: RagDocument | null
  categories: RagCategory[]
  onSave: (data: CreateRagDocumentRequest | UpdateRagDocumentRequest, file?: File) => Promise<void>
  onClose: () => void
}

function DocumentFormModal({ document: doc, categories, onSave, onClose }: DocumentFormProps) {
  const [categoryId, setCategoryId] = useState(String(doc?.categoryId ?? (categories[0]?.id ?? '')))
  const [title, setTitle] = useState(doc?.title ?? '')
  const [contentType, setContentType] = useState<'FILE' | 'TEXT'>(doc?.contentType ?? 'TEXT')
  const [textContent, setTextContent] = useState(doc?.textContent ?? '')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileType, setFileType] = useState(doc?.fileType ?? 'PDF')
  const toast = useToast()

  // 파일 선택 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // 확장자로 fileType 자동 판별
      const ext = file.name.split('.').pop()?.toUpperCase() ?? 'PDF'
      const validTypes: readonly string[] = ['PDF', 'TXT', 'MD', 'DOCX']
      setFileType(validTypes.includes(ext) ? (ext as 'PDF' | 'TXT' | 'MD' | 'DOCX') : 'PDF')
    }
  }

  const handleSubmit = () => {
    if (!title.trim()) return toast.error('문서 제목을 입력하세요.')
    if (contentType === 'TEXT' && !textContent.trim()) return toast.error('텍스트 내용을 입력하세요.')
    if (contentType === 'FILE' && !selectedFile && !doc) return toast.error('파일을 선택하세요.')
    if (!categoryId) return toast.error('카테고리를 선택하세요.')

    const data: CreateRagDocumentRequest = {
      categoryId: Number(categoryId),
      title,
      contentType,
      ...(contentType === 'TEXT'
        ? { textContent }
        : { fileType: fileType as 'PDF' | 'TXT' | 'MD' | 'DOCX' }),
    }
    onSave(data, selectedFile ?? undefined)
  }

  return (
    <Modal isOpen={true} title={doc ? '문서 수정' : '문서 추가'} onClose={onClose}>
      <div className={styles.formGroup}>
        <Dropdown
          label="카테고리 *"
          options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
          value={categoryId}
          onChange={(val) => setCategoryId(val)}
          placeholder="카테고리를 선택하세요"
        />
      </div>
      <div className={styles.formGroup}>
        <Input label="문서 제목 *" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 양평군 벼 재배 매뉴얼" />
      </div>
      <div className={styles.formGroup}>
        <Dropdown
          label="저장 유형 *"
          options={[{ value: 'TEXT', label: '텍스트 직접 입력' }, { value: 'FILE', label: '파일 첨부' }]}
          value={contentType}
          onChange={(val) => setContentType(val as 'FILE' | 'TEXT')}
        />
      </div>

      {contentType === 'TEXT' ? (
        <div className={styles.formGroup}>
          <Input as="textarea" label="텍스트 내용 *" value={textContent} onChange={(e) => setTextContent(e.target.value)} placeholder="RAG에 활용될 텍스트 내용을 입력하세요..." />
        </div>
      ) : (
        <>
          <div className={styles.formGroup}>
            <label className={styles.fileLabel}>
              파일 선택 *
              <input
                type="file"
                accept=".pdf,.txt,.md,.docx"
                onChange={handleFileChange}
                className={styles.fileInput}
              />
            </label>
            {selectedFile && (
              <div className={styles.fileInfo}>
                📎 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </div>
            )}
            {!selectedFile && doc?.fileName && (
              <div className={styles.fileInfo}>
                📎 기존 파일: {doc.fileName}
              </div>
            )}
          </div>
          <div className={styles.formGroup}>
            <Dropdown
              label="파일 형식"
              options={[
                { value: 'PDF', label: 'PDF' },
                { value: 'TXT', label: 'TXT' },
                { value: 'MD', label: 'MD' },
                { value: 'DOCX', label: 'DOCX' }
              ]}
              value={fileType}
              onChange={(val) => setFileType(val as 'PDF' | 'TXT' | 'MD' | 'DOCX')}
            />
          </div>
        </>
      )}

      <div className={styles.formActions}>
        <Button variant="outline" onClick={onClose}>취소</Button>
        <Button variant="primary" onClick={handleSubmit}>{doc ? '수정' : '등록'}</Button>
      </div>
    </Modal>
  )
}
