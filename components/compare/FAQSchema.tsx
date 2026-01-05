/**
 * FAQ JSON-LD Schema
 * Server-rendered structured data for Google
 * Only includes visible FAQs from comparisonFaqs
 */

import type { ComparisonFAQ } from '@/lib/faqs/comparison-faqs';
import { GLOBAL_FAQS } from '@/lib/faqs/global-faqs';

interface FAQSchemaProps {
  comparisonFaqs: ComparisonFAQ[];
}

export default function FAQSchema({ comparisonFaqs }: FAQSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      ...GLOBAL_FAQS.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.answer,
        },
      })),
      ...comparisonFaqs.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.answer,
        },
      })),
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

