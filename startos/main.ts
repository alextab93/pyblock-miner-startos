import { minerConfigJson } from './fileModels/minerConfig'
import { i18n } from './i18n'
import { validateMinerConfig } from './minerConfig'
import { sdk } from './sdk'
import { dashboardPort } from './utils'

function minerId(name: string, index: number): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `miner-${index + 1}-${slug || 'profile'}`
}

export const main = sdk.setupMain(async ({ effects }) => {
  return sdk.Daemons.dynamic(effects, async ({ effects }) => {
    const config = await minerConfigJson.read().const(effects)
    if (!config) {
      throw new Error(i18n('Configure pyblockMiner before starting it.'))
    }
    const validation = validateMinerConfig(config)
    if (!validation.ok) {
      throw new Error(i18n('Configure pyblockMiner before starting it.'))
    }

    let daemons: any = sdk.Daemons.of(effects)
    for (const [index, miner] of validation.miners.entries()) {
      const id = minerId(miner.name, index)
      const port = dashboardPort + index
      const command = [
        '/usr/local/bin/start-pyblock-miner',
        '--headless',
        '--cpu',
        '--cpu-threads',
        String(miner.cpuWorkers),
        '--network',
        miner.network,
        '--addr',
        miner.payoutAddress,
        '--pool',
        miner.pool,
        '--donate',
        String(validation.value.donationPercent),
        '--miner-name',
        miner.name,
        '--dashboard-port',
        String(port),
      ]
      if (index === 0) {
        for (const [peerIndex, peer] of validation.miners.entries()) {
          if (peerIndex === 0) continue
          command.push(
            '--dashboard-peer',
            `${peer.name}=${dashboardPort + peerIndex}`,
          )
        }
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
        id,
      )

      daemons = daemons.addDaemon(id, {
        subcontainer,
        exec: {
          command,
          env: { XDG_CONFIG_HOME: `/data/miners/${id}` },
        },
        ready: {
          display: `${i18n('Mining Process')}: ${miner.name}`,
          gracePeriod: 10_000,
          fn: () =>
            sdk.healthCheck.checkWebUrl(
              effects,
              `http://127.0.0.1:${port}/api/status`,
              {
                timeout: 5_000,
                successMessage: i18n('The miner process is running.'),
                errorMessage: i18n(
                  'The miner process is not ready. Check the service logs.',
                ),
              },
            ),
        },
        requires: [],
      })
    }
    return daemons
  })
})
