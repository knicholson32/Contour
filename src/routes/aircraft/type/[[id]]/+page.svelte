<script lang="ts">
  import { enhance } from '$app/forms';
  import Section from '$lib/components/Section.svelte';
  import Submit from '$lib/components/buttons/Submit.svelte';
  import Image from '$lib/components/Image.svelte';
  import TwoColumn from '$lib/components/scrollFrames/TwoColumn.svelte';
  import { icons } from '$lib/components';
  import Stats from '$lib/components/decorations/Stats.svelte';
  import { page } from '$app/state';
  import { goto} from '$app/navigation';
  import Badge from '$lib/components/decorations/Badge.svelte';
  import * as MenuForm from '$lib/components/menuForm';
  import Tag from '$lib/components/decorations/Tag.svelte';
  import { FormManager, clearUID } from '$lib/components/entry/localStorage';
  import * as Entry from '$lib/components/entry';
  import MenuElement from '$lib/components/menuForm/MenuElement.svelte';
  import MenuSection from '$lib/components/menuForm/MenuSection.svelte';
  import { Search } from 'lucide-svelte';

  interface Props {
    data: import('./$types').PageData;
    form: import('./$types').ActionData;
  }

  let { data, form: formData }: Props = $props();

  let submitting = $state(false);
  let deleting = $state(false);

  const formManager = new FormManager();
  const unsavedChanges = formManager.getUnsavedChangesStore();
  const unsavedUIDs = formManager.getUnsavedUIDsStore();
  $effect(() => {
    formManager.updateUID(data.type?.id ?? 'new-type');
  });
  $effect(() => {
    formManager.updateForm(formData);
  });

  let urlActiveParam: string | undefined = $state();
  let isMobileSize: boolean | undefined = $state();

  const ref = page.url.searchParams.get('ref');

  const onMenuBack = () => {
    if (ref === null) goto('/aircraft');
    else goto(ref);
  }

  let engineType: string | null = $state(null);

</script>

<TwoColumn menuZone="scroll" {ref} formZone="scroll" bind:urlActiveParam bind:isMobileSize backText="Back" onMenuBack={onMenuBack} >

  <!-- Menu Side -->
  {#snippet menu()}
    <nav class="shrink dark:divide-zinc-800" aria-label="Directory">
      <MenuForm.Title title="Aircraft Types" />
      <MenuForm.Link href={ref ?? '/aircraft'} type="left" text="Back to Aircraft" />
      {#if data.orderGroups.length === 0}
        <MenuForm.BlankMenu href={'/aircraft/type/new?' + urlActiveParam} title="No aircraft types" subtitle="Get started by creating a new aircraft type." buttonText="New Aircraft"/>
      {:else}
        <MenuForm.Link href={'/aircraft/type/new?' + urlActiveParam} selected={page.url.pathname.endsWith('new') && !isMobileSize} icon={icons.plus} text="Create a new aircraft type" type="right"/>
        <MenuForm.SearchBar />
        <!-- Existing Aircraft -->
        {#each data.orderGroups as group (group.make)}
          <MenuSection title={group.make}>
            {#each group.types as type (type.id)}
              <MenuElement href="/aircraft/type/{type.id}?{urlActiveParam}" selected={type.id === page.params.id && !isMobileSize} includePadding={false}>
                {#if type.imageId !== null}
                  <div class="h-12 w-12 my-2 flex-none shrink-0 rounded-lg overflow-hidden bg-gray-50">
                    <Image id={type.imageId} size={48} class="aspect-1 object-cover w-full h-full" alt="Icon for the {type.make} {type.model}"/>
                    <Badge class="absolute top-[4px] left-[4px]">{type._count.aircraft}</Badge>
                  </div>
                {:else}
                  <div class="h-12 w-12 my-2 shrink-0 rounded-lg bg-gray-300 text-black uppercase font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap flex items-center justify-center">
                    {type.typeCode.substring(0, (type.typeCode.length < 4 ? type.typeCode.length : 5))}
                    <Badge class="absolute top-[4px] left-[4px]">{type._count.aircraft}</Badge>
                  </div>
                {/if}
                <div class="flex flex-col gap-1 overflow-hidden py-2 flex-initial">
                  <div class="uppercase font-bold text-xs overflow-hidden whitespace-nowrap text-ellipsis">{type.make} {type.model}</div>
                  <div class="text-xs uppercase inline-flex gap-2 items-baseline">
                    {type.catClass} - {type.typeCode}
                    {#if $unsavedUIDs.includes(type.id)}
                      <Tag>UNSAVED</Tag>
                    {/if}
                  </div>
                </div>
                <div class="absolute right-1">
                  <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" >
                    {@html icons.chevronRight}
                  </svg>
                </div>
              </MenuElement>
            {/each}
          </MenuSection>  
        {/each}
      {/if}
    </nav>
  {/snippet}
  
  <!-- Form Side -->
  {#snippet form()}
    <div class="shrink">
      <form id="form-create-or-mod" action="?/createOrModify&{page.url.search}" method="post" enctype="multipart/form-data" use:enhance={() => {
        submitting = true;
        return async ({ update }) => {
          await update({ reset: false });
          submitting = false;
          setTimeout(() => {
            if (formData?.ok !== false) formManager.clearUID(false);
          }, 1);
        };
      }}>

        {#if data.type !== null}
          <MenuForm.FormHeader title={`${data.type.make} ${data.type.model}`}>
            <Stats values={[
              {title: 'Total Legs', value: data.numLegs.toLocaleString(), href: `/entry/leg?active=form&search=${data.type.typeCode}`},
              {title: 'Total Flight Time', value: data.totalTime.toFixed(1) + ' hr'},
              {title: 'Avg. Leg Length', value: (data.numLegs === 0 ? 0 : (data.totalTime / data.numLegs).toFixed(1)) + ' hr'},
              {title: 'Diversion %', value: (data.numLegs === 0 ? 0 : (100 * data.numDiversions / data.numLegs).toFixed(0)) + '%'}
            ]}/>
            <div class="w-full h-1"></div>
            <MenuForm.Link theme='FormHeader' href={`/aircraft/entry?active=form&search=${data.type.typeCode}`} text={`See Aircraft of this Type`}>
              <Search class="w-3 h-3 text-white"/>
            </MenuForm.Link>
            <MenuForm.Link theme='FormHeader' href={`/entry/leg?active=form&search=${data.type.typeCode}`} text={`See Legs for this Type`}>
              <Search class="w-3 h-3 text-white"/>
            </MenuForm.Link>
          </MenuForm.FormHeader>
        {/if}

        <Section title="General" error={formData !== null && formData.ok === false && formData.action === '?/default' && formData.name === '*' ? formData.message : null}>
          <Entry.Input required={true} title="Type Code" name="typeCode" defaultValue={data.type?.typeCode ?? null} placeholder="CL30" uppercase={true} />
          <Entry.Input required={false} title="Sub Code" name="subCode" defaultValue={data.type?.subCode ?? null} placeholder="350" uppercase={true} />
          <Entry.Input required={true} title="Make" name="make" defaultValue={data.type?.make ?? null} placeholder="Bombardier" uppercase={false} />
          <Entry.Input required={true} title="Model" name="model" defaultValue={data.type?.model ?? null} placeholder="Challenger 350" uppercase={false} />
        </Section>

        <Section title="Type">
          <Entry.Select required={true} title="Category / Class" options={data.enums.categoryClass ?? null} placeholder="Unset" name="catClass" defaultValue={data.type?.catClass ?? null} />
          <Entry.Select required={true} title="Gear Type" options={data.enums.gearType ?? null} name="gear" defaultValue={data.type?.gear ?? null} placeholder="Unset" />
          <Entry.Select required={true} title="Engine Type" options={data.enums.engineType ?? null} placeholder="Unset" name="engine" defaultValue={data.type?.engine ?? null} bind:value={engineType} />
          <Entry.Switch title="Complex" name="complex" defaultValue={data.type?.complex ?? false} />
          <Entry.Switch title="Technically Advanced" name="taa" defaultValue={data.type?.taa ?? false} />
          <Entry.Switch title="High Performance" name="highPerformance" defaultValue={data.type?.highPerformance ?? false} />
          <Entry.Switch title="Pressurized" name="pressurized" defaultValue={data.type?.pressurized ?? false} />
          <Entry.Switch title="Type Rating Required" name="typeRatingRequired" disabled={engineType !== null && engineType.startsWith('T')} defaultValue={engineType !== null && engineType.startsWith('T') ? true : data.type?.typeRatingRequired ?? false} />
        </Section>

        <Section title="Generic Type Image" error={formData !== null && formData.ok === false && formData.action === '?/default' && formData.name === 'image' ? formData.message : null}>
          <Entry.ImageUpload name="image" initialImageId={data.type?.imageId ?? null} maxMB={data.MAX_MB}/>
        </Section>
      </form>

      <div class="inline-flex -mt-[2px] py-3 px-5 w-full flex-row gap-3 justify-end sticky bottom-0 z-10">
        {#if data.type !== null}
          <form class="grow max-w-[33%] md:w-48 md:grow-0 flex items-start" action="?/delete" method="post" use:enhance={({ cancel }) => {
            const answer = confirm('Are you sure you want to delete this Aircraft Type? This action cannot be undone.');
            if (!answer) cancel();
            else {
              deleting = true;
              return async ({ update }) => {
                await update({ invalidateAll: true });
                deleting = false;
                if (formData?.ok !== false) formManager.clearUID(false);
              };
            }
          }}>
            <input type="hidden" name="id" value={data.type?.id} />
            <Submit class="w-full" failed={formData?.ok === false && formData.action === '?/default'} submitting={deleting} theme={{primary: 'red'}} actionText={'Delete'} actionTextInProgress={'Deleting'} />
          </form>
        {/if}
        {#if $unsavedChanges}
          <button type="button" onclick={() => clearUID(true)} class="grow w-full md:w-48 md:grow-0 touch-manipulation select-none transition-colors px-3 py-2 rounded-md text-sm font-semibold shadow-xs focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 ring-1 ring-inset ring-gray-300 bg-white text-gray-800 betterhover:hover:bg-gray-100 betterhover:hover:text-gray-900 focus-visible:outline-grey-500">Clear</button>
          <Submit remoteForm="form-create-or-mod" class="grow w-full md:w-48 md:grow-0" failed={formData?.ok === false && (formData.action === '?/default' || formData?.action === '*')} {submitting} theme={{primary: 'white'}} actionText={data.type !== null ? 'Update' : 'Create'} actionTextInProgress={data.type !== null ? 'Updating' : 'Creating'} />
        {/if}
      </div>

    </div>
  {/snippet}

</TwoColumn>
