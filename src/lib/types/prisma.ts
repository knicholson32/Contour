// import { type Prisma, CategoryClass, GearType, EngineType } from '@prisma/client';


// ------------------------------------------------------------------------------------------------
// Debug Enums
// ------------------------------------------------------------------------------------------------

export enum Debug {
  NONE = 0,
  DEBUG = 1,
  VERBOSE = 2,
  VERY_VERBOSE = 3,
}

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

  /**
   * Convert AltitudeChange to string
   * @param altChange AltitudeChange
   * @returns the string
   */
  export const altitudeChangeToString = (altChange: AltitudeChange) => {
    switch (altChange) {
      case AltitudeChange.CLIMBING: return 'Climbing';
      case AltitudeChange.DESCENDING: return 'Descending';
      case AltitudeChange.LEVEL: return 'Level';
      default: return 'Unknown';
    }
  }

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
    TRACKER = 'TRACKER',
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

  export type CategoryAndClass = { category: string, class: string };
  /**
   * Convert CategoryClass to Category and Class Export
   * @param catClass CategoryClass
   * @returns Category and Class
   */
  export const categoryClassToExport = (catClass: CategoryClass): CategoryAndClass | null => {
    switch (catClass) {
      case CategoryClass.ASEL: return { category: 'airplane', class: 'airplane_single_engine_land'};
      case CategoryClass.AMEL: return { category: 'airplane', class: 'airplane_multi_engine_land'};
      case CategoryClass.ASES: return { category: 'airplane', class: 'airplane_single_engine_sea'};
      case CategoryClass.AMES: return { category: 'airplane', class: 'airplane_multi_engine_land'};
      case CategoryClass.RH: return { category: 'rotorcraft', class: 'rotorcraft_helicopter'};
      case CategoryClass.RG: return { category: 'rotorcraft', class: 'rotorcraft_gyroplane'};
      case CategoryClass.GL: return { category: 'glider', class: 'glider' };
      case CategoryClass.LA: return { category: 'lta', class: 'lta_airship'};
      case CategoryClass.LB: return { category: 'lta', class: 'lta_balloon'};
      case CategoryClass.PLIFT: return { category: 'powered_lift', class: 'powered_lift' };
      case CategoryClass.PL: return { category: 'powered_parachute', class: 'powered_parachute_land' };
      case CategoryClass.PS: return { category: 'powered_parachute', class: 'powered_parachute_sea' };
      case CategoryClass.WL: return { category: 'weight_shift_control', class: 'weight_shift_control_land' };
      case CategoryClass.WS: return { category: 'weight_shift_control', class: 'weight_shift_control_sea' };
      default: return null;
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

  /**
 * Convert GearType to export format
 * @param catClass GearType
 * @returns the string
 */
  export const gearTypeToExport = (gearType: GearType) => {
    switch (gearType) {
      case GearType.AM: return 'amphibian';
      case GearType.FC: return 'fixed_tailwheel';
      case GearType.FT: return 'fixed_tricycle';
      case GearType.FL: return 'gloats';
      case GearType.RC: return 'retractable_tailwheel';
      case GearType.RT: return 'retractable_tricycle';
      case GearType.SK: return 'skids';
      case GearType.SI: return 'skis';
      default: return null;
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