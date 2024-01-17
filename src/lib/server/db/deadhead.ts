// ------------------------------------------------------------------------------------------------
// External Tools
// ------------------------------------------------------------------------------------------------

import prisma from "$lib/server/prisma"


export const generateDeadheads = async (dayId: number) => {
  const day = await prisma.dutyDay.findUnique({ where: { id: dayId }, include: { legs: { orderBy: { startTime_utc: 'asc' } } }});

  if (day === null) return;

  try {

    await prisma.deadhead.deleteMany({ where: { dayId }});

    // Generate deadheads

    console.log(day);

    // 1. Leg from duty-day start to first

    if (day.legs.length === 0) {
      await prisma.deadhead.create({
        data: {
          dayId,
          originAirportId: day.startAirportId,
          destinationAirportId: day.endAirportId,
          startTime_utc: day.startTime_utc,
          endTime_utc: day.endTime_utc
        }
      });
    } else {


      // Start of day
      //  |
      // n-legs
      //  |
      // End of day

      // First leg
      if (day.startAirportId !== day.legs[0].originAirportId) {
        console.log('first leg mismatch');
        await prisma.deadhead.create({ data: {
          dayId,
          originAirportId: day.startAirportId,
          destinationAirportId: day.legs[0].originAirportId,
          startTime_utc: day.startTime_utc,
          endTime_utc: day.legs[0].startTime_utc ?? day.startTime_utc
        }});
      }

      let i = 0;

      if (day.legs.length > 1) {
        for (i = 0; i < day.legs.length - 1; i++) {
          const lastLeg = day.legs[i];
          const nextLeg = day.legs[i + 1];
          if ((lastLeg.diversionAirportId === null ? lastLeg.destinationAirportId : lastLeg.diversionAirportId) === nextLeg.originAirportId) continue;
          console.log('intermediate deadhead');
          await prisma.deadhead.create({
            data: {
              dayId,
              originAirportId: lastLeg.diversionAirportId === null ? lastLeg.destinationAirportId : lastLeg.diversionAirportId,
              destinationAirportId: nextLeg.originAirportId,
              startTime_utc: lastLeg.endTime_utc ?? day.startTime_utc,
              endTime_utc: nextLeg.startTime_utc ?? day.endTime_utc,
            }
          });
        }
      }

      if (day.endAirportId !== day.legs[i].destinationAirportId) {
        console.log('last leg mismatch');
        await prisma.deadhead.create({
          data: {
            dayId,
            originAirportId: day.legs[i].diversionAirportId === null ? day.legs[i].destinationAirportId : day.legs[i].diversionAirportId as string,
            destinationAirportId: day.endAirportId,
            startTime_utc: day.legs[i].endTime_utc ?? day.startTime_utc,
            endTime_utc: day.endTime_utc
          }
        });
      }
    }

    const deadheads = await prisma.deadhead.findMany({ where: { dayId }, orderBy: { startTime_utc: 'asc' } });
    console.log(deadheads);

  } catch(e) {
    console.log('Error creating deadheads', e);
  }
}