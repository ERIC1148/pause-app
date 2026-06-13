<template>
    <transition name="fade-slide">
        <div v-if="movie" class="absolute inset-0 z-[60] bg-[#050505]/95 backdrop-blur-md flex flex-col">

            <!-- 顶栏 -->
            <div class="p-4 md:p-8 flex justify-between items-center sticky top-0 bg-[#050505]/80 backdrop-blur z-20 border-b border-zinc-800/50">
                <button @click="$emit('close')"
                        class="flex items-center gap-2 text-zinc-400 hover:text-white text-sm tracking-widest uppercase transition active:scale-95">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                    </svg>
                    返回
                </button>
                <button @click="$emit('delete', movie.id)"
                        class="text-red-400/70 hover:text-red-400 text-xs tracking-widest uppercase transition">删除记录</button>
            </div>

            <div class="flex-1 overflow-y-auto p-4 md:p-8 max-w-3xl w-full mx-auto">

                <!-- 票根信息编辑 -->
                <div class="mb-10">
                    <h2 class="font-cinzel text-2xl md:text-3xl text-white tracking-widest mb-1">观影记录</h2>
                    <p class="text-zinc-600 text-xs font-mono tracking-wider mb-6">Edit the ticket — applies to every quote from this film</p>

                    <div class="space-y-3">
                        <div class="console-input rounded-xl p-3">
                            <label class="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Movie / 电影</label>
                            <input v-model="form.title" type="text" placeholder="电影名"
                                   class="w-full bg-transparent outline-none text-white font-medium text-base placeholder-zinc-700">
                        </div>
                        <div class="flex gap-3">
                            <div class="console-input rounded-xl p-3 w-24">
                                <label class="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Year</label>
                                <input v-model="form.year" type="text" maxlength="4" placeholder="2014"
                                       class="w-full bg-transparent outline-none text-white text-sm font-mono placeholder-zinc-700">
                            </div>
                            <div class="console-input rounded-xl p-3 flex-1">
                                <label class="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Cinema / 影院</label>
                                <input v-model="form.cinema" type="text" placeholder="e.g. IMAX 一号厅"
                                       class="w-full bg-transparent outline-none text-white text-sm placeholder-zinc-700">
                            </div>
                        </div>
                        <div class="flex gap-3">
                            <div class="console-input rounded-xl p-3 flex-1">
                                <label class="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Date / 观影日期</label>
                                <input v-model="form.watchedDate" type="date"
                                       class="w-full bg-transparent outline-none text-zinc-300 text-sm font-mono [color-scheme:dark]">
                            </div>
                            <div class="console-input rounded-xl p-3 flex-1">
                                <label class="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Seat / 座位号</label>
                                <input v-model="form.seat" type="text" placeholder="e.g. F12"
                                       class="w-full bg-transparent outline-none text-white text-sm font-mono placeholder-zinc-700">
                            </div>
                        </div>

                        <button @click="save" :disabled="!dirty"
                                class="w-full py-3 rounded-xl font-bold text-sm tracking-widest uppercase transition-all active:scale-[0.98]"
                                :class="dirty ? 'bg-white text-zinc-900 hover:bg-zinc-100' : 'bg-zinc-900 text-zinc-700 cursor-not-allowed'">
                            {{ dirty ? '保存修改' : '已是最新' }}
                        </button>
                    </div>
                </div>

                <!-- 该电影的台词 -->
                <div>
                    <div class="flex items-baseline gap-3 mb-5">
                        <h3 class="font-cinzel text-lg text-white tracking-widest uppercase">Quotes</h3>
                        <span class="text-zinc-600 text-xs font-mono">{{ scenes.length }} 条</span>
                    </div>

                    <div v-if="scenes.length === 0" class="text-zinc-600 text-sm font-mono">
                        这部电影还没有台词。
                    </div>
                    <div v-else class="columns-1 sm:columns-2 gap-4 space-y-4">
                        <div v-for="rec in scenes" :key="rec.id"
                             @click="$emit('open-quote', rec)"
                             class="break-inside-avoid relative group rounded-lg overflow-hidden shadow-xl border border-zinc-800/50 bg-black cursor-pointer hover:scale-[1.02] transition-all duration-300">
                            <img v-if="rec.thumbnail" :src="rec.thumbnail" class="w-full h-auto block" alt="Scene" />
                            <div v-else class="w-full py-10 px-4 text-center" :style="{ background: rec.colorGrade.css }">
                                <span class="font-serif-sc text-white/90 text-sm leading-relaxed line-clamp-4 subtitle-shadow">{{ rec.dialogue }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
    movie:  { type: Object, default: null },
    scenes: { type: Array, default: () => [] },
})
const emit = defineEmits(['close', 'save', 'delete', 'open-quote'])

const form = ref({ title: '', year: '', cinema: '', watchedDate: '', seat: '' })

watch(() => props.movie, (m) => {
    if (!m) return
    form.value = {
        title:       m.title || '',
        year:        m.year || '',
        cinema:      m.cinema || '',
        watchedDate: m.watchedDate || '',
        seat:        m.seat || '',
    }
}, { immediate: true })

const dirty = computed(() => {
    if (!props.movie) return false
    const m = props.movie
    return form.value.title !== (m.title || '')
        || form.value.year !== (m.year || '')
        || form.value.cinema !== (m.cinema || '')
        || form.value.watchedDate !== (m.watchedDate || '')
        || form.value.seat !== (m.seat || '')
})

const save = () => {
    if (!dirty.value) return
    emit('save', { id: props.movie.id, patch: { ...form.value } })
}
</script>
