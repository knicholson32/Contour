export const toUnixStart = (date: string) => {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.floor(parsed.getTime() / 1000);
};

export const toUnixEnd = (date: string) => {
  const parsed = new Date(`${date}T23:59:59.999Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.floor(parsed.getTime() / 1000);
};

export const toISODate = (unixSeconds: number | null | undefined) => {
  if (!unixSeconds) return '';
  const date = new Date(unixSeconds * 1000);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

export const toDateString = (unixSeconds: number | null | undefined) => {
  if (!unixSeconds) return null;
  const date = new Date(unixSeconds * 1000);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

export const hours = (value: number | null | undefined) => {
  value = (value === null || value === undefined) ? 0 : Number.parseFloat(value.toFixed(2));
  if (value === 0) return '';
  return value;
}

export const describeAircraft = (record: {
  registration: string;
  type: { make: string; model: string; typeCode: string } | null;
}) => {
  if (!record.type) return record.registration;
  return `${record.registration} · ${record.type.make} ${record.type.model} (${record.type.typeCode})`;
};

export const formatAirport = (airport: { id: string; name: string | null } | null) => {
  if (!airport) return '';
  // if (airport.name && airport.name.trim().length > 0) return `${airport.id} · ${airport.name}`;
  return airport.id;
};

export const formatApproaches = (
  approaches: { type: string; runway: string | null; airportId: string; notes: string | null }[]
) => {
  if (approaches.length === 0) return '';
  return approaches
    .map((approach) => {
      const runway = approach.runway ? ` RWY ${approach.runway}` : '';
      const notes = approach.notes ? ` (${approach.notes})` : '';
      return `${approach.type} @ ${approach.airportId}${runway}${notes}`;
    })
    .join(' | ');
};