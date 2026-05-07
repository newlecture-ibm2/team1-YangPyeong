package com.farmbalance.chat.application.port.in;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ChatProcessResult {
    private Long roomId;
    private String reply;
}
