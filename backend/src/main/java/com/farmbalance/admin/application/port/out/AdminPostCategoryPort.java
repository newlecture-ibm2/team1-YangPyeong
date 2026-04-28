package com.farmbalance.admin.application.port.out;

import com.farmbalance.admin.domain.AdminPostCategory;

import java.util.List;

/**
 * ADM-008 게시판 카테고리 관리용 Output Port
 */
public interface AdminPostCategoryPort {

    List<AdminPostCategory> findAll();
}
