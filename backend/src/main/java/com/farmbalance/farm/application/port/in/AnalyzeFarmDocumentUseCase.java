package com.farmbalance.farm.application.port.in;

import com.farmbalance.farm.domain.FarmDocumentData;
import org.springframework.web.multipart.MultipartFile;

public interface AnalyzeFarmDocumentUseCase {
    FarmDocumentData analyzeDocument(MultipartFile file);
}
