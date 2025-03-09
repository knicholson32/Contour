<script lang="ts">
  import GitCommit from '$lib/components/routeSpecific/changelog/GitCommit.svelte';
  import OneColumn from '$lib/components/scrollFrames/OneColumn.svelte';
  import { invalidateAll } from '$app/navigation';
  import { browser } from '$app/environment';
  import { GitCommitIcon } from 'lucide-svelte';
  import { page } from '$app/stores';
  

  interface Props {
    data: import('./$types').PageData;
  }

  let { data }: Props = $props();
  if (browser && data.contourUpdates === true) invalidateAll();

  let newRemaining = true;
  const getIsNewCommit = (commit: string) => {
    if (commit === ($page.url.searchParams.get('lastCommit'))) {
      newRemaining = false;
      return false;
    }
    return newRemaining;
  }

</script>

<OneColumn white={true} type={'safe'}>
  <div class="mx-auto max-w-7xl w-full flex flex-col gap-4 px-6 py-4">
    {#if data.commits === null || data.currentCommit === null}
      <div class="absolute top-0 bottom-0 left-0 right-0 flex items-center justify-center">
        <div class="text-center">
          <GitCommitIcon class="h-12 w-12 mx-auto"/>
          <h3 class="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">No Commits</h3>
          <p class="mt-1 text-sm text-gray-400">Contour cannot find any commits.<br/> Please check another time.</p>
        </div>
      </div>
    {:else}
      <div class="w-full relaitve inline-flex items-center justify-center">
        <GitCommitIcon class="h-12 w-12 absolute mx-auto"/>
        <span class="">Current Commit</span>
        <span class="flex-grow"></span>
      </div>
      
      <GitCommit commit={data.currentCommit} isNewCommit={getIsNewCommit(data.currentCommit.sha)} />

      <div>
        More Commits
      </div>
      {#each data.commits as commit (commit.sha)}
        <GitCommit commit={commit} isNewCommit={getIsNewCommit(commit.sha)} />
      {/each}
      <a href="https://github.com/knicholson32/Contour/commits/main/" target="_blank" class="w-full my-2 mx-3 text-center hover:underline gap-1">See all commits →</a>
    {/if}
  </div>
</OneColumn>