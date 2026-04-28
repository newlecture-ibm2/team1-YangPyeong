'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Modal from '@/components/common/Modal/Modal'
import Button from '@/components/common/Button/Button'
import Badge from '@/components/common/Badge/Badge'
import Card from '@/components/common/Card/Card'
import Input from '@/components/common/Input/Input'
import Dropdown from '@/components/common/Dropdown/Dropdown'
import FilterBar from '@/components/common/FilterBar/FilterBar'
import { useToast } from '@/components/common/Toast'
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
} from '../_lib/rag.api'

type Tab = 'documents' | 'categories'

export default function RagPage() {
  const [tab, setTab] = useState<Tab>('documents')
  const [categories, setCategories] = useState<RagCategory[]>([])
  const [documents, setDocuments] = useState<RagDocument[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const toast = useToast()
  const toastRef = useRef(toast)
  toastRef.current = toast

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
    if (!window.confirm('이 카테고리를 삭제하시겠습니까?')) return
    try {
      await deleteCategory(id)
      toast.success('카테고리가 삭제되었습니다.')
      await loadCategories()
    } catch (e: any) {
      toast.error(e.message || '삭제 중 오류가 발생했습니다.')
    }
  }

  // ── 문서 CRUD ──
  const handleSaveDocument = async (data: CreateRagDocumentRequest | UpdateRagDocumentRequest) => {
    try {
      if (editingDocument) {
        await updateDocument(editingDocument.id, data as UpdateRagDocumentRequest)
        toast.success('문서가 수정되었습니다.')
      } else {
        await createDocument(data as CreateRagDocumentRequest)
        toast.success('문서가 등록되었습니다.')
      }
      setShowDocumentModal(false)
      setEditingDocument(null)
      await loadDocuments()
    } catch (e: any) {
      toast.error(e.message || '저장 중 오류가 발생했습니다.')
    }
  }

  const handleDeleteDocument = async (id: number) => {
    if (!window.confirm('이 문서를 삭제하시겠습니까?')) return
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

  if (loading) {
    return <div className={styles.loading}>데이터를 불러오는 중...</div>
  }

  return (
    <div className={styles.ragPage}>
      {/* 헤더 */}
      <div className={styles.header}>
        <h1 className={styles.title}>🤖 RAG 데이터 관리</h1>
        <p className={styles.subtitle}>AI 챗봇이 참조하는 문서와 카테고리를 관리합니다.</p>
      </div>

      {/* 탭 */}
      <div className={styles.tabs}>
        <Button
          variant={tab === 'documents' ? 'primary' : 'outline'}
          onClick={() => setTab('documents')}
        >
          📄 문서 관리
        </Button>
        <Button
          variant={tab === 'categories' ? 'primary' : 'outline'}
          onClick={() => setTab('categories')}
        >
          🗂️ 카테고리 관리
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

            {documents.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>📭</div>
                등록된 문서가 없습니다.
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>제목</th>
                    <th>카테고리</th>
                    <th>유형</th>
                    <th>내용 미리보기</th>
                    <th>상태</th>
                    <th>등록일</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id}>
                      <td><strong>{doc.title}</strong></td>
                      <td>{getCategoryName(doc.categoryId)}</td>
                      <td>
                        <Badge variant={doc.contentType === 'FILE' ? 'dark' : 'outline'}>
                          {doc.contentType}
                        </Badge>
                      </td>
                      <td>
                        <div className={styles.textPreview}>
                          {doc.contentType === 'TEXT'
                            ? doc.textContent ?? '-'
                            : doc.fileName ?? doc.fileUrl ?? '-'}
                        </div>
                      </td>
                      <td>
                        <Badge variant={doc.status === 'ACTIVE' ? 'green' : 'red'}>
                          {doc.status === 'ACTIVE' ? '활성' : '삭제됨'}
                        </Badge>
                      </td>
                      <td>{new Date(doc.createdAt).toLocaleDateString('ko-KR')}</td>
                      <td>
                        <div className={styles.actions}>
                          <Button size="sm" variant="outline" onClick={() => {
                            setEditingDocument(doc)
                            setShowDocumentModal(true)
                          }}>수정</Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteDocument(doc.id)} className={styles.dangerText}>
                            삭제
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>카테고리명</th>
                    <th>설명</th>
                    <th>표시 순서</th>
                    <th>상태</th>
                    <th>등록일</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.id}>
                      <td><strong>{cat.name}</strong></td>
                      <td>{cat.description ?? '-'}</td>
                      <td>{cat.displayOrder}</td>
                      <td>
                        <Badge variant={cat.isActive ? 'green' : 'gray'}>
                          {cat.isActive ? '활성' : '비활성'}
                        </Badge>
                      </td>
                      <td>{new Date(cat.createdAt).toLocaleDateString('ko-KR')}</td>
                      <td>
                        <div className={styles.actions}>
                          <Button size="sm" variant="outline" onClick={() => {
                            setEditingCategory(cat)
                            setShowCategoryModal(true)
                          }}>수정</Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteCategory(cat.id)} className={styles.dangerText}>
                            삭제
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
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
  onSave: (data: CreateRagDocumentRequest | UpdateRagDocumentRequest) => Promise<void>
  onClose: () => void
}

function DocumentFormModal({ document: doc, categories, onSave, onClose }: DocumentFormProps) {
  const [categoryId, setCategoryId] = useState(String(doc?.categoryId ?? (categories[0]?.id ?? '')))
  const [title, setTitle] = useState(doc?.title ?? '')
  const [contentType, setContentType] = useState<'FILE' | 'TEXT'>(doc?.contentType ?? 'TEXT')
  const [textContent, setTextContent] = useState(doc?.textContent ?? '')
  const [fileUrl, setFileUrl] = useState(doc?.fileUrl ?? '')
  const [fileName, setFileName] = useState(doc?.fileName ?? '')
  const [fileType, setFileType] = useState(doc?.fileType ?? 'PDF')
  const toast = useToast()

  const handleSubmit = () => {
    if (!title.trim()) return toast.error('문서 제목을 입력하세요.')
    if (contentType === 'TEXT' && !textContent.trim()) return toast.error('텍스트 내용을 입력하세요.')
    if (contentType === 'FILE' && !fileUrl.trim()) return toast.error('파일 URL을 입력하세요.')
    if (!categoryId) return toast.error('카테고리를 선택하세요.')

    const data: CreateRagDocumentRequest = {
      categoryId: Number(categoryId),
      title,
      contentType,
      ...(contentType === 'TEXT' ? { textContent } : { fileUrl, fileName, fileType: fileType as any }),
    }
    onSave(data)
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
          options={[{ value: 'TEXT', label: '텍스트 직접 입력' }, { value: 'FILE', label: '파일 URL' }]}
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
            <Input label="파일 URL *" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className={styles.formGroup}>
            <Input label="원본 파일명" value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="매뉴얼.pdf" />
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
