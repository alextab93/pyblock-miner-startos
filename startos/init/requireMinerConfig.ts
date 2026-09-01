import { configureMiner } from '../actions/configureMiner'
import { minerConfigJson } from '../fileModels/minerConfig'
import { i18n } from '../i18n'
import { validateMinerConfig } from '../minerConfig'
import { sdk } from '../sdk'

export const requireMinerConfig = sdk.setupOnInit(async (effects) => {
  await minerConfigJson.merge(effects, {})
  const config = await minerConfigJson.read().const(effects)
  if (!config || !validateMinerConfig(config).ok) {
    await sdk.action.createOwnTask(effects, configureMiner, 'critical', {
      reason: i18n(
        'Set a payout address, network, pool, and CPU worker count before mining can start.',
      ),
    })
  }
})
