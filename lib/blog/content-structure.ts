/**
 * Blog Content Structure Validation
 * 
 * Ensures blog posts follow the required structure:
 * 1. Strong H1 with clear intent
 * 2. Intro paragraph (why this matters now)
 * 3. Context section (background or market setup)
 * 4. Main insight section (original analysis)
 * 5. Supporting evidence (links to TrendArc comparisons)
 * 6. "What this means" section (implications)
 * 7. Conclusion
 * 8. Optional FAQ (2-3 questions)
 * 
 * Minimum 900 words, must reference at least 2 internal comparison pages
 */

export interface ContentStructureCheck {
  isValid: boolean;
  wordCount: number;
  hasH1: boolean;
  hasIntro: boolean;
  hasContext: boolean;
  hasInsight: boolean;
  hasEvidence: boolean;
  hasImplications: boolean;
  hasConclusion: boolean;
  comparisonLinkCount: number;
  errors: string[];
  warnings: string[];
}

/**
 * Extract comparison links from markdown content
 * Looks for links to /compare/ pages
 */
function extractComparisonLinks(content: string): string[] {
  const comparisonLinkRegex = /\/compare\/([a-z0-9-]+(?:-vs-[a-z0-9-]+)+)/gi;
  const matches = content.match(comparisonLinkRegex);
  if (!matches) return [];
  
  // Extract unique slugs
  const slugs = matches.map(match => {
    const slugMatch = match.match(/\/compare\/(.+)/);
    return slugMatch ? slugMatch[1] : null;
  }).filter(Boolean) as string[];
  
  return Array.from(new Set(slugs));
}

/**
 * Check if content has required sections
 */
function checkSections(content: string): {
  hasH1: boolean;
  hasIntro: boolean;
  hasContext: boolean;
  hasInsight: boolean;
  hasEvidence: boolean;
  hasImplications: boolean;
  hasConclusion: boolean;
} {
  const lowerContent = content.toLowerCase();
  
  // Check for H1 (markdown # or HTML <h1>)
  const hasH1 = /^#\s+/.test(content.trim()) || /<h1[^>]*>/i.test(content);
  
  // Check for intro (first paragraph after H1, or explicit intro section)
  const hasIntro = /(?:^#\s+[^\n]+\n\n)(?:[^\n#]+)/.test(content) || 
                   /(?:intro|introduction|why this matters)/i.test(lowerContent);
  
  // Check for context section
  const hasContext = /(?:##\s+)?(?:context|background|market setup|setting the stage)/i.test(content);
  
  // Check for insight section
  const hasInsight = /(?:##\s+)?(?:insight|analysis|key finding|main finding|what we found)/i.test(content);
  
  // Check for evidence section (mentions comparisons or data)
  const hasEvidence = /\/compare\//.test(content) || 
                      /(?:evidence|data|comparison|trend)/i.test(lowerContent);
  
  // Check for implications section
  const hasImplications = /(?:##\s+)?(?:what this means|implications|what it means|takeaways)/i.test(content);
  
  // Check for conclusion
  const hasConclusion = /(?:##\s+)?(?:conclusion|summary|final thoughts|wrapping up)/i.test(content);
  
  return {
    hasH1,
    hasIntro,
    hasContext,
    hasInsight,
    hasEvidence,
    hasImplications,
    hasConclusion,
  };
}

/**
 * Validate blog content structure
 */
export function validateBlogContentStructure(
  content: string,
  minWords: number = 900,
  minComparisonLinks: number = 2
): ContentStructureCheck {
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
  const comparisonLinks = extractComparisonLinks(content);
  const sections = checkSections(content);
  
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Required checks
  if (wordCount < minWords) {
    errors.push(`Content must be at least ${minWords} words (currently ${wordCount})`);
  }
  
  if (comparisonLinks.length < minComparisonLinks) {
    errors.push(`Must reference at least ${minComparisonLinks} comparison pages (found ${comparisonLinks.length})`);
  }
  
  if (!sections.hasH1) {
    errors.push('Missing H1 heading');
  }
  
  if (!sections.hasIntro) {
    warnings.push('Consider adding an intro paragraph explaining why this matters');
  }
  
  if (!sections.hasContext) {
    warnings.push('Consider adding a context section for background');
  }
  
  if (!sections.hasInsight) {
    errors.push('Missing main insight/analysis section');
  }
  
  if (!sections.hasEvidence) {
    errors.push('Missing supporting evidence (comparison links or data references)');
  }
  
  if (!sections.hasImplications) {
    warnings.push('Consider adding a "What this means" section');
  }
  
  if (!sections.hasConclusion) {
    warnings.push('Consider adding a conclusion section');
  }
  
  return {
    isValid: errors.length === 0,
    wordCount,
    ...sections,
    comparisonLinkCount: comparisonLinks.length,
    errors,
    warnings,
  };
}

/**
 * Get content structure recommendations
 */
export function getContentStructureRecommendations(check: ContentStructureCheck): string[] {
  const recommendations: string[] = [];
  
  if (check.wordCount < 900) {
    recommendations.push(`Expand content to at least 900 words (currently ${check.wordCount})`);
  }
  
  if (check.comparisonLinkCount < 2) {
    recommendations.push(`Add at least ${2 - check.comparisonLinkCount} more comparison links`);
  }
  
  if (!check.hasIntro) {
    recommendations.push('Add an intro paragraph explaining why this topic matters now');
  }
  
  if (!check.hasContext) {
    recommendations.push('Add a context section providing background or market setup');
  }
  
  if (!check.hasInsight) {
    recommendations.push('Add a main insight section with original analysis');
  }
  
  if (!check.hasEvidence) {
    recommendations.push('Add supporting evidence with links to TrendArc comparisons');
  }
  
  if (!check.hasImplications) {
    recommendations.push('Add a "What this means" section explaining implications');
  }
  
  if (!check.hasConclusion) {
    recommendations.push('Add a conclusion section summarizing key points');
  }
  
  return recommendations;
}

