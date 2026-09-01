import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.1.0:1',
  releaseNotes: {
    en_US:
      'Adds configurable multi-miner profiles with independent pools, payout addresses, CPU workers, and combined dashboard metrics.',
    es_ES:
      'Añade perfiles configurables de múltiples mineros con pools, direcciones de pago, trabajadores de CPU y métricas combinadas independientes.',
    de_DE:
      'Fügt konfigurierbare Multi-Miner-Profile mit unabhängigen Pools, Auszahlungsadressen, CPU-Workern und kombinierten Dashboard-Metriken hinzu.',
    pl_PL:
      'Dodaje konfigurowalne profile wielu górników z niezależnymi pulami, adresami wypłat, wątkami CPU i połączonymi metrykami panelu.',
    fr_FR:
      'Ajoute des profils multi-mineurs configurables avec des pools, adresses de paiement, workers CPU et métriques combinées indépendants.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
