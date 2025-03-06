import prisma from '$lib/server/prisma';

export const load = async ({ parent, url }) => {


  const airportsRaw = await prisma.airport.findMany({  include: { legOrigin: true, legDestination: true } });

  const airports = airportsRaw.filter((a) => {
    if (a.legOrigin.length === 0 || a.legDestination.length === 0) return false;
    // if (a.legOrigin.length + a.legDestination.length > 100) return false;
    return true;
  });

  // let airports: typeof airportsAll = [];
  // {
  //   let totalOperations = 0;
  //   const airportPercentageOperations: {[key: string]: number} = {};
  //   for (const airport of airportsAll) totalOperations += airport.legOrigin.length + airport.legDestination.length;
  //   for (const airport of airportsAll) airportPercentageOperations[airport.name] = (airport.legOrigin.length + airport.legDestination.length) / totalOperations;
  //   // airports = airportsAll.filter(airport => airportPercentageOperations[airport.name] > 0.01);
  //   // airports = airportsAll.filter((v, i) => i < 10);/
  // }

  
  // const names = ['Apple', 'HTC', 'Huawei', 'LG', 'Nokia', 'Samsung', 'Sony', 'Other']

  const names = airports.map(airport => airport.id);
  const countries: string[] = [];
  for (const airport of airports) countries.push(airport.countryCode);
  // const countries = ['US', 'Taiwan', 'China', 'South Korea', 'Finland', 'South Korea', 'Japan', 'unknown']
  
  const airportPercentageOperations: {[key: string]: number} = {};
  let totalOperations = 0;
  for (const airport of airports) totalOperations += airport.legOrigin.length + airport.legDestination.length;
  for (const airport of airports) airportPercentageOperations[airport.name] = (airport.legOrigin.length + airport.legDestination.length) / totalOperations;

  const values: number[][] = [];

  for (const airport of airports) {
    const row: number[] = [];
    for (const airport2 of airports) {
      let value = 0;
      for (const leg of airport.legOrigin) {
        const aID = (leg.diversionAirportId === null) ? leg.destinationAirportId : leg.diversionAirportId;
        if (aID === airport2.id) value++;
      }
      for (const leg of airport.legDestination) {
        if (leg.originAirportId === airport2.id) value++;
      }
      row.push(value / (airport.legOrigin.length + airport.legDestination.length));
    }
    for (let i = 0; i < row.length; i++) {
      row[i] *= airportPercentageOperations[airports[i].name];
      if (isNaN(row[i])) {
        console.log('ERR')
        console.log(airportPercentageOperations[airports[i].name]);
        // return {}
      }
    }
    values.push(row);
  }


  // const values = [
  //   [0.096899, 0.008859, 0.000554, 0.004430, 0.025471, 0.024363, 0.005537, 0.025471],
  //   [0.001107, 0.018272, 0.000000, 0.004983, 0.011074, 0.010520, 0.002215, 0.004983],
  //   [0.000554, 0.002769, 0.002215, 0.002215, 0.003876, 0.008306, 0.000554, 0.003322],
  //   [0.000554, 0.001107, 0.000554, 0.012182, 0.011628, 0.006645, 0.004983, 0.010520],
  //   [0.002215, 0.004430, 0.000000, 0.002769, 0.104097, 0.012182, 0.004983, 0.028239],
  //   [0.011628, 0.026024, 0.000000, 0.013843, 0.087486, 0.168328, 0.017165, 0.055925],
  //   [0.000554, 0.004983, 0.000000, 0.003322, 0.004430, 0.008859, 0.017719, 0.004430],
  //   [0.002215, 0.007198, 0.000000, 0.003322, 0.016611, 0.014950, 0.001107, 0.054264],
  // ]


  const colorsRaw = [
    '#4D8CFD',
    '#FF6B7E',
    '#F4B83E',
    '#A6CC74',
    '#00C19A',
    '#6859BE',
    '#b6128c',
    '#737373',
  ];

  const colors: string[] = [];
  for (let i = 0; i < countries.length; i++) {
    colors.push(colorsRaw[i % colorsRaw.length]);
  }

  // for (const v of values) console.log(v.join(', '));
  // console.log(values.length, values[0].length);


  return {
    names,
    countries,
    colors,
    values
  };
}