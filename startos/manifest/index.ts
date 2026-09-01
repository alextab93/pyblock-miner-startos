import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'pyblock-miner',
  title: 'pyblockMiner',
  license: 'MIT',
  packageRepo: 'https://github.com/alextab93/pyblock-miner-startos',
  upstreamRepo: 'https://github.com/GaltRanch/pyblock-miner',
  marketingUrl: 'https://github.com/GaltRanch/pyblock-miner',
  donationUrl: null,
  description: { short, long },
  volumes: ['main'],
  images: {
    'pyblock-miner': {
      source: { dockerBuild: {} },
      arch: ['x86_64', 'aarch64'],
    },
  },
  dependencies: {},
})
