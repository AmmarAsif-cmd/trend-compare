/**
 * Saved Comparisons Management
 * Handles saving, unsaving, and retrieving user's saved comparisons
 */

import { prisma } from './db';
import { getCurrentUser } from './user-auth-helpers';

export type SavedComparisonData = {
  id: string;
  slug: string;
  termA: string;
  termB: string;
  category: string | null;
  notes: string | null;
  tags: string[];
  savedAt: Date;
};

/**
 * Save a comparison for the current user
 */
export async function saveComparison(
  slug: string,
  termA: string,
  termB: string,
  category?: string | null,
  notes?: string | null,
  tags?: string[]
): Promise<{ success: boolean; message: string; id?: string }> {
  let userId: string | undefined;
  
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.warn('[SavedComparisons] No user found - user not logged in');
      return { success: false, message: 'You must be logged in to save comparisons' };
    }

    userId = (user as any).id;
    if (!userId) {
      console.error('[SavedComparisons] User object missing id:', user);
      return { success: false, message: 'Authentication error. Please log in again.' };
    }
    
    console.log('[SavedComparisons] Saving comparison for user:', { userId, slug, termA, termB });

    // Check if already saved
    const existing = await prisma.savedComparison.findFirst({
      where: {
        userId,
        slug,
      },
    });

    if (existing) {
      // Update existing save with new notes/tags if provided
      const updated = await prisma.savedComparison.update({
        where: { id: existing.id },
        data: {
          termA,
          termB,
          category: category || existing.category,
          notes: notes !== undefined ? notes : existing.notes,
          tags: tags !== undefined ? tags : existing.tags,
          updatedAt: new Date(),
        },
      });

      return { success: true, message: 'Comparison updated', id: updated.id };
    }

    // Create new saved comparison
    const saved = await prisma.savedComparison.create({
      data: {
        userId,
        slug,
        termA,
        termB,
        category: category || null,
        notes: notes || null,
        tags: tags || [],
      },
    });

    console.log('[SavedComparisons] ✅ Comparison saved successfully:', { id: saved.id, slug });
    return { success: true, message: 'Comparison saved', id: saved.id };
  } catch (error: any) {
    console.error('[SavedComparisons] ❌ Error saving comparison:', {
      error: error?.message || error,
      code: error?.code,
      meta: error?.meta,
      userId: userId || 'NOT_SET',
      slug,
    });
    
    // Provide more specific error messages
    if (error?.code === 'P2002') {
      return { success: false, message: 'This comparison is already saved' };
    }
    if (error?.code === 'P2003') {
      return { success: false, message: 'Invalid user. Please log in again.' };
    }
    
    return { success: false, message: error?.message || 'Failed to save comparison' };
  }
}

/**
 * Unsave a comparison for the current user
 */
export async function unsaveComparison(slug: string): Promise<{ success: boolean; message: string }> {
  let userId: string | undefined;
  
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'You must be logged in to unsave comparisons' };
    }

    userId = (user as any).id;
    if (!userId) {
      console.error('[SavedComparisons] User object missing id:', user);
      return { success: false, message: 'Authentication error. Please log in again.' };
    }

    const deleted = await prisma.savedComparison.deleteMany({
      where: {
        userId,
        slug,
      },
    });

    if (deleted.count === 0) {
      return { success: false, message: 'Comparison not found in saved list' };
    }

    return { success: true, message: 'Comparison removed from saved list' };
  } catch (error: any) {
    console.error('[SavedComparisons] Error unsaving comparison:', error);
    return { success: false, message: error?.message || 'Failed to unsave comparison' };
  }
}

/**
 * Check if a comparison is saved by the current user
 */
export async function isComparisonSaved(slug: string): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    const userId = (user as any).id;
    if (!userId) return false;

    const saved = await prisma.savedComparison.findFirst({
      where: {
        userId,
        slug,
      },
    });

    return !!saved;
  } catch (error) {
    console.error('[SavedComparisons] Error checking if saved:', error);
    return false;
  }
}

/**
 * Get all saved comparisons for the current user
 */
export async function getSavedComparisons(
  limit: number = 50,
  offset: number = 0
): Promise<{ comparisons: SavedComparisonData[]; total: number }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { comparisons: [], total: 0 };
    }

    const userId = (user as any).id;
    if (!userId) {
      console.error('[SavedComparisons] User object missing id:', user);
      return { comparisons: [], total: 0 };
    }

    const [comparisons, total] = await Promise.all([
      prisma.savedComparison.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.savedComparison.count({
        where: { userId },
      }),
    ]);

    return {
      comparisons: comparisons.map((c: any) => ({
        id: c.id,
        slug: c.slug,
        termA: c.termA,
        termB: c.termB,
        category: c.category,
        notes: c.notes,
        tags: c.tags,
        savedAt: c.createdAt,
      })),
      total,
    };
  } catch (error) {
    console.error('[SavedComparisons] Error fetching saved comparisons:', error);
    return { comparisons: [], total: 0 };
  }
}

/**
 * Update notes or tags for a saved comparison
 */
export async function updateSavedComparison(
  slug: string,
  updates: { notes?: string | null; tags?: string[] }
): Promise<{ success: boolean; message: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: 'You must be logged in' };
    }

    const userId = (user as any).id;

    const updated = await prisma.savedComparison.updateMany({
      where: {
        userId,
        slug,
      },
      data: {
        ...(updates.notes !== undefined && { notes: updates.notes }),
        ...(updates.tags !== undefined && { tags: updates.tags }),
        updatedAt: new Date(),
      },
    });

    if (updated.count === 0) {
      return { success: false, message: 'Saved comparison not found' };
    }

    return { success: true, message: 'Comparison updated' };
  } catch (error: any) {
    console.error('[SavedComparisons] Error updating saved comparison:', error);
    return { success: false, message: error?.message || 'Failed to update comparison' };
  }
}

