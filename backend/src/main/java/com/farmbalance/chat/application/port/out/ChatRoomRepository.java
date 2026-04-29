package com.farmbalance.chat.application.port.out;

import com.farmbalance.chat.domain.ChatRoom;
import java.util.Optional;

public interface ChatRoomRepository {
    ChatRoom save(ChatRoom chatRoom);
    Optional<ChatRoom> findById(Long id);
}
