package com.farmbalance.community.application.service;

import com.farmbalance.community.application.port.in.AcceptCommentUseCase;
import com.farmbalance.community.application.port.in.CreateCommentUseCase;
import com.farmbalance.community.application.port.in.DeleteCommentUseCase;
import com.farmbalance.community.application.port.in.LoadCommentUseCase;
import com.farmbalance.community.application.port.out.CommentPort;
import com.farmbalance.community.application.port.out.PostPort;
import com.farmbalance.community.domain.model.Comment;
import com.farmbalance.community.domain.model.Post;
import com.farmbalance.global.error.BusinessException;
import com.farmbalance.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CommentService implements CreateCommentUseCase, LoadCommentUseCase, DeleteCommentUseCase, AcceptCommentUseCase {

    private final CommentPort commentPort;
    private final PostPort postPort;

    @Override
    public Comment createComment(Long postId, Long authorId, String content) {
        if (!postPort.findActiveById(postId).isPresent()) {
            throw new BusinessException(ErrorCode.POST_NOT_FOUND);
        }

        Comment comment = Comment.builder()
                .postId(postId)
                .authorId(authorId)
                .content(content)
                .accepted(false)
                .createdAt(LocalDateTime.now())
                .build();

        return commentPort.save(comment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Comment> getComments(Long postId) {
        return commentPort.findByPostId(postId);
    }

    @Override
    public void deleteComment(Long commentId, Long requesterId, boolean isAdmin) {
        Comment comment = commentPort.findById(commentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COMMENT_NOT_FOUND));

        if (!isAdmin && !comment.getAuthorId().equals(requesterId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED, "댓글 삭제 권한이 없습니다.");
        }

        comment.delete();
        commentPort.save(comment);
    }

    @Override
    public void acceptComment(Long commentId, Long requesterId) {
        Comment comment = commentPort.findById(commentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COMMENT_NOT_FOUND));

        Post post = postPort.findById(comment.getPostId())
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));

        if (!post.getAuthorId().equals(requesterId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED, "채택 권한은 게시글 작성자에게만 있습니다.");
        }

        comment.accept();
        commentPort.save(comment);
    }
}

