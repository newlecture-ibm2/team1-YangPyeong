package com.farmbalance.admin.application.service;

import com.farmbalance.admin.application.port.out.AdminCommentPort;
import com.farmbalance.admin.application.port.out.AdminPostPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class SanctionCleanupScheduler {

    private final AdminPostPort adminPostPort;
    private final AdminCommentPort adminCommentPort;

    /**
     * 매일 자정 (00:00:00) 에 실행.
     * 숨김 처리(is_hidden = true) 후 30일이 지난 게시글 및 댓글을 일괄 삭제(Soft Delete) 처리합니다.
     */
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void cleanupOldHiddenCommunityContents() {
        log.info("Starting scheduled cleanup of hidden community contents older than 30 days...");

        LocalDateTime threshold = LocalDateTime.now().minusDays(30);

        int deletedPosts = adminPostPort.deleteOldHidden(threshold);
        int deletedComments = adminCommentPort.deleteOldHidden(threshold);

        log.info("Finished cleanup. Deleted posts: {}, Deleted comments: {}", deletedPosts, deletedComments);
    }
}
