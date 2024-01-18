// import { type Prisma, CategoryClass, GearType, EngineType } from '@prisma/client';


// ------------------------------------------------------------------------------------------------
// Database Enums
// ------------------------------------------------------------------------------------------------

export namespace DB {

  // ----------------------------------------------------------------------------------------------
  // Altitude Change

  export enum AltitudeChange {
    CLIMBING = 'CLIMBING',
    DESCENDING = 'DESCENDING',
    LEVEL = 'LEVEL',
    UNKNOWN = 'UNKNOWN',
  }
  export const altitudeChangeObj = Object.values(AltitudeChange);

  // ----------------------------------------------------------------------------------------------
  // Update Type

  export enum UpdateType {
    PROJECTED = 'PROJECTED',
    OCEANIC = 'OCEANIC',
    RADAR = 'RADAR',
    ADSB = 'ADSB',
    MULTILATERATION = 'MULTILATERATION',
    DATALINK = 'DATALINK',
    ADSB_ASDEX = 'ADSB_ASDEX',
    SPACE = 'SPACE',
    UNKNOWN = 'UNKNOWN',
  }
  export const updateTypeObj = Object.values(UpdateType);


  // ----------------------------------------------------------------------------------------------
  // Category Class

  export enum CategoryClass {
    ASEL = 'ASEL',		 	// Airplane Single-Engine Land
    AMEL = 'AMEL',		 	// Airplane Multi-Engine Land
    ASES = 'ASES',		 	// Airplane Single-Engine Sea
    AMES = 'AMES',		 	// Airplane Multi-Engine Sea
    RH = 'RH',	 			// Rotocraft Helicopter
    RG = 'RG',	 			// Rotocraft Gyroplane
    GL = 'GL',	 			// Glider
    LA = 'LA',	 			// Lighter Than Air Airship
    LB = 'LB',	 			// Lighter Than Air Balloon
    PLIFT = 'PLIFT',		// Powered Lift
    PL = 'PL',				// Powered Parachute Land
    PS = 'PS', 				// Powered Parachute Land
    WL = 'WL',				// Weight Shift Control Land
    WS = 'WS',				// Weight Shift Control Sea
  }
  export const categoryClassObj = Object.values(CategoryClass);

  /**
   * Convert CategoryClass to string
   * @param catClass CategoryClass
   * @returns the string
   */
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

  // ----------------------------------------------------------------------------------------------
  // Gear Type

  export enum GearType {
    AM = 'AM', // Amphibian
    FC = 'FC', // Fixed Tailwheel
    FT = 'FT', // Fixed Tricycle
    FL = 'FL', // Floats
    RC = 'RC', // Retractable Tailwheel
    RT = 'RT', // Retractable Tricycle
    SK = 'SK', // Skids
    SI = 'SI', // Skis
  }
  export const gearTypeObj = Object.values(GearType);

  /**
   * Convert GearType to string
   * @param catClass GearType
   * @returns the string
   */
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

  // ----------------------------------------------------------------------------------------------
  // Engine Type

  export enum EngineType {
    DS = 'DS', // Diesel
    EL = 'EL', // Electric
    NP = 'NP', // Non-Powered
    PT = 'PT', // Piston
    RA = 'RA', // Radial
    TF = 'TF', // Turbofan
    TJ = 'TJ', // Turbojet
    TP = 'TP', // Turboprop
    TS = 'TS', // Turboshaft
  }
  export const engineTypeObj = Object.values(EngineType);

  /**
   * Convert EngineType to string
   * @param catClass EngineType
   * @returns the string
   */
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

  // ----------------------------------------------------------------------------------------------
  // Validators
  // ----------------------------------------------------------------------------------------------

  export namespace validate {

    export const altitudeChange = (alt: string): boolean => altitudeChangeObj.includes(alt as AltitudeChange);
    export const updateChange = (update: string): boolean => updateTypeObj.includes(update as UpdateType);
    export const categoryClass = (catClass: string): boolean => categoryClassObj.includes(catClass as CategoryClass);
    export const gearType = (gearType: string): boolean => gearTypeObj.includes(gearType as GearType);
    export const engineType = (engineType: string): boolean => engineTypeObj.includes(engineType as EngineType);

  }

}