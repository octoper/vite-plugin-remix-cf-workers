import type { Plugin } from 'vite'
import entryServerTemplate from './entry.server.template.txt'
import MagicString from 'magic-string';
import path from 'node:path';

export interface VitePluginOptions {
  serverInput?: string;
}

function VitePluginRemixCfWorkers(): Plugin {
  let remixVitePlugin;
  let rootDirectory;
  return {
    name: `vite-plugin-remix-cf-workers`,
    apply: 'build',
    enforce: 'pre',
    configResolved(config) {
      remixVitePlugin = config.plugins.find(
        (p) => p.name === 'remix'
      );

      if (!remixVitePlugin) {
        throw new Error(
          'vite-plugin-remix-cf-workers requires the Remix Vite plugin to be installed'
        );
      }
    },
    config(_viteUserConfig, viteConfigEnv) {
      const viteCommand = viteConfigEnv.command;
      rootDirectory = _viteUserConfig.root ?? process.env.REMIX_ROOT ?? process.cwd();

      let isSsrBuild =
        "ssrBuild" in viteConfigEnv &&
        typeof viteConfigEnv.ssrBuild === "boolean"
          ? viteConfigEnv.ssrBuild // Vite v4 back compat
          : viteConfigEnv.isSsrBuild;

      return {
        resolve: {
          conditions: ['webworker', 'worker'],
        },
        ssr: {
          target: 'webworker',
        },
        ...(viteCommand === "build" && {
          build: {
            ...(isSsrBuild && {
              rollupOptions: {
                input: [
                  // @ts-ignore
                  path.resolve(rootDirectory, 'server.ts')
                ],
                output: {
                  entryFileNames: '[name].js',
                }
              },
            }),
          }
        }),
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
