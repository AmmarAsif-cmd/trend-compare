/**
 * Enhanced PDF Generator
 * 
 * Generates PDF from InsightsPack data (no AI calls)
 * Uses the existing PDF generator from pdf-generator.ts
 */

import { generateComparisonPDF, type ComparisonPDFData } from './pdf-generator';

/**
 * Generate PDF buffer from comparison data
 * 
 * Wraps the existing generateComparisonPDF function
 */
export async function generatePDF(data: ComparisonPDFData): Promise<Buffer> {
  return generateComparisonPDF(data);
}

