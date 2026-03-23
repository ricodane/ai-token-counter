import { defineConfig } from 'wxt'
import packageJson from './package.json'

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  srcDir: 'src',
  manifest: {
    version: packageJson.version,
    name: packageJson.name,
    description: packageJson.description,
    browser_specific_settings: {
      gecko: {
        id: 'token-counter-ai@spaceprompts.com',
        data_collection_permissions: {
          required: ['none'],
          optional: [],
        },
      } as any,
    },
  },
})
