import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.1.0:0',
  releaseNotes: {
    en_US:
      'Adds a lightweight read-only mining dashboard with live session metrics.',
    es_ES:
      'Añade un panel de minería ligero y de solo lectura con métricas de sesión en vivo.',
    de_DE:
      'Fügt ein leichtes schreibgeschütztes Mining-Dashboard mit Live-Sitzungsmetriken hinzu.',
    pl_PL:
      'Dodaje lekki panel kopania tylko do odczytu z bieżącymi metrykami sesji.',
    fr_FR:
      'Ajoute un tableau de bord de minage léger en lecture seule avec les métriques de session en direct.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
