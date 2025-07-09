module.exports = {
  'plotweaver-backend': {
    input: '../../../pw-docs/health-assessment/reports/api-specs/backend-openapi.json',
    output: {
      mode: 'split',
      target: 'src/api/generated/backend.ts',
      schemas: 'src/api/generated/schemas.ts',
      client: 'react-query',
      override: {
        mutator: {
          path: 'src/api/client.ts',
          name: 'customInstance'
        }
      }
    }
  },
  'plotweaver-bff': {
    input: '../../../pw-docs/health-assessment/reports/api-specs/bff-openapi.json',
    output: {
      mode: 'split',
      target: 'src/api/generated/bff.ts',
      schemas: 'src/api/generated/bff-schemas.ts',
      client: 'react-query'
    }
  }
};