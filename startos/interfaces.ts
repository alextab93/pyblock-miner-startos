import { i18n } from './i18n'
import { sdk } from './sdk'
import { dashboardPort } from './utils'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  const host = sdk.MultiHost.of(effects, 'dashboard')
  const origin = await host.bindPort(dashboardPort, {
    protocol: 'http',
    preferredExternalPort: 80,
  })
  const dashboard = sdk.createInterface(effects, {
    name: i18n('Mining Dashboard'),
    id: 'dashboard',
    description: i18n(
      'View live hashrate, workers, shares, pool status, and recent mining events.',
    ),
    type: 'ui',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })

  return [await origin.export([dashboard])]
})
