import { supabase, isSupabaseConfigured, getRequiredSupabase } from './supabaseClient';
import { compressImage, AVATAR_COMPRESSION, POST_IMAGE_COMPRESSION } from '../lib/imageCompress';

const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

export const storageService = {
  /**
   * Uploads a user's avatar image into the public 'avatars' bucket.
   * Path is scoped strictly under `${userId}/...` satisfying storage RLS.
   */
  async uploadAvatar(userId: string, file: File): Promise<{ path: string; publicUrl: string }> {
    const client = getRequiredSupabase();

    if (!ALLOWED_AVATAR_TYPES.includes(file.type) && !file.type.startsWith('image/')) {
      throw new Error('Please choose a photo (JPEG, PNG or WebP).');
    }

    // Any size is accepted: the photo is shrunk to ~200 KB before upload.
    const small = await compressImage(file, AVATAR_COMPRESSION);
    const ext = small.name.split('.').pop() || 'webp';
    const filePath = `${userId}/avatar-${Date.now()}.${ext}`;

    const { data, error } = await client.storage
      .from('avatars')
      .upload(filePath, small, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) throw error;

    const { data: publicUrlData } = client.storage
      .from('avatars')
      .getPublicUrl(data.path);

    return {
      path: data.path,
      publicUrl: publicUrlData.publicUrl
    };
  },

  /**
   * Compresses a photo (~500 KB, max 1600 px) and uploads it to the public
   * 'post-images' bucket under `${userId}/`, returning its public URL.
   */
  async uploadPostImage(userId: string, file: File): Promise<string> {
    const client = getRequiredSupabase();
    const small = await compressImage(file, POST_IMAGE_COMPRESSION);
    const ext = small.name.split('.').pop() || 'webp';
    const filePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { data, error } = await client.storage
      .from('post-images')
      .upload(filePath, small, { cacheControl: '31536000', upsert: false, contentType: small.type });
    if (error) throw error;

    return client.storage.from('post-images').getPublicUrl(data.path).data.publicUrl;
  },

  /**
   * Securely uploads a practitioner verification document into the private 'verification-documents' bucket.
   * Strictly unreadable by the public; only the applicant and authorized administrators can access.
   */
  async uploadVerificationDocument(userId: string, file: File): Promise<{ path: string }> {
    const client = getRequiredSupabase();

    if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
      throw new Error('Invalid document format. Only PDF, JPEG, and PNG verification certificates are accepted.');
    }

    if (file.size > MAX_DOCUMENT_SIZE) {
      throw new Error('Verification certificate must not exceed 10MB.');
    }

    const ext = file.name.split('.').pop() || 'pdf';
    const cleanFileName = `cert-${Date.now()}.${ext}`;
    const filePath = `${userId}/${cleanFileName}`;

    const { data, error } = await client.storage
      .from('verification-documents')
      .upload(filePath, file, {
        cacheControl: '300',
        upsert: false
      });

    if (error) throw error;

    return { path: data.path };
  },

  /**
   * Generates a short-lived (5-minute) signed URL for private verification document inspection.
   * Public URLs are NEVER used for private applicant records.
   */
  async getPrivateDocumentSignedUrl(path: string, expiresInSeconds = 300): Promise<string> {
    const client = getRequiredSupabase();

    // Normalize path by stripping any leading slashes or bucket prefix
    const cleanPath = path.replace(/^\/+/, '').replace(/^verification-documents\/+/, '');

    const { data, error } = await client.storage
      .from('verification-documents')
      .createSignedUrl(cleanPath, expiresInSeconds);

    if (error) throw error;
    return data.signedUrl;
  }
};
