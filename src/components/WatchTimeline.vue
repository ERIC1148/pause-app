<template>
    <div class="relative pl-6 md:pl-12 pb-10">

        <!-- 空态 -->
        <div v-if="movies.length === 0" class="text-center text-zinc-600 mt-20 font-mono text-sm -ml-6 md:-ml-12">
            还没有观影记录。<br>在 Studio 选择电影并保存台词，这里会生成专属票根。
        </div>

        <template v-else>
            <!-- 时间轴竖线主干 -->
            <div class="absolute left-0 md:left-2 top-2 bottom-0 w-px bg-gradient-to-b from-purple-500/80 via-teal-500/30 to-transparent"></div>

            <div v-for="group in groupedTimeline" :key="group.key" class="relative mb-14">
                <!-- 节点 -->
                <div class="absolute -left-[28px] md:-left-[44px] top-1.5 w-3.5 h-3.5 rounded-full bg-black border-2 border-purple-400 timeline-dot z-10"></div>

                <!-- 月份标题 -->
                <div class="flex items-baseline gap-4 mb-6">
                    <h3 class="font-cinzel text-xl md:text-2xl text-white tracking-[0.15em] uppercase drop-shadow-md">{{ group.monthName }}</h3>
                    <span class="font-cinzel text-sm text-zinc-500 tracking-widest">{{ group.year }}</span>
                    <div class="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent ml-4 hidden sm:block"></div>
                </div>

                <!-- 票根网格 -->
                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
                    <div v-for="movie in group.movies" :key="movie.id"
                         @click="$emit('open-movie', movie)"
                         class="group relative flex flex-col bg-[#111113] rounded-xl border border-zinc-800/60 shadow-xl overflow-hidden cursor-pointer hover:border-amber-700/40 transition-colors duration-500">

                        <!-- 海报票头（自动生成 mesh 渐变）-->
                        <div class="relative w-full h-24 sm:h-28 overflow-hidden shrink-0 bg-zinc-900">
                            <div class="absolute inset-0 transition-transform duration-700 group-hover:scale-110 opacity-90" :class="meshFor(movie)"></div>
                            <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)] pointer-events-none"></div>
                            <!-- 台词数徽标 -->
                            <div class="absolute top-3 left-3 bg-black/50 rounded border border-white/10 px-1.5 py-0.5 flex items-center gap-1 backdrop-blur-sm">
                                <svg class="w-3 h-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h6m-6 8l-4-4h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14z"/>
                                </svg>
                                <span class="text-[10px] font-bold text-white">{{ quoteCount(movie.id) }}</span>
                            </div>
                            <!-- 上映年份印戳（复古胶片标记，无则不显示）-->
                            <div v-if="movie.year"
                                 class="absolute top-3 right-3 flex items-center gap-1 text-white/80 backdrop-blur-sm">
                                <span class="font-cinzel text-sm font-semibold tracking-widest drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">{{ movie.year }}</span>
                                <span class="font-mono text-[7px] tracking-[0.15em] text-white/50 uppercase leading-none">Est.</span>
                            </div>
                        </div>

                        <!-- 撕裂打孔线 -->
                        <div class="relative h-6 w-full flex items-center justify-between px-0 bg-[#111113] z-10 -my-3">
                            <div class="w-4 h-4 rounded-full bg-[#050505] border-r border-zinc-800/60 -ml-2 z-20"></div>
                            <div class="flex-1 h-[1.5px] border-b border-dashed border-zinc-700/60 mx-2"></div>
                            <div class="w-4 h-4 rounded-full bg-[#050505] border-l border-zinc-800/60 -mr-2 z-20"></div>
                        </div>

                        <!-- 票根信息 -->
                        <div class="p-3 sm:p-4 pt-5 flex flex-col flex-1 justify-between">
                            <div class="mb-3">
                                <h3 class="text-white font-cinzel font-bold text-base sm:text-lg leading-tight group-hover:text-amber-400 transition-colors line-clamp-2 subtitle-shadow">{{ movie.title }}</h3>
                            </div>

                            <div class="grid grid-cols-2 gap-y-3 gap-x-2 border-t border-b border-zinc-800/50 py-3 mb-3">
                                <div class="col-span-2 flex flex-col gap-0.5">
                                    <span class="text-[8px] text-zinc-600 uppercase tracking-widest">Cinema / Screen</span>
                                    <span class="text-xs font-cinzel font-semibold tracking-widest truncate drop-shadow-md"
                                          :class="movie.cinema ? 'text-amber-500/90' : 'text-zinc-700 italic'">
                                        {{ movie.cinema || 'Not logged' }}
                                    </span>
                                </div>
                                <div class="flex flex-col gap-0.5">
                                    <span class="text-[8px] text-zinc-600 uppercase tracking-widest">Date</span>
                                    <span class="text-[10px] font-mono" :class="movie.watchedDate ? 'text-zinc-300' : 'text-zinc-700'">
                                        {{ movie.watchedDate ? formatDay(movie.watchedDate) : '— —' }}
                                    </span>
                                </div>
                                <div class="flex flex-col gap-0.5">
                                    <span class="text-[8px] text-zinc-600 uppercase tracking-widest">Seat</span>
                                    <span class="text-[10px] font-mono" :class="movie.seat ? 'text-zinc-300' : 'text-zinc-700'">
                                        {{ movie.seat || '— —' }}
                                    </span>
                                </div>
                            </div>

                            <div class="flex items-center justify-between mt-auto">
                                <div class="h-5 w-20 sm:w-24 opacity-40 mix-blend-screen barcode"></div>
                                <span class="font-mono text-[8px] sm:text-[9px] text-zinc-600 tracking-[0.2em]">ADM.1</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    movies:        { type: Array, default: () => [] },
    scenesForMovie:{ type: Function, default: () => () => [] },
})
defineEmits(['open-movie'])

const MESHES = ['mesh-scifi', 'mesh-drama', 'mesh-romance', 'mesh-noir']
// Deterministic poster gradient from the movie id/title — stable across reloads.
const meshFor = (movie) => {
    const s = String(movie.id || movie.title || '')
    let h = 0
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
    return MESHES[h % MESHES.length]
}

const quoteCount = (movieId) => props.scenesForMovie(movieId).length

const formatDay = (dateString) => {
    const d = new Date(dateString)
    return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

// Group by month/year, newest first. Movies without a date sink to the end.
const groupedTimeline = computed(() => {
    const groups = {}
    const sorted = [...props.movies].sort((a, b) => {
        if (!a.watchedDate && !b.watchedDate) return 0
        if (!a.watchedDate) return 1
        if (!b.watchedDate) return -1
        return new Date(b.watchedDate) - new Date(a.watchedDate)
    })
    sorted.forEach(movie => {
        let key, monthName, year
        if (movie.watchedDate) {
            const d = new Date(movie.watchedDate)
            monthName = d.toLocaleString('en-US', { month: 'long' })
            year = d.getFullYear()
            key = `${monthName}-${year}`
        } else {
            key = 'undated'; monthName = 'Undated'; year = ''
        }
        if (!groups[key]) groups[key] = { key, monthName, year, movies: [] }
        groups[key].movies.push(movie)
    })
    return Object.values(groups)
})
</script>

<style scoped>
.mesh-scifi {
    background:
        radial-gradient(at 20% 20%, hsla(230, 80%, 60%, 0.8) 0px, transparent 50%),
        radial-gradient(at 80% 0%, hsla(189, 100%, 56%, 0.8) 0px, transparent 50%),
        radial-gradient(at 0% 50%, hsla(330, 100%, 70%, 0.8) 0px, transparent 50%),
        radial-gradient(at 80% 100%, hsla(260, 100%, 60%, 0.8) 0px, transparent 50%),
        #0f172a;
}
.mesh-drama {
    background:
        radial-gradient(at 10% 20%, hsla(28, 100%, 60%, 0.8) 0px, transparent 50%),
        radial-gradient(at 90% 10%, hsla(330, 80%, 50%, 0.8) 0px, transparent 50%),
        radial-gradient(at 30% 80%, hsla(220, 80%, 40%, 0.8) 0px, transparent 50%),
        #1c1917;
}
.mesh-romance {
    background:
        radial-gradient(at 0% 0%, hsla(340, 80%, 70%, 0.8) 0px, transparent 50%),
        radial-gradient(at 100% 0%, hsla(10, 80%, 60%, 0.8) 0px, transparent 50%),
        radial-gradient(at 50% 100%, hsla(260, 70%, 60%, 0.8) 0px, transparent 50%),
        #2e1025;
}
.mesh-noir {
    background:
        radial-gradient(at 20% 20%, hsla(0, 0%, 40%, 0.6) 0px, transparent 50%),
        radial-gradient(at 80% 80%, hsla(0, 0%, 20%, 0.8) 0px, transparent 50%),
        #0a0a0a;
}

@keyframes timeline-glow {
    0%   { box-shadow: 0 0 10px rgba(168, 85, 247, 0.3); }
    50%  { box-shadow: 0 0 20px rgba(168, 85, 247, 0.6), 0 0 40px rgba(168, 85, 247, 0.2); }
    100% { box-shadow: 0 0 10px rgba(168, 85, 247, 0.3); }
}
.timeline-dot { animation: timeline-glow 3s infinite ease-in-out; }

.barcode {
    background-image: repeating-linear-gradient(
        to right,
        #71717a, #71717a 2px, transparent 2px, transparent 4px,
        #71717a 4px, #71717a 5px, transparent 5px, transparent 7px,
        #71717a 7px, #71717a 10px, transparent 10px, transparent 12px,
        #71717a 12px, #71717a 13px
    );
}
</style>
