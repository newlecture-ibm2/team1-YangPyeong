'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Dropdown from '@/components/common/Dropdown/Dropdown'
import Button from '@/components/common/Button/Button'
import Badge from '@/components/common/Badge/Badge'
import SearchInput from '@/components/common/SearchInput/SearchInput'
import FilterBar from '@/components/common/FilterBar/FilterBar'
import { useToast } from '@/components/common/Toast'
import styles from './UserManagement.module.css'
import type { AdminUser, UserRole, ChangeableRole } from '../_lib/user.types'
import { ROLE_LABELS, STATUS_LABELS } from '../_lib/user.types'
import { fetchUsers, changeUserRole, changeUserStatus } from '../_lib/user.api'

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
      setUsers(result.users)
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

  // 정지 / 재활성화
  const handleStatusToggle = async (user: AdminUser) => {
    const isActive = user.status === 'ACTIVE'
    const action = isActive ? '정지' : '재활성화'
    if (!window.confirm(`${user.name} 사용자를 ${action}하시겠습니까?`)) return

    try {
      const newStatus = isActive ? 'SUSPENDED' : 'ACTIVE'
      await changeUserStatus(user.id, { status: newStatus })
      toast.success(`${user.name} 사용자가 ${action}되었습니다.`)
      await loadUsers()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : `${action}에 실패했습니다.`
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
        <h1 className={styles.title}>👥 사용자 관리</h1>
        <span className={styles.totalCount}>총 {totalCount.toLocaleString()}명</span>
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
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>이름</th>
              <th>이메일</th>
              <th>역할</th>
              <th>가입일</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.emptyRow}>
                  검색 결과가 없습니다.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {ROLE_LABELS[user.role] ?? user.role}
                    </Badge>
                  </td>
                  <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '-'}</td>
                  <td>
                    <Badge variant={user.status === 'ACTIVE' ? 'green' : 'red'}>
                      {STATUS_LABELS[user.status] ?? user.status}
                    </Badge>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      {/* 역할 변경 (ADMIN, GOV는 변경 불가) — Dropdown 공통 컴포넌트 사용 */}
                      {user.role !== 'ADMIN' && user.role !== 'GOV' && (
                        <Dropdown
                          options={changeableRoleOptions}
                          value={user.role}
                          onChange={(val) => handleRoleChange(user.id, val as ChangeableRole)}
                          size="sm"
                        />
                      )}

                      {/* 정지/재활성화 (ADMIN은 정지 불가) */}
                      {user.role !== 'ADMIN' && (
                        <Button
                          variant={user.status === 'ACTIVE' ? 'outline' : 'primary'}
                          size="sm"
                          onClick={() => handleStatusToggle(user)}
                        >
                          {user.status === 'ACTIVE' ? '정지' : '해제'}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {renderPagination()}
    </div>
  )
}
