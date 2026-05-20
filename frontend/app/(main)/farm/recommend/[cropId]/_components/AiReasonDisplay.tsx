'use client';

import {
  buildAiReasonSections,
  parseEmphasisParts,
} from '../../_lib/formatAiReason';
import styles from './ScoreAnalysis.module.css';

interface AiReasonDisplayProps {
  text: string;
}

function EmphasizedSentence({ sentence }: { sentence: string }) {
  const parts = parseEmphasisParts(sentence);
  return (
    <p className={styles.opinionSentence}>
      {parts.map((part, i) =>
        part.type === 'emphasis' ? (
          <strong key={i} className={styles.opinionEmphasis}>
            {part.value}
          </strong>
        ) : (
          <span key={i}>{part.value}</span>
        ),
      )}
    </p>
  );
}

export default function AiReasonDisplay({ text }: AiReasonDisplayProps) {
  const sections = buildAiReasonSections(text);

  return (
    <div className={styles.opinionBody}>
      {sections.map((section, si) => (
        <section key={si} className={styles.opinionBlock}>
          {section.title ? (
            <h4 className={styles.opinionBlockTitle}>{section.title}</h4>
          ) : null}
          <div className={styles.opinionBlockContent}>
            {section.sentences.map((sentence, i) => (
              <EmphasizedSentence key={i} sentence={sentence} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
