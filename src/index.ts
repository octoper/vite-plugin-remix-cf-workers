import type { Plugin } from 'vite'
import entryServerTemplate from './entry.server.template.txt'
import MagicString from 'magic-string';

export interface VitePluginOptions {
  serverInput?: string;
}

function VitePluginRemixCfWorkers(): Plugin {
  return {
    name: `vite-plugin-remix-cf-workers`,
    apply: 'build',
    enforce: 'pre',
    config() {
      return {
        resolve: {
          conditions: ['webworker', 'worker'],
        },
        ssr: {
          target: 'webworker',
        },
      };
    },
    async transform(_src, id) {
      if (/entry\.server\.(.*)\.tsx/.test(id)) {
        const magic = new MagicString(entryServerTemplate);
        return {
          code: magic.toString(),
          map: magic.generateMap({
            includeContent: true,
            hires: true,
          })
        }
      }
    },
  }
}

export default VitePluginRemixCfWorkers
