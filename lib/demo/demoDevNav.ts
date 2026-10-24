/**
 * Whether to surface the Dev · AI payload nav link in the public demo shell.
 * The page at `/demo/dev/ai-payloads` remains deep-linkable for engineers;
 * generation itself stays gated server-side (`isDevAiMatterSummaryRouteEnabled`).
 */
export function shouldShowDemoDevAiNav(): boolean {
  return process.env.NODE_ENV === 'development'
}
