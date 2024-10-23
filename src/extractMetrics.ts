import {
  Parser,
  type SaveComponent,
  type SaveEntity,
} from '@etothepii/satisfactory-file-parser'
import { Registry } from 'prom-client'
import { architectureMetrics, architectureParser } from './metricGroups/architecture'
import { conveyorsMetrics, conveyorsParser } from './metricGroups/conveyors'
import { powerMetrics, powerParser } from './metricGroups/power'
import { awesomeMetrics, awesomeParser } from './metricGroups/awesome'
import { pipesMetrics, pipesParser } from './metricGroups/pipes'
import { buildingsMetrics, buildingsParser } from './metricGroups/buildings'
import { transportsMetrics, transportsParser } from './metricGroups/transports'

export const extractMetrics = async (arrayBuffer: ArrayBuffer): Promise<Registry> => {
  const register = Registry.merge([
    architectureMetrics.register,
    awesomeMetrics.register,
    buildingsMetrics.register,
    conveyorsMetrics.register,
    pipesMetrics.register,
    powerMetrics.register,
    transportsMetrics.register,
  ])

  register.resetMetrics()
  const save = Parser.ParseSave('MySave', new Uint8Array(arrayBuffer))
  register.setDefaultLabels({ sessionName: save.header.sessionName })

  const lookups = {
    byType: new Map<string, SaveComponent | SaveEntity>(),
    byInstance: new Map<string, SaveComponent | SaveEntity>(),
  } as const

  // Build lookup maps in an initial pass
  for (const level of save.levels) {
    for (const object of level.objects) {
      lookups.byType.set(object.typePath, object)
      lookups.byInstance.set(object.instanceName, object)
    }
  }

  for (const level of save.levels) {
    for (const object of level.objects) {
      architectureParser(object, lookups)
      awesomeParser(object, lookups)
      buildingsParser(object, lookups)
      conveyorsParser(object, lookups)
      pipesParser(object, lookups)
      powerParser(object, lookups)
      transportsParser(object, lookups)

      // if (object.properties?.mExtractableResource && object.typePath.includes('Miner')) {}
      // miner equivalent, should have mExtractableResource
      // if (object.typePath.startsWith('/Game/FactoryGame/Buildable/Factory/OilPump')) {}
      // no sure if it has mExtractableResource
      // if (object.typePath.startsWith('/Game/FactoryGame/Buildable/Factory/WaterPump')) {}
    }
  }

  return register
}
