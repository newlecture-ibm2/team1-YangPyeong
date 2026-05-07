package com.farmbalance.user.application.port.in;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class SignUpRequest {

    @NotBlank(message = "이메일을 입력해주세요")
    @Email(message = "올바른 이메일 형식이 아닙니다")
    private String email;

    @NotBlank(message = "비밀번호를 입력해주세요")
    @Size(min = 8, message = "비밀번호는 8자 이상이어야 합니다")
    @Pattern(
            regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[^A-Za-z\\d\\s]).+$",
            message = "비밀번호는 영문, 숫자, 특수문자를 각각 1자 이상 포함해야 합니다"
    )
    private String password;

    @NotBlank(message = "이름을 입력해주세요")
    private String name;

    private String phone;

    @NotBlank(message = "보안질문을 선택해주세요")
    private String securityQuestion;

    @NotBlank(message = "보안질문 답변을 입력해주세요")
    private String securityAnswer;
}
