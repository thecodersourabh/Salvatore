import security from 'eslint-plugin-security';
import tseslint from 'typescript-eslint';

const securityRules = Object.fromEntries(
  Object.entries(security.configs.recommended.rules).map(([name, rule]) => [
    name,
    Array.isArray(rule) ? ['warn', ...rule.slice(1)] : 'warn',
  ]),
);

for (const name of [
  'security/detect-buffer-noassert',
  'security/detect-disable-mustache-escape',
  'security/detect-eval-with-expression',
  'security/detect-new-buffer',
  'security/detect-pseudoRandomBytes',
  'security/detect-bidi-characters',
  'security/detect-invisible-characters',
]) {
  securityRules[name] = 'error';
}

securityRules['security/detect-object-injection'] = 'off';

export default [
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    linterOptions: { noInlineConfig: true },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: { security },
    rules: securityRules,
  },
];
