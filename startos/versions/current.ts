import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.1.0:3',
  releaseNotes: {
    en_US:
      'Updates pyblockMiner to 0.2.33, keeps CHIRP-PRIME DATUM gateway support, and prevents accepted DATUM shares from being reported as blocks.',
    es_ES:
      'Actualiza pyblockMiner a 0.2.33, mantiene la compatibilidad con la puerta de enlace DATUM de CHIRP-PRIME y evita que las participaciones DATUM aceptadas se muestren como bloques.',
    de_DE:
      'Aktualisiert pyblockMiner auf 0.2.33, behält die CHIRP-PRIME-DATUM-Unterstützung bei und verhindert, dass akzeptierte DATUM-Shares als Blöcke gemeldet werden.',
    pl_PL:
      'Aktualizuje pyblockMiner do wersji 0.2.33, zachowuje obsługę bramy CHIRP-PRIME DATUM i zapobiega zgłaszaniu zaakceptowanych udziałów DATUM jako bloków.',
    fr_FR:
      'Met à jour pyblockMiner vers la version 0.2.33, conserve la passerelle DATUM CHIRP-PRIME et évite de signaler les partages DATUM acceptés comme des blocs.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
