'use client'

import { useState, useEffect, useCallback } from 'react'
import Modal from '@/components/common/Modal'
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

type Tab = 'categories' | 'documents'

export default function RagPage() {
  const [tab, setTab] = useState<Tab>('documents')
  const [categories, setCategories] = useState<RagCategory[]>([])
  const [documents, setDocuments] = useState<RagDocument[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>()
  const [loading, setLoading] = useState(true)

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
    } catch (e) {
      console.error(e)
    }
  }, [])

  const loadDocuments = useCallback(async () => {
    try {
      const data = await fetchDocuments(selectedCategoryId)
      setDocuments(data)
    } catch (e) {
      console.error(e)
    }
  }, [selectedCategoryId])

  useEffect(() => {
    setLoading(true)
    Promise.all([loadCategories(), loadDocuments()]).finally(() => setLoading(false))
  }, [loadCategories, loadDocuments])

  // ── 카테고리 CRUD ──
  const handleSaveCategory = async (data: CreateRagCategoryRequest | UpdateRagCategoryRequest) => {
    if (editingCategory) {
      await updateCategory(editingCategory.id, data as UpdateRagCategoryRequest)
    } else {
      await createCategory(data as CreateRagCategoryRequest)
    }
    setShowCategoryModal(false)
    setEditingCategory(null)
    await loadCategories()
  }

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('이 카테고리를 삭제하시겠습니까?')) return
    await deleteCategory(id)
    await loadCategories()
  }

  // ── 문서 CRUD ──
  const handleSaveDocument = async (data: CreateRagDocumentRequest | UpdateRagDocumentRequest) => {
    if (editingDocument) {
      await updateDocument(editingDocument.id, data as UpdateRagDocumentRequest)
    } else {
      await createDocument(data as CreateRagDocumentRequest)
    }
    setShowDocumentModal(false)
    setEditingDocument(null)
    await loadDocuments()
  }

  const handleDeleteDocument = async (id: number) => {
    if (!confirm('이 문서를 삭제하시겠습니까?')) return
    await deleteDocument(id)
    await loadDocuments()
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
        <h1 className={styles.title}>RAG 데이터 관리</h1>
        <p className={styles.subtitle}>AI 챗봇이 참조하는 문서와 카테고리를 관리합니다.</p>
      </div>

      {/* 탭 */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'documents' ? styles.tabActive : ''}`}
          onClick={() => setTab('documents')}
        >
          📄 문서 관리
        </button>
        <button
          className={`${styles.tab} ${tab === 'categories' ? styles.tabActive : ''}`}
          onClick={() => setTab('categories')}
        >
          🗂️ 카테고리 관리
        </button>
      </div>

      {/* ════ 문서 탭 ════ */}
      {tab === 'documents' && (
        <>
          <div className={styles.toolbar}>
            <div className={styles.filterRow}>
              <select
                className={styles.select}
                value={selectedCategoryId ?? ''}
                onChange={(e) =>
                  setSelectedCategoryId(e.target.value ? Number(e.target.value) : undefined)
                }
              >
                <option value="">전체 카테고리</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              className={styles.addBtn}
              onClick={() => {
                setEditingDocument(null)
                setShowDocumentModal(true)
              }}
            >
              + 문서 추가
            </button>
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
                      <span className={doc.contentType === 'FILE' ? styles.badgeFile : styles.badgeText}>
                        {doc.contentType}
                      </span>
                    </td>
                    <td>
                      <div className={styles.textPreview}>
                        {doc.contentType === 'TEXT'
                          ? doc.textContent ?? '-'
                          : doc.fileName ?? doc.fileUrl ?? '-'}
                      </div>
                    </td>
                    <td>
                      <span className={doc.status === 'ACTIVE' ? styles.badgeActive : styles.badgeInactive}>
                        {doc.status === 'ACTIVE' ? '활성' : '삭제됨'}
                      </span>
                    </td>
                    <td>{new Date(doc.createdAt).toLocaleDateString('ko-KR')}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.editBtn}
                          onClick={() => {
                            setEditingDocument(doc)
                            setShowDocumentModal(true)
                          }}
                        >
                          수정
                        </button>
                        <button className={styles.deleteBtn} onClick={() => handleDeleteDocument(doc.id)}>
                          삭제
                        </button>
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
          <div className={styles.toolbar}>
            <div />
            <button
              className={styles.addBtn}
              onClick={() => {
                setEditingCategory(null)
                setShowCategoryModal(true)
              }}
            >
              + 카테고리 추가
            </button>
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
                      <span className={cat.isActive ? styles.badgeActive : styles.badgeInactive}>
                        {cat.isActive ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td>{new Date(cat.createdAt).toLocaleDateString('ko-KR')}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.editBtn}
                          onClick={() => {
                            setEditingCategory(cat)
                            setShowCategoryModal(true)
                          }}
                        >
                          수정
                        </button>
                        <button className={styles.deleteBtn} onClick={() => handleDeleteCategory(cat.id)}>
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

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
  const [isActive, setIsActive] = useState(category?.isActive ?? true)

  const handleSubmit = () => {
    if (!name.trim()) return alert('카테고리명을 입력하세요.')
    onSave({ name, description, displayOrder, ...(category ? { isActive } : {}) })
  }

  return (
    <Modal isOpen={true} title={category ? '카테고리 수정' : '카테고리 추가'} onClose={onClose}>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>카테고리명 *</label>
        <input className={styles.formInput} value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 정책, 병해충, 재배기술" />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>설명</label>
        <input className={styles.formInput} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="카테고리에 대한 설명" />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>표시 순서</label>
        <input className={styles.formInput} type="number" value={displayOrder} onChange={(e) => setDisplayOrder(Number(e.target.value))} />
      </div>
      {category && (
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>활성 여부</label>
          <select className={styles.formSelect} value={isActive ? 'true' : 'false'} onChange={(e) => setIsActive(e.target.value === 'true')}>
            <option value="true">활성</option>
            <option value="false">비활성</option>
          </select>
        </div>
      )}
      <div className={styles.formActions}>
        <button className={styles.cancelBtn} onClick={onClose}>취소</button>
        <button className={styles.submitBtn} onClick={handleSubmit}>{category ? '수정' : '생성'}</button>
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
  const [categoryId, setCategoryId] = useState(doc?.categoryId ?? (categories[0]?.id ?? 0))
  const [title, setTitle] = useState(doc?.title ?? '')
  const [contentType, setContentType] = useState<'FILE' | 'TEXT'>(doc?.contentType ?? 'TEXT')
  const [textContent, setTextContent] = useState(doc?.textContent ?? '')
  const [fileUrl, setFileUrl] = useState(doc?.fileUrl ?? '')
  const [fileName, setFileName] = useState(doc?.fileName ?? '')
  const [fileType, setFileType] = useState<'PDF' | 'TXT' | 'MD' | 'DOCX'>(doc?.fileType ?? 'PDF')

  const handleSubmit = () => {
    if (!title.trim()) return alert('문서 제목을 입력하세요.')
    if (contentType === 'TEXT' && !textContent.trim()) return alert('텍스트 내용을 입력하세요.')
    if (contentType === 'FILE' && !fileUrl.trim()) return alert('파일 URL을 입력하세요.')

    const data: CreateRagDocumentRequest = {
      categoryId,
      title,
      contentType,
      ...(contentType === 'TEXT' ? { textContent } : { fileUrl, fileName, fileType }),
    }
    onSave(data)
  }

  return (
    <Modal isOpen={true} title={doc ? '문서 수정' : '문서 추가'} onClose={onClose}>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>카테고리 *</label>
        <select className={styles.formSelect} value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>문서 제목 *</label>
        <input className={styles.formInput} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 양평군 벼 재배 매뉴얼" />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>저장 유형 *</label>
        <select className={styles.formSelect} value={contentType} onChange={(e) => setContentType(e.target.value as 'FILE' | 'TEXT')}>
          <option value="TEXT">텍스트 직접 입력</option>
          <option value="FILE">파일 URL</option>
        </select>
      </div>

      {contentType === 'TEXT' ? (
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>텍스트 내용 *</label>
          <textarea className={styles.formTextarea} value={textContent} onChange={(e) => setTextContent(e.target.value)} placeholder="RAG에 활용될 텍스트 내용을 입력하세요..." />
        </div>
      ) : (
        <>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>파일 URL *</label>
            <input className={styles.formInput} value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>원본 파일명</label>
            <input className={styles.formInput} value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="매뉴얼.pdf" />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>파일 형식</label>
            <select className={styles.formSelect} value={fileType} onChange={(e) => setFileType(e.target.value as 'PDF' | 'TXT' | 'MD' | 'DOCX')}>
              <option value="PDF">PDF</option>
              <option value="TXT">TXT</option>
              <option value="MD">MD</option>
              <option value="DOCX">DOCX</option>
            </select>
          </div>
        </>
      )}

      <div className={styles.formActions}>
        <button className={styles.cancelBtn} onClick={onClose}>취소</button>
        <button className={styles.submitBtn} onClick={handleSubmit}>{doc ? '수정' : '등록'}</button>
      </div>
    </Modal>
  )
}
