package com.farmbalance.community.application.port.in;

public interface DeletePostUseCase {
    void deletePost(Long postId, Long requesterId, boolean isAdmin);
}
