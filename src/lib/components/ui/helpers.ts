export function color(options?: { opacity?: string, secondary?: boolean, accent?: boolean }) {
  let o = "1";
  let s = false;
  let a = false;
  if (options?.opacity !== undefined) o = options.opacity;
  if (options?.secondary !== undefined) s = options.secondary;
  if (options?.accent !== undefined) a = options.accent;
  return () => `hsl(var(--${s ? 'secondary' : a ? 'accent' : 'primary'}) / ${o})`;
}

export type Data = { average: number; today: number; id: number };

/**
 * If you want to set color for multiple lines at once, you'll have to define a colors array in your component and reference colors by index in the accessor function.
 * For example, in this instance below, we know that we only have 2 lines, so we can hardcode the colors array to return 2 colors for the 2 indexes i.e. 2 lines.
 */
export function lineColors<T>(_: T, i: number) {
  return ["hsl(var(--primary))", "hsl(var(--primary) / 0.25)"][i];
}

export function scatterPointColors<T>(_: T, i: number) {
  return ["hsl(0, 0%, 100%)", "hsl(var(--primary) / 0.25)"][i];
}

export function scatterPointStrokeColors<T>(_: T, i: number) {
  return ["hsl(var(--primary))", "hsl(var(--primary) / 0.25)"][i];
}

export function crosshairPointColors<T>(_: T, i: number) {
  return ["hsl(var(--primary))", "hsl(var(--primary) / 0.25)"][i];
}

export function crosshairStrokeWidths<T>(_: T, i: number) {
  return [2, 1][i];
}