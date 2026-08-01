-- Constrain the public 'covers' bucket at the storage API level.
--
-- The RLS policies on storage.objects only check folder ownership, so without
-- these bucket limits an authenticated user could upload arbitrary file types
-- and sizes directly to the storage API. The client-side image compression
-- (~0.6 MB target) and NSFWJS screening are UX conveniences running in the
-- browser — they are NOT security controls and can be bypassed. These bucket
-- constraints are the server-side enforcement.
update storage.buckets
set
  file_size_limit = 5242880, -- 5 MB, generous headroom over the ~0.6 MB client target
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif'
  ]
where id = 'covers';
