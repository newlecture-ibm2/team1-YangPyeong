package com.farmbalance.admin.application.service;

import com.farmbalance.admin.application.port.in.ApproveFarmUseCase;
import com.farmbalance.admin.application.port.in.dto.ApproveFarmCommand;
import com.farmbalance.farm.application.port.out.LoadFarmPort;
import com.farmbalance.farm.application.port.out.SaveFarmPort;
import com.farmbalance.farm.domain.CertificationStatus;
import com.farmbalance.farm.domain.Farm;
import com.farmbalance.farm.domain.exception.FarmNotFoundException;
import com.farmbalance.user.application.port.out.UserRepository;
import com.farmbalance.user.domain.Role;
import com.farmbalance.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class ApproveFarmService implements ApproveFarmUseCase {

    private final LoadFarmPort loadFarmPort;
    private final SaveFarmPort saveFarmPort;
    private final UserRepository userRepository;

    @Override
    public void approveFarm(ApproveFarmCommand command) {
        // 1. 농장 정보 조회
        Farm farm = loadFarmPort.loadFarmById(command.getFarmId())
                .orElseThrow(FarmNotFoundException::new);

        // 2. 인증 상태 변경
        farm.updateCertificationStatus(command.getStatus());
        saveFarmPort.saveFarm(farm);

        // 3. 승인된 경우, 유저의 Role을 FARMER로 변경
        if (command.getStatus() == CertificationStatus.APPROVED) {
            User user = userRepository.findById(farm.getUserId())
                    .orElseThrow(() -> new IllegalArgumentException("해당 농장의 유저를 찾을 수 없습니다."));
            
            if (user.getRole() == Role.USER) {
                user.updateRole(Role.FARMER);
                userRepository.save(user);
            }
        }
    }
}
