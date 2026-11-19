/**
 * Serialises a JSON-LD object for a script tag. `<` is escaped so a string field
 * containing `</script>` (event names and summaries are staff-entered) cannot close
 * the tag early and inject markup. Lives apart from JsonLd.tsx so tests need no JSX.
 */
export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
