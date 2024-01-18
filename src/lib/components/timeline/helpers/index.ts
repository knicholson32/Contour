export const convertUTCToPercent = (i: number, utc: number | null, startTime: number, endTime: number): number => {
  if (utc === null) return 0;
  // if (i === 0) return -10;
  utc = utc * 1000;
  const span = endTime * 1000 - startTime * 1000;
  const start = startTime * 1000;
  return ((utc - start) / span) * 100;
}

export const convertUTCToWidth = (i: number, utc1: number | null, utc2: number | null, startTime: number, endTime: number): number => {
  if (utc1 === null || utc2 === null) return 0;
  utc1 = utc1 * 1000;
  utc2 = utc2 * 1000;

  const span = endTime * 1000 - startTime * 1000;

  let val = ((utc2 - utc1) / span) * 100;
  return val;
};

const bgColors = [
  'bg-red-500 ring-red-500',
  'bg-amber-500 ring-amber-500',
  'bg-pink-500 ring-pink-500',
  'bg-lime-500 ring-lime-500',
];

const textColors = [
  'text-red-500',
  'text-amber-500',
  'text-pink-500',
  'text-lime-500',
];

let offset = Math.floor(Math.random() * bgColors.length);

export const getBackground = (i: number, type: 'leg' | 'deadhead') => {
  if (type === 'deadhead') return 'bg-slate-700 ring-slate-700';
  i = i + offset;
  if (i > bgColors.length - 1) i = i - bgColors.length;
  return bgColors[i];
};

export const getText = (i: number, type: 'leg' | 'deadhead') => {
  if (type === 'deadhead') return 'text-slate-400';
  i = i + offset;
  if (i > textColors.length - 1) i = i - textColors.length;
  return textColors[i];
};