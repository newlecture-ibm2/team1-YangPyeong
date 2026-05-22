'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Dropdown from '@/components/common/Dropdown/Dropdown'
import Button from '@/components/common/Button/Button'
import Badge from '@/components/common/Badge/Badge'
import SearchInput from '@/components/common/SearchInput/SearchInput'
import FilterBar from '@/components/common/FilterBar/FilterBar'
import ModalDialog from '@/components/common/Modal/ModalDialog'
import { useModalDialog } from '@/components/common/Modal/useModalDialog'
import ResponsiveTable from '@/components/common/ResponsiveTable/ResponsiveTable'
import { useToast } from '@/components/common/Toast'
import styles from './UserManagement.module.css'
import type { AdminUser, UserRole, ChangeableRole } from '../_lib/user.types'
import { ROLE_LABELS, STATUS_LABELS } from '../_lib/user.types'
import { fetchUsers, changeUserRole, changeUserStatus, createUser } from '../_lib/user.api'
import CreateAccountModal from './_components/CreateAccountModal'
import ReasonModal from '../community/_components/ReasonModal'
import type { CreateUserRequest } from '../_lib/user.types'

export default function UserManagementPage() {
  // 필터 상태
  const [keyword, setKeyword] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [page, setPage] = useState(0)
  const pageSize = 20

  // 데이터 상태
  const [users, setUsers] = useState<AdminUser[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const { dialog, showConfirm, handleConfirm, handleClose } = useModalDialog()

  const [reasonModalOpen, setReasonModalOpen] = useState(false)
  const [targetUserForReason, setTargetUserForReason] = useState<AdminUser | null>(null)
  
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const toast = useToast()
  const toastRef = useRef(toast)
  toastRef.current = toast

  // 데이터 로드
  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchUsers({
        keyword: keyword || undefined,
        role: roleFilter,
        status: statusFilter,
        page,
        size: pageSize,
      })
      
      // 마스킹 완료 유저(비식별화) 필터링: 이름이 "탈퇴한 사용자"인 경우 등
      const visibleUsers = result.users.filter(u => u.name !== '탈퇴한 사용자' && !u.email.startsWith('withdrawn-'))
      
      setUsers(visibleUsers)
      setTotalCount(result.meta.totalCount)
      setTotalPages(result.meta.totalPages)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '사용자 목록을 불러오지 못했습니다.'
      toastRef.current.error(msg)
    } finally {
      setLoading(false)
    }
  }, [keyword, roleFilter, statusFilter, page])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  // 검색 실행
  const handleSearch = (value: string) => {
    setKeyword(value)
    setPage(0)
  }

  // 역할 변경
  const handleRoleChange = async (userId: number, newRole: ChangeableRole) => {
    try {
      await changeUserRole(userId, { role: newRole })
      toast.success(`역할이 ${ROLE_LABELS[newRole]}(으)로 변경되었습니다.`)
      await loadUsers()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '역할 변경에 실패했습니다.'
      toast.error(msg)
    }
  }

  const handleStatusToggle = async (user: AdminUser) => {
    const isActive = user.status === 'ACTIVE'
    if (isActive) {
      // 정지(SUSPENDED) 처리 시 사유 입력 모달 띄우기
      setTargetUserForReason(user)
      setReasonModalOpen(true)
      return
    }

    const action = '재활성화'
    const confirmed = await showConfirm(`${user.name} 사용자를 ${action}하시겠습니까?`)
    if (!confirmed) return

    try {
      await changeUserStatus(user.id, { status: 'ACTIVE' })
      toast.success(`${user.name} 사용자가 ${action}되었습니다.`)
      await loadUsers()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : `${action}에 실패했습니다.`
      toast.error(msg)
    }
  }

  const handleSuspendConfirm = async (reason: string) => {
    if (!targetUserForReason) return
    try {
      await changeUserStatus(targetUserForReason.id, { status: 'SUSPENDED', reason })
      toast.success(`${targetUserForReason.name} 사용자가 정지되었습니다.`)
      setReasonModalOpen(false)
      await loadUsers()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '사용자 정지에 실패했습니다.'
      toast.error(msg)
    }
  }



  // 특수 계정(지자체/관리자) 발급
  const handleCreateUser = async (data: CreateUserRequest) => {
    try {
      await createUser(data)
      toast.success(`${ROLE_LABELS[data.role]} 계정(${data.email})이 성공적으로 발급되었습니다.`)
      setCreateModalOpen(false)
      await loadUsers()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '계정 발급에 실패했습니다.'
      toast.error(msg)
    }
  }

  // 역할 배지 variant (Badge 컴포넌트 실제 variant에 맞춤)
  const getRoleBadgeVariant = (role: UserRole): 'green' | 'lime' | 'orange' | 'gray' => {
    switch (role) {
      case 'FARMER': return 'green'
      case 'GOV': return 'lime'
      case 'ADMIN': return 'orange'
      default: return 'gray'
    }
  }

  // 필터 드롭다운 옵션
  const roleOptions = [
    { label: '역할: 전체', value: 'ALL' },
    { label: '일반', value: 'USER' },
    { label: '농부', value: 'FARMER' },
    { label: '지자체', value: 'GOV' },
  ]

  const statusOptions = [
    { label: '상태: 전체', value: 'ALL' },
    { label: '활성', value: 'ACTIVE' },
    { label: '정지', value: 'SUSPENDED' },
    { label: '탈퇴', value: 'WITHDRAWN' },
  ]

  // 역할 변경 드롭다운 옵션
  const changeableRoleOptions = [
    { label: '일반', value: 'USER' },
    { label: '농부', value: 'FARMER' },
  ]

  // 페이지 버튼 생성
  const renderPagination = () => {
    if (totalPages <= 1) return null
    const pages: number[] = []
    const start = Math.max(0, page - 2)
    const end = Math.min(totalPages - 1, page + 2)
    for (let i = start; i <= end; i++) pages.push(i)

    return (
      <div className={styles.pagination}>
        <button
          className={styles.pageBtn}
          disabled={page === 0}
          onClick={() => setPage(page - 1)}
        >
          ◀
        </button>
        {pages.map((p) => (
          <button
            key={p}
            className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ''}`}
            onClick={() => setPage(p)}
          >
            {p + 1}
          </button>
        ))}
        <button
          className={styles.pageBtn}
          disabled={page >= totalPages - 1}
          onClick={() => setPage(page + 1)}
        >
          ▶
        </button>
      </div>
    )
  }

  if (loading && users.length === 0) {
    return <div className={styles.loading}>데이터를 불러오는 중...</div>
  }

  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1 className={styles.title}>👥 사용자 관리</h1>
          <span className={styles.totalCount}>총 {totalCount.toLocaleString()}명</span>
        </div>
        <Button variant="primary" onClick={() => setCreateModalOpen(true)}>
          + 계정 발급
        </Button>
      </div>

      {/* 검색 + 필터 (FilterBar 공통 컴포넌트 패턴) */}
      <FilterBar
        dropdowns={[
          <Dropdown
            key="role"
            options={roleOptions}
            value={roleFilter}
            onChange={(val) => { setRoleFilter(val); setPage(0) }}
          />,
          <Dropdown
            key="status"
            options={statusOptions}
            value={statusFilter}
            onChange={(val) => { setStatusFilter(val); setPage(0) }}
          />,
        ]}
        search={
          <SearchInput
            placeholder="이름, 이메일 검색..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={handleSearch}
          />
        }
      />

      {/* 테이블 */}
      <div className={styles.tableWrapper}>
        <ResponsiveTable<AdminUser & Record<string, unknown>>
          columns={[
            { key: 'id', label: 'ID', render: (u) => u.id },
            { key: 'name', label: '이름', render: (u) => u.name },
            { key: 'email', label: '이메일', render: (u) => u.email },
            { key: 'role', label: '역할', render: (u) => (
              <Badge variant={getRoleBadgeVariant(u.role)}>
                {ROLE_LABELS[u.role] ?? u.role}
              </Badge>
            )},
            { key: 'createdAt', label: '가입일', render: (u) => u.createdAt ? new Date(u.createdAt).toLocaleDateString('ko-KR') : '-' },
            { key: 'status', label: '상태', render: (u) => (
              u.status === 'WITHDRAWN' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                  <Badge variant="gray">[탈퇴 (파기 대기중)]</Badge>
                  {u.deletedAt && (
                    <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>
                      D-{30 - Math.floor((Date.now() - new Date(u.deletedAt).getTime()) / (1000 * 60 * 60 * 24))}
                    </span>
                  )}
                </div>
              ) : (
                <Badge variant={u.status === 'ACTIVE' ? 'green' : 'red'}>
                  {STATUS_LABELS[u.status] ?? u.status}
                </Badge>
              )
            )},
            { key: 'actions', label: '관리', render: (u) => (
              <div className={styles.actions}>
                {u.role !== 'ADMIN' && u.role !== 'GOV' && u.status !== 'WITHDRAWN' && (
                  <Dropdown
                    options={changeableRoleOptions}
                    value={u.role}
                    onChange={(val) => handleRoleChange(u.id, val as ChangeableRole)}
                    size="sm"
                  />
                )}
                {u.role !== 'ADMIN' && u.status !== 'WITHDRAWN' && (
                  <Button
                    variant={u.status === 'ACTIVE' ? 'outline' : 'primary'}
                    size="sm"
                    onClick={() => handleStatusToggle(u)}
                  >
                    {u.status === 'ACTIVE' ? '정지' : '해제'}
                  </Button>
                )}
              </div>
            )}
          ]}
          data={users as any}
          rowKey={(u) => String(u.id)}
          emptyMessage="검색 결과가 없습니다."
        />
      </div>

      {/* 페이지네이션 */}
      {renderPagination()}

      <ModalDialog
        {...dialog}
        onConfirm={handleConfirm}
        onClose={handleClose}
      />

      <ReasonModal
        isOpen={reasonModalOpen}
        title="이용자 정지 처리"
        onClose={() => setReasonModalOpen(false)}
        onConfirm={handleSuspendConfirm}
      />

      <CreateAccountModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onConfirm={handleCreateUser}
      />
    </div>
  )
}
