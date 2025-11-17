export const getAvatarUrl = (path) => {
  if (!path) return "/avatar.png"; // fallback

  // Already absolute URL?
  if (path.startsWith("http")) return path;

  // Convert backend path → full URL
  return `${import.meta.env.VITE_API_URL}${path}`;
};