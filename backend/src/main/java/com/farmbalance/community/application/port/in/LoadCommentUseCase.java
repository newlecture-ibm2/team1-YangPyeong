package com.farmbalance.community.application.port.in;

import com.farmbalance.community.domain.model.Comment;
import java.util.List;

public interface LoadCommentUseCase {
    List<Comment> getComments(Long postId);
}
