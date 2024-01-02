import { type Prisma, CategoryClass, GearType, EngineType } from '@prisma/client';

export const categoryClassToString = (catClass: CategoryClass) => {
  switch (catClass) {
    case CategoryClass.ASEL: return 'ASEL';
    case CategoryClass.AMEL: return 'AMEL';
    case CategoryClass.ASES: return 'ASES';
    case CategoryClass.AMES: return 'AMES';
    case CategoryClass.RH: return 'Helicopter';
    case CategoryClass.RG: return 'Gyroplane';
    case CategoryClass.GL: return 'Glider';
    case CategoryClass.LA: return 'LTA Airship';
    case CategoryClass.LB: return 'LTA Balloon';
    case CategoryClass.PLIFT: return 'Powered Lift';
    case CategoryClass.PL: return 'Powered Para. Land';
    case CategoryClass.PS: return 'Powered Para. Sea';
    case CategoryClass.WL: return 'Weight Shift Land';
    case CategoryClass.WS: return 'Weight Shift Sea';
    default: return 'Unknown';
  }
}


export const gearTypeToString = (gearType: GearType) => {
  switch (gearType) {
    case GearType.AM: return 'Amphibian';
    case GearType.FC: return 'Fixed Tailwheel';
    case GearType.FT: return 'Fixed Tricycle';
    case GearType.FL: return 'Floats';
    case GearType.RC: return 'Retract Tailwheel';
    case GearType.RT: return 'Retract Tricycle';
    case GearType.SK: return 'Skids';
    case GearType.SI: return 'Skis';
    default: return 'Unknown';
  }
}

export const engineTypeToString = (engineType: EngineType) => {
  switch (engineType) {
    case EngineType.DS: return 'Diesel';
    case EngineType.EL: return 'Electric';
    case EngineType.NP: return 'Non-Powered';
    case EngineType.PT: return 'Piston';
    case EngineType.RA: return 'Radial';
    case EngineType.TF: return 'Turbofan';
    case EngineType.TJ: return 'Turbojet';
    case EngineType.TP: return 'Turboprop';
    case EngineType.TS: return 'Turboshaft';
    default: return 'Unknown';
  }
}