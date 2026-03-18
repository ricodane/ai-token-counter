import { defineConfig } from 'wxt'
import packageJson from './package.json'

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  srcDir: 'src',
  manifest: {
    version: packageJson.version,
    name: packageJson.name,
    description: packageJson.description,
    permissions: ['storage'],
  },
})
