<script lang="ts">
  import { enhance } from '$app/forms';
  import Section from '$lib/components/Section.svelte';
  import Input from '$lib/components/routeSpecific/entry/Input.svelte';
  import Select from '$lib/components/routeSpecific/entry/Select.svelte';
  import Switch from '$lib/components/routeSpecific/entry/Switch.svelte';
  import Submit from '$lib/components/buttons/Submit.svelte';
  import Image from '$lib/components/Image.svelte';
  import TwoColumn from '$lib/components/scrollFrames/TwoColumn.svelte';
  import { icons } from '$lib/components';
  import ImageUpload from '$lib/components/routeSpecific/entry/ImageUpload.svelte';

  export let data: import('./$types').PageData;
	export let form: import('./$types').ActionData;

  let submitting = false;

  const update = () => {
    console.log('update');
    backText = 'Cancel';
  }

  const toggleActiveCol = () => {
    console.log('toggle');
    if (activeOnSingleCol === 'menu') activeOnSingleCol = 'form';
    else activeOnSingleCol = 'menu';
  }

  let activeOnSingleCol: 'menu' | 'form' = 'menu';
  let ratio = 0.33;
  let backText = 'Back';

</script>

<TwoColumn menu="scroll" form="scroll" bind:backText defaultRatio={0.50} bind:ratio bind:activeOnSingleCol={activeOnSingleCol}>

  <nav slot="mobile-menu" class="h-full" aria-label="Directory">
    {#if data.orderGroups.length === 0}
      <div class="text-center w-full h-full flex flex-col justify-center items-center">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        </svg>
        <h3 class="mt-2 text-sm font-semibold text-gray-900">No aircraft types</h3>
        <p class="mt-1 text-sm text-gray-500">Get started by creating a new aircraft type.</p>
        <div class="mt-6">
          <button on:click={toggleActiveCol} type="button" class="inline-flex items-center rounded-md bg-sky-500 px-3 py-2 text-sm font-semibold text-white shadow-sm betterhover:hover:bg-sky-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500">
            <svg class="-ml-0.5 mr-1.5 h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            New Aircraft
          </button>
        </div>
      </div>
    {:else}
      <a href="/aircraft/type/new" on:click={toggleActiveCol} class="relative flex flex-row justify-left items-center gap-2 pl-2 pr-6 py-2 bg-white hover:bg-gray-200 hover:text-black">
        <div class="h-7 w-7 mx-2.5 flex-shrink-0 rounded-full bg-gray-600 text-black uppercase font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap flex items-center justify-center">
          <svg class="h-4 w-4 shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" >
            {@html icons.plus}
          </svg>
        </div>
        <div class="flex flex-col gap-1 overflow-hidden flex-initial">
          <div class="uppercase font-bold text-xs overflow-hidden whitespace-nowrap text-ellipsis">Create a new aircraft type</div>
        </div>
        <div class="absolute right-1">
          <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" >
            {@html icons.chevronRight}
          </svg>
        </div>
      </a>
      {#each data.orderGroups as group (group.make)}
        <Section title={group.make}>
          {#each group.types as type (type.typeCode)}
            <a href="/aircraft/type/{type.id}" on:click={toggleActiveCol} class="relative flex flex-row justify-left items-center gap-2 pl-2 pr-6 py-2 hover:bg-gray-200 hover:text-black">
              {#if type.imageId !== null}
                <div class="h-12 w-12 flex-none flex-shrink-0 rounded-lg overflow-hidden bg-gray-50">
                  <Image id={type.imageId} size={48} class="aspect-1 object-cover w-full h-full" alt="Icon for the {type.make} {type.model}"/>
                </div>
              {:else}
                <div class="h-12 w-12 flex-shrink-0 rounded-lg bg-gray-200 text-black uppercase font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap flex items-center justify-center">
                  {type.typeCode.substring(0, (type.typeCode.length < 4 ? type.typeCode.length : 5))}
                </div>
              {/if}
              <div class="flex flex-col gap-1 overflow-hidden flex-initial">
                <div class="uppercase font-bold text-xs overflow-hidden whitespace-nowrap text-ellipsis">{type.make} {type.model}</div>
                <div class="text-xs overflow-hidden uppercase whitespace-nowrap text-ellipsis">{type.catClass} - {type.typeCode}</div>
              </div>
              <div class="absolute right-1">
                <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" >
                  {@html icons.chevronRight}
                </svg>
              </div>
            </a>
          {/each}
        </Section>  
      {/each}
    {/if}
  </nav>

  <nav slot="menu" class="h-full" aria-label="Directory">
    {#if data.orderGroups.length === 0}
      <div class="text-center w-full h-full flex flex-col justify-center items-center">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        </svg>
        <h3 class="mt-2 text-sm font-semibold text-gray-900">No aircraft types</h3>
        <p class="mt-1 text-sm text-gray-500">Get started by creating a new aircraft type.</p>
        <div class="mt-6">
          <button on:click={toggleActiveCol} type="button" class="inline-flex items-center rounded-md bg-sky-500 px-3 py-2 text-sm font-semibold text-white shadow-sm betterhover:hover:bg-sky-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500">
            <svg class="-ml-0.5 mr-1.5 h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            New Aircraft
          </button>
        </div>
      </div>
    {:else}
      <a href="/aircraft/type/new" on:click={toggleActiveCol} class="relative flex flex-row justify-left items-center gap-2 pl-2 pr-6 py-2 bg-white hover:bg-gray-200 hover:text-black">
        <div class="h-7 w-7 mx-2.5 flex-shrink-0 rounded-full bg-gray-600 text-black uppercase font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap flex items-center justify-center">
          <svg class="h-4 w-4 shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" >
            {@html icons.plus}
          </svg>
        </div>
        <div class="flex flex-col gap-1 overflow-hidden flex-initial">
          <div class="uppercase font-bold text-xs overflow-hidden whitespace-nowrap text-ellipsis">Create a new aircraft type</div>
        </div>
        <div class="absolute right-1">
          <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" >
            {@html icons.chevronRight}
          </svg>
        </div>
      </a>
      {#each data.orderGroups as group (group.make)}
        <Section title={group.make}>
          {#each group.types as type (type.typeCode)}
            <a href="/aircraft/type/{type.id}" on:click={toggleActiveCol} class="relative flex flex-row justify-left items-center gap-2 pl-2 pr-6 py-2 {type.id === data.params.id ? 'bg-gray-200' : 'hover:bg-gray-200 hover:text-black'}">
              {#if type.imageId !== null}
                <div class="h-12 w-12 flex-none flex-shrink-0 rounded-lg overflow-hidden bg-gray-50">
                  <Image id={type.imageId} size={48} class="aspect-1 object-cover w-full h-full" alt="Icon for the {type.make} {type.model}"/>
                </div>
              {:else}
                <div class="h-12 w-12 flex-shrink-0 rounded-lg bg-gray-200 text-black uppercase font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap flex items-center justify-center">
                  {type.typeCode.substring(0, (type.typeCode.length < 4 ? type.typeCode.length : 5))}
                </div>
              {/if}
              <div class="flex flex-col gap-1 overflow-hidden flex-initial">
                <div class="uppercase font-bold text-xs overflow-hidden whitespace-nowrap text-ellipsis">{type.make} {type.model}</div>
                <div class="text-xs overflow-hidden uppercase whitespace-nowrap text-ellipsis">{type.catClass} - {type.typeCode}</div>
              </div>
              <div class="absolute right-1">
                <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" >
                  {@html icons.chevronRight}
                </svg>
              </div>
            </a>
          {/each}
        </Section>  
      {/each}
    {/if}
  </nav>
  
  <div slot="form" class="flex-shrink">
    <form  method="post" enctype="multipart/form-data" use:enhance={() => {
      submitting = true;
      return async ({ update }) => {
        await update({ reset: false });
        submitting = false;
        setTimeout(() => {
          if (form?.ok !== false) activeOnSingleCol = 'menu';
        }, 1);
      };
    }}>

      {#if data.type !== null}

        <Section title="General" error={form !== null && form.ok === false && form.action === '?/default' && form.name === '*' ? form.message : null}>
          <Input {form} required={true} title="Type Code" name="typeCode" value={data.type?.typeCode} placeholder="CL30" uppercase={true} update={update} />
          <Input {form} required={false} title="Sub Code" name="subCode" value={data.type?.subCode} placeholder="350" uppercase={true} update={update} />
          <Input {form} required={true} title="Make" name="make" value={data.type?.make} placeholder="Bombardier" uppercase={false} update={update} />
          <Input {form} required={true} title="Model" name="model" value={data.type?.model} placeholder="Challenger 350" uppercase={false} update={update} />
        </Section>

        <Section title="Type">
          <Select {form} required={true} title="Category / Class" options={data.enums.categoryClass} placeholder="Unset" name="catClass" value={data.type?.catClass} update={update} />
          <Select {form} required={true} title="Gear Type" options={data.enums.gearType} name="gear" value={data.type?.gear} placeholder="Unset" update={update} />
          <Select {form} required={true} title="Engine Type" options={data.enums.engineType} placeholder="Unset" name="engine" value={data.type?.engine} update={update} />
          <Switch {form} title="Complex" name="complex" value={data.type?.complex} update={update} />
          <Switch {form} title="Technically Advanced" name="taa" value={data.type?.taa} update={update} />
          <Switch {form} title="High Performance" name="highPerformance" value={data.type?.highPerformance} update={update} />
          <Switch {form} title="Pressurized" name="pressurized" value={data.type?.pressurized} update={update} />
        </Section>

        <Section title="Generic Type Image" error={form !== null && form.ok === false && form.action === '?/default' && form.name === 'image' ? form.message : null}>
          <ImageUpload name="image" initialImageId={data.type?.imageId ?? null} maxMB={data.MAX_MB} />
        </Section>
    
      {:else}
        <Section title="General" error={form !== null && form.ok === false && form.action === '?/default' && form.name === '*' ? form.message : null}>
          <Input {form} required={true} title="Type Code" name="typeCode" placeholder="CL30" uppercase={true} update={update} />
          <Input {form} required={false} title="Sub Code" name="subCode" placeholder="350" uppercase={true} update={update} />
          <Input {form} required={true} title="Make" name="make" placeholder="Bombardier" uppercase={false} update={update} />
          <Input {form} required={true} title="Model" name="model" placeholder="Challenger 350" uppercase={false} update={update} />
        </Section>

        <Section title="Type">
          <Select {form} required={true} title="Category / Class" options={data.enums.categoryClass} placeholder="Unset" name="catClass" update={update} />
          <Select {form} required={true} title="Gear Type" options={data.enums.gearType} name="gear" placeholder="Unset" update={update} />
          <Select {form} required={true} title="Engine Type" options={data.enums.engineType} placeholder="Unset" name="engine" update={update} />
          <Switch {form} title="Complex" name="complex" update={update} />
          <Switch {form} title="Technically Advanced" name="taa" update={update} />
          <Switch {form} title="High Performance" name="highPerformance" update={update} />
          <Switch {form} title="Pressurized" name="pressurized" update={update} />
        </Section>

        <Section title="Generic Type Image" error={form !== null && form.ok === false && form.action === '?/default' && form.name === 'image' ? form.message : null}>
          <ImageUpload name="image" maxMB={data.MAX_MB} />
        </Section>
      {/if}

      <div class="inline-flex -mt-[2px] py-3 px-5 w-full flex-row justify-end sticky bottom-0 z-10">
        <Submit class="w-full md:w-48" failed={form?.ok === false} {submitting} theme={{primary: 'white'}} actionText={data.type !== null ? 'Update' : 'Create'} actionTextInProgress={data.type !== null ? 'Updating' : 'Creating'} />
      </div>
    </form>
  </div>

</TwoColumn>
