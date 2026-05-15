package com.farmbalance.farm.application.port.out;

import com.farmbalance.farm.domain.FarmDocumentData;
import org.springframework.web.multipart.MultipartFile;

public interface AnalyzeFarmDocumentPort {
    FarmDocumentData analyzeDocument(MultipartFile file);
}
