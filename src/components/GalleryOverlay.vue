<template>
    <transition name="fade-slide">
        <div v-if="showVault"
             class="absolute inset-0 w-full h-full bg-[#050505]/95 backdrop-blur-md z-50 flex flex-col">

            <!-- 画廊顶栏 -->
            <div class="p-4 md:p-8 pb-0 md:pb-0 sticky top-0 bg-[#050505]/80 backdrop-blur z-20 border-b border-zinc-800/50">
                <div class="flex justify-between items-start">
                    <div>
                        <h2 class="text-white font-cinzel text-2xl md:text-3xl tracking-widest uppercase">The Gallery</h2>
                        <p class="text-zinc-500 text-xs mt-1 font-mono tracking-wider">
                            {{ galleryTab === 'quotes' ? `${recordCount} SAVED SCENES` : `${movieCount} MOVIES WATCHED` }}
                        </p>
                    </div>
                    <button @click="$emit('toggle-vault')"
                            class="px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-sm tracking-widest uppercase active:scale-95 transition-all flex items-center gap-2">
                        <span>Close</span>
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                <!-- Tab 导航 -->
                <div class="flex gap-8 mt-5">
                    <button @click="$emit('update:galleryTab', 'quotes')"
                            class="relative pb-3 text-sm tracking-widest uppercase transition-colors"
                            :class="galleryTab === 'quotes' ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'">
                        Quotes
                        <span v-if="galleryTab === 'quotes'" class="absolute left-0 right-0 -bottom-px h-px bg-gradient-to-r from-amber-400/0 via-amber-400/80 to-amber-400/0"></span>
                    </button>
                    <button @click="$emit('update:galleryTab', 'movies')"
                            class="relative pb-3 text-sm tracking-widest uppercase transition-colors"
                            :class="galleryTab === 'movies' ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'">
                        Watch Records
                        <span v-if="galleryTab === 'movies'" class="absolute left-0 right-0 -bottom-px h-px bg-gradient-to-r from-amber-400/0 via-amber-400/80 to-amber-400/0"></span>
                    </button>
                </div>
            </div>

            <!-- 内容区 -->
            <div class="flex-1 overflow-y-auto p-4 md:p-8">

                <!-- ── Quotes 瀑布流 ── -->
                <template v-if="galleryTab === 'quotes'">
                    <div v-if="records.length === 0"
                         class="text-center text-zinc-600 mt-20 font-mono text-sm">
                        Gallery is empty.<br>Go back to Studio and save some scenes.
                    </div>
                    <div class="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 md:gap-6 space-y-4 md:space-y-6">
                        <div v-for="record in records" :key="record.id"
                             class="break-inside-avoid relative group rounded-lg overflow-hidden shadow-2xl border border-zinc-800/50 bg-black cursor-pointer transform hover:scale-[1.02] transition-all duration-300"
                             @click="$emit('card-tap', record)"
                             @touchstart.passive="$emit('card-touch-start', record.id)"
                             @touchend.passive="$emit('card-touch-end')">

                            <img v-if="record.thumbnail" :src="record.thumbnail"
                                 class="w-full h-auto block" alt="Scene render" />
                            <div v-else class="w-full py-12 px-4 flex flex-col items-center justify-center text-center"
                                 :style="{ background: record.colorGrade.css }">
                                <span class="font-serif-sc text-white/90 text-sm leading-relaxed line-clamp-4 subtitle-shadow">
                                    {{ record.dialogue }}
                                </span>
                            </div>

                            <!-- 悬浮遮罩：元数据 + 删除 + 下载 -->
                            <div class="absolute inset-0 bg-black/60 transition-opacity duration-300 flex flex-col justify-between p-4"
                                 :class="activeCardMenu === record.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'">
                                <div class="flex justify-end gap-2">
                                    <button @click.stop="$emit('download-record', record)"
                                            class="bg-zinc-700/80 hover:bg-zinc-600 text-white p-2 rounded-full backdrop-blur transition hover:scale-110 active:scale-95">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                                        </svg>
                                    </button>
                                    <button @click.stop="$emit('delete-record', record.id)"
                                            class="bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-full backdrop-blur transition hover:scale-110 active:scale-95">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                        </svg>
                                    </button>
                                </div>
                                <div>
                                    <h3 class="text-white font-cinzel text-sm truncate drop-shadow-md">
                                        {{ record.metadata.movie || 'Untitled' }}
                                    </h3>
                                    <p class="text-zinc-300 text-xs font-mono mt-1">{{ formatDate(record.createdAt) }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>

                <!-- ── Watch Records 时间轴 ── -->
                <WatchTimeline v-else
                               :movies="movies"
                               :scenesForMovie="scenesForMovie"
                               @open-movie="activeMovie = $event" />
            </div>

            <!-- 电影详情 -->
            <MovieDetailOverlay
                :movie="activeMovie"
                :scenes="activeMovie ? scenesForMovie(activeMovie.id) : []"
                @close="activeMovie = null"
                @save="$emit('update-movie', $event)"
                @delete="onDeleteMovie"
                @open-quote="$emit('card-tap', $event)" />
        </div>
    </transition>
</template>

<script setup>
import { ref, watch } from 'vue'
import WatchTimeline from './WatchTimeline.vue'
import MovieDetailOverlay from './MovieDetailOverlay.vue'

const props = defineProps({
    showVault:      Boolean,
    galleryTab:     { type: String, default: 'quotes' },
    records:        Array,
    movies:         { type: Array, default: () => [] },
    movieCount:     { type: Number, default: 0 },
    scenesForMovie: { type: Function, default: () => () => [] },
    activeCardMenu: { type: [String, null], default: null },
    recordCount:    Number,
    formatDate:     Function,
})
const emit = defineEmits([
    'toggle-vault', 'update:galleryTab',
    'card-tap', 'card-touch-start', 'card-touch-end', 'download-record', 'delete-record',
    'update-movie', 'delete-movie',
])

const activeMovie = ref(null)

const onDeleteMovie = (id) => {
    emit('delete-movie', id)
    activeMovie.value = null
}

// Reset the detail overlay whenever the gallery closes.
watch(() => props.showVault, (open) => { if (!open) activeMovie.value = null })
</script>
