<script lang="ts">
  import Frame from "./Frame.svelte";

  export let title: string;
  export let href: string;
  export let target: '_blank' | '_parent' | '_self' | '_top' = '_blank';

</script>


<a target={target} href={href} >
  <Frame name={''} form={null} required={false} bind:title link={true} />
</a>