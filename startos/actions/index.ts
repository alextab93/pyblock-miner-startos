import { sdk } from '../sdk'
import { configureMiner } from './configureMiner'

export const actions = sdk.Actions.of().addAction(configureMiner)
