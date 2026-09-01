import { minerConfigJson } from './fileModels/minerConfig'
import { i18n } from './i18n'
import { validateMinerConfig } from './minerConfig'
import { sdk } from './sdk'
import { dashboardPort } from './utils'

export const main = sdk.setupMain(async ({ effects }) => {
  const config = await minerConfigJson.read().const(effects)
  if (!config)
    throw new Error(i18n('Configure pyblockMiner before starting it.'))
  const validation = validateMinerConfig(config)
  if (!validation.ok) {
    throw new Error(i18n('Configure pyblockMiner before starting it.'))
  }

  const subcontainer = sdk.SubContainer.of(
    effects,
    { imageId: 'pyblock-miner' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'main',
      subpath: null,
      mountpoint: '/data',
      readonly: false,
    }),
    'pyblock-miner',
  )

  return sdk.Daemons.of(effects).addDaemon('pyblock-miner', {
    subcontainer,
    exec: {
      command: [
        '/usr/local/bin/start-pyblock-miner',
        '--headless',
        '--cpu',
        '--cpu-threads',
        String(validation.value.cpuWorkers),
        '--network',
        validation.value.network,
        '--addr',
        validation.value.payoutAddress,
        '--pool',
        validation.pool,
        '--donate',
        String(validation.value.donationPercent),
      ],
      env: { XDG_CONFIG_HOME: '/data' },
    },
    ready: {
      display: i18n('Mining Dashboard'),
      gracePeriod: 10_000,
      fn: () =>
        sdk.healthCheck.checkWebUrl(
          effects,
          `http://127.0.0.1:${dashboardPort}/api/status`,
          {
            timeout: 5_000,
            successMessage: i18n('The mining dashboard is ready.'),
            errorMessage: i18n('The mining dashboard is not ready.'),
          },
        ),
    },
    requires: [],
  })
})
