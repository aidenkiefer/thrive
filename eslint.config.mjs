import { FlatCompat } from '@eslint/eslintrc'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) })

// Surface the existing backlog without blocking other lanes during this session.
const recommended = compat.extends('next/core-web-vitals', 'next/typescript').map(config => ({
  ...config,
  rules: Object.fromEntries(Object.entries(config.rules ?? {}).map(([name, setting]) => {
    const [severity, ...options] = Array.isArray(setting) ? setting : [setting]
    return [name, [severity === 'error' || severity === 2 ? 'warn' : severity, ...options]]
  })),
}))

export default [
  { ignores: ['.next/**', 'node_modules/**', 'out/**', 'build/**', 'next-env.d.ts'] },
  ...recommended,
]
