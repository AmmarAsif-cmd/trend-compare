'use client';

import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  slug: string;
  termA: string;
  termB: string;
  category?: string | null;
};

export default function SaveComparisonButton({ slug, termA, termB, category }: Props) {
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check if saved on mount
  useEffect(() => {
    async function checkSaved() {
      try {
        const response = await fetch(`/api/comparisons/saved/${slug}`);
        if (response.ok) {
          const data = await response.json();
          setIsSaved(data.saved || false);
        }
      } catch (error) {
        console.error('Error checking saved status:', error);
      } finally {
        setIsLoading(false);
      }
    }

    checkSaved();
  }, [slug]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    
    try {
      if (isSaved) {
        // Unsave
        const response = await fetch('/api/comparisons/save', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug }),
        });

        if (response.ok) {
          setIsSaved(false);
        } else {
          // Get response text first to see what we're dealing with
          const responseText = await response.text().catch(() => '');
          let data: any = {};
          
          try {
            data = responseText ? JSON.parse(responseText) : {};
          } catch (parseError) {
            console.error('[SaveButton] Failed to parse error response:', {
              status: response.status,
              statusText: response.statusText,
              responseText: responseText.substring(0, 200),
            });
            data = { message: `Server error (${response.status}): ${response.statusText || 'Unknown error'}` };
          }
          
          console.error('[SaveButton] Unsave error:', { 
            status: response.status,
            statusText: response.statusText,
            data,
            responseText: responseText.substring(0, 200),
          });
          
          if (data.message?.includes('logged in') || response.status === 401) {
            router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
            return;
          }
          
          setError(data.message || `Failed to unsave comparison (${response.status}). Please try again.`);
        }
      } else {
        // Save
        console.log('[SaveButton] Sending save request:', { slug, termA, termB, category });
        
        const response = await fetch('/api/comparisons/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug, termA, termB, category }),
        });

        console.log('[SaveButton] Response received:', {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
        });

        if (response.ok) {
          try {
            const responseText = await response.text();
            console.log('[SaveButton] Success response text:', responseText);
            
            if (responseText) {
              const data = JSON.parse(responseText);
              console.log('[SaveButton] Parsed success data:', data);
              setIsSaved(true);
              setError(null);
            } else {
              console.warn('[SaveButton] Empty success response, assuming saved');
              setIsSaved(true);
              setError(null);
            }
          } catch (jsonError: any) {
            console.error('[SaveButton] Failed to parse success response:', jsonError);
            // Response might be empty or invalid JSON, but status is OK
            setIsSaved(true);
            setError(null);
          }
        } else {
          // Error response - read as text first
          let responseText = '';
          let data: any = {};
          
          try {
            // Clone response to avoid consuming it
            const clonedResponse = response.clone();
            responseText = await clonedResponse.text();
            
            console.log('[SaveButton] Error response text (length:', responseText.length, '):', responseText.substring(0, 500));
            
            if (responseText && responseText.trim()) {
              try {
                data = JSON.parse(responseText);
                console.log('[SaveButton] Parsed error data:', data);
              } catch (parseError: any) {
                console.error('[SaveButton] Failed to parse error JSON:', {
                  error: parseError?.message,
                  responseText: responseText.substring(0, 200),
                });
                data = { 
                  message: `Server returned invalid JSON (${response.status}): ${response.statusText || 'Unknown error'}`,
                  rawResponse: responseText.substring(0, 200),
                };
              }
            } else {
              console.warn('[SaveButton] Empty error response body');
              data = { 
                message: `Server error (${response.status}): ${response.statusText || 'No response body'}`,
              };
            }
          } catch (textError: any) {
            console.error('[SaveButton] Failed to read error response:', {
              error: textError?.message,
              stack: textError?.stack,
            });
            data = { 
              message: `Network error: Could not read server response (${response.status})`,
            };
          }
          
          console.error('[SaveButton] Save error - Full details:', { 
            status: response.status, 
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            data,
            responseTextLength: responseText.length,
            responseTextPreview: responseText.substring(0, 200),
          });
          
          if (data.message?.includes('logged in') || response.status === 401) {
            console.log('[SaveButton] Redirecting to login');
            router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
            return;
          }
          
          const errorMessage = data.message || `Failed to save comparison (${response.status}). Please try again.`;
          console.log('[SaveButton] Setting error message:', errorMessage);
          setError(errorMessage);
        }
      }
    } catch (error: any) {
      console.error('[SaveButton] Error saving/unsaving comparison:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-400 rounded-lg font-medium text-sm cursor-not-allowed"
        aria-label="Loading"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading...</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleSave}
        disabled={isSaving}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 hover:scale-105 ${
          isSaved
            ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border border-indigo-300'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
        } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label={isSaved ? 'Remove from saved' : 'Save comparison'}
      >
        {isSaving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{isSaved ? 'Removing...' : 'Saving...'}</span>
          </>
        ) : isSaved ? (
          <>
            <BookmarkCheck className="w-4 h-4" />
            <span>Saved</span>
          </>
        ) : (
          <>
            <Bookmark className="w-4 h-4" />
            <span>Save</span>
          </>
        )}
      </button>
      
      {error && (
        <div className="absolute top-full left-0 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg shadow-lg z-10 max-w-xs">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
}

