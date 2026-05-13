export interface MyPostActivity {
  postId: number;
  categoryId: number;
  categoryName: string;
  title: string;
  viewCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MyCommentActivity {
  commentId: number;
  postId: number;
  postTitle: string;
  content: string;
  accepted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MyReportActivity {
  reportId: number;
  targetType: string;
  targetId: number;
  targetTitle: string;
  reason: string;
  status: string;
  createdAt: string;
}

