export function redirectSystemPath({
  path,
  initial,
}: { path: string; initial: boolean }) {
  console.log('[NativeIntent] Redirecting path:', path, 'initial:', initial);
  return '/';
}
