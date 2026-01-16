import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to generate signed URLs for secure file access
 * This replaces direct public URLs for sensitive patient documents
 */
export function useSignedUrl(
  bucket: string,
  filePath: string | null | undefined,
  expiresIn: number = 3600 // 1 hour default
) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!filePath) {
      setSignedUrl(null);
      return;
    }

    // Check if it's already a full URL (legacy public URLs)
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      setSignedUrl(filePath);
      return;
    }

    const generateUrl = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUrl(filePath, expiresIn);

        if (error) throw error;
        setSignedUrl(data.signedUrl);
      } catch (err) {
        console.error('Error generating signed URL:', err);
        setError(err as Error);
        setSignedUrl(null);
      } finally {
        setIsLoading(false);
      }
    };

    generateUrl();
  }, [bucket, filePath, expiresIn]);

  return { signedUrl, isLoading, error };
}

/**
 * Utility function to generate a signed URL on-demand
 */
export async function getSignedUrl(
  bucket: string,
  filePath: string,
  expiresIn: number = 3600
): Promise<string | null> {
  if (!filePath) return null;

  // Check if it's already a full URL (legacy public URLs)
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  } catch (err) {
    console.error('Error generating signed URL:', err);
    return null;
  }
}
