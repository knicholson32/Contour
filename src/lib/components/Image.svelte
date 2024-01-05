<script lang="ts">
  export let id: string | null;
  export let size: string | number;

  export let lazy: boolean | undefined = false;
  export let offScreen: boolean | undefined = false;
  export let alt: string | undefined = undefined;

  const pixelRatios = [0.5, 1, 2, 3, 4, 6];

  
  const calculateSizeOption = (size: number, pixelRatio: number) => {
    const calibratedSize = size * pixelRatio;
    if (calibratedSize > 2048) return 'full';
    if (calibratedSize > 1024) return '2048';
    if (calibratedSize > 768) return '1024';
    if (calibratedSize > 512) return '768';
    if (calibratedSize > 256) return '512';
    if (calibratedSize > 128) return '256';
    return '128'
  }

  const getSrcSet = (format: string, size: number | string): string => {
    if (size === 'full' || (typeof size === 'string'))
      return `/api/image/{id}/full/${format}`;
    else {
      return pixelRatios.flatMap((e) => `/api/image/${id}/${calculateSizeOption(size, e)}/${format} ${e}x`).join(', ');
    }
  }

</script>

{#if id === null}
  <div class={$$restProps.class}></div>
{:else}
  <picture>
    <source srcset={getSrcSet('avif', size)} type="image/avif">
    <source srcset={getSrcSet('jpeg', size)} type="image/jpeg">
    <img src="/api/image/{id}/full/jpeg" 
      {...$$restProps}
      loading={lazy ? 'lazy' : 'eager'}
      decoding={offScreen ? 'async' : 'auto'}
      alt={alt !== undefined ? alt : undefined}
      role={alt === undefined ? 'presentation' : undefined}>
  </picture>
{/if}