<script lang="ts">
  export let color = true;
</script>

<div class="text-xxs rounded-full px-[5px] flex items-center justify-center {color ? 'text-white bg-sky-700' : ''} {$$restProps.class}">
  <slot/>
</div>