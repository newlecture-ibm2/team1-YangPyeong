'use client';

import { useState } from 'react';
import ReportModal from './ReportModal';
import { reportPost, reportComment } from '../_lib/community.api';

interface ReportButtonProps {
  targetId: number;
  targetType: 'POST' | 'COMMENT';
  className?: string;
  style?: React.CSSProperties;
}

export default function ReportButton({ targetId, targetType, className, style }: ReportButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleReport = async (reason: string) => {
    if (targetType === 'POST') {
      await reportPost(targetId, reason);
    } else {
      await reportComment(targetId, reason);
    }
    alert('신고가 접수되었습니다.');
  };

  return (
    <>
      <button 
        className={className} 
        style={style}
        onClick={() => setIsModalOpen(true)}
        title="신고하기"
      >
        신고
      </button>

      <ReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleReport}
        title={targetType === 'POST' ? '게시글 신고' : '댓글 신고'}
      />
    </>
  );
}
