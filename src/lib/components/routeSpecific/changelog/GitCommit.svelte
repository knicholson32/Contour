<script lang="ts">
  import type { GitCommit } from "$lib/server/api/git/schema";

  export let isNewCommit: boolean;
  export let commit: GitCommit;

</script>

<div class="relative inline-flex items-center hover:bg-gray-50 dark:hover:bg-zinc-800 gap-2 rounded-md border border-gray-200 dark:border-zinc-800 px-6 py-3">
  {#if isNewCommit}
    <div class="w-1 rounded-full bg-sky-500 left-2 top-2 bottom-2 absolute"></div>
  {/if}
  <div class="flex flex-col gap-1">
    <a href="{commit.html_url}" target="_blank" class="hover:underline">
      {commit.commit.message}
    </a>
    <div class="inline-flex items-center gap-1 text-zinc-500 text-xs">
      <a href="{commit.author.html_url}" target="_blank" class="inline-flex items-center gap-2 group">
        <img class="rounded-full w-[20px] h-[20px]" src="{commit.author.avatar_url}" width="20" alt="Profile picture for {commit.author.login}" />
        <span class="group-hover:underline">
          {commit.author.login}
        </span>
      </a>
      <span>
        committed on {new Date(commit.commit.author.date).toDateString()}
      </span>
    </div>
  </div>
  <div class="flex-grow" />
  <div class="inline-flex items-center gap-3">
    {#if commit.commit.verification.verified}
      <span class="text-green-500 border font-mono border-green-500 rounded-full text-xxs px-2 py-0.5 select-none">Verified</span>
    {/if}
    <a href="{commit.html_url}" target="_blank" class="hover:underline font-mono text-zinc-500 text-xs">{commit.sha.substring(0, 7)}</a>
  </div>
</div>