import { useState, useEffect } from 'react'
import Modal from '@/components/common/Modal/Modal'
import Button from '@/components/common/Button/Button'
import Dropdown from '@/components/common/Dropdown/Dropdown'
import { useToast } from '@/components'
import styles from './NoticeCreateModal.module.css'

interface NoticeCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: { title: string; content: string; categoryId: number }) => void
}

export default function NoticeCreateModal({ isOpen, onClose, onConfirm }: NoticeCreateModalProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState<string>('1')
  const [categories, setCategories] = useState<{ label: string; value: string }[]>([])
  
  const toast = useToast()

  useEffect(() => {
    if (isOpen) {
      // 카테고리 목록을 불러옵니다.
      fetch('/api/community/categories')
        .then(res => res.json())
        .then(json => {
          if (json.success && json.data) {
            const opts = json.data.map((c: any) => ({ label: c.name, value: String(c.id) }))
            setCategories(opts)
            if (opts.length > 0) setCategoryId(opts[0].value)
          }
        })
        .catch(() => {
          // fallback
          setCategories([{ label: '일반/공지', value: '1' }])
        })
    }
  }, [isOpen])

  const handleClose = () => {
    setTitle('')
    setContent('')
    onClose()
  }

  const handleConfirm = () => {
    if (!title.trim()) {
      toast.error('공지 제목을 입력해주세요.')
      return
    }
    if (!content.trim()) {
      toast.error('공지 내용을 입력해주세요.')
      return
    }
    onConfirm({
      title,
      content,
      categoryId: parseInt(categoryId, 10),
    })
    handleClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="📢 신규 공지사항 작성" size="md">
      <div className={styles.container}>
        <div className={styles.formGroup}>
          <label>카테고리</label>
          <Dropdown
            options={categories.length > 0 ? categories : [{ label: '로딩중...', value: '1' }]}
            value={categoryId}
            onChange={setCategoryId}
          />
        </div>

        <div className={styles.formGroup}>
          <label>제목</label>
          <input
            type="text"
            className={styles.input}
            placeholder="공지사항 제목을 입력하세요"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label>내용</label>
          <textarea
            className={styles.textarea}
            placeholder="공지사항 내용을 상세하게 작성해주세요..."
            rows={10}
            value={content}
            onChange={e => setContent(e.target.value)}
          />
        </div>

        <div className={styles.actions}>
          <Button variant="outline" onClick={handleClose}>취소</Button>
          <Button variant="primary" onClick={handleConfirm}>공지 등록</Button>
        </div>
      </div>
    </Modal>
  )
}
