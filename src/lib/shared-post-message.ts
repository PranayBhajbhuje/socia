const SHARED_POST_PREFIX = "[[socia-post:";
const SHARED_POST_SUFFIX = "]]";

export function encodeSharedPostMessage(postId: string): string {
  return `${SHARED_POST_PREFIX}${encodeURIComponent(postId)}${SHARED_POST_SUFFIX}`;
}

export function getSharedPostId(body: string): string | null {
  if (!body.startsWith(SHARED_POST_PREFIX) || !body.endsWith(SHARED_POST_SUFFIX)) return null;
  const encodedId = body.slice(SHARED_POST_PREFIX.length, -SHARED_POST_SUFFIX.length);
  if (!encodedId) return null;
  try {
    return decodeURIComponent(encodedId) || null;
  } catch {
    return null;
  }
}

export function getMessagePreview(body: string): string {
  return getSharedPostId(body) ? "Shared a post" : body;
}
