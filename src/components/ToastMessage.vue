<template>
    <transition name="toast">
        <div v-if="message"
             class="absolute top-6 left-1/2 -translate-x-1/2 bg-zinc-800 border border-zinc-700 text-white px-4 py-2 rounded-lg shadow-2xl flex items-center gap-2 z-[90] text-sm font-mono tracking-wider whitespace-nowrap">
            <svg class="w-4 h-4 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            {{ message }}
        </div>
    </transition>
</template>

<script setup>
defineProps({ message: String })
</script>
