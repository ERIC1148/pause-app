<template>
    <div class="absolute inset-0 flex flex-col overflow-y-auto">
        <div class="max-w-7xl mx-auto p-3 md:p-8 min-h-full flex flex-col w-full">

            <!-- 头部：顶栏 -->
            <header class="mb-4 md:mb-6 flex justify-between items-end border-b border-white/10 pb-3 md:pb-4 shrink-0">
                <div class="flex items-center gap-3 md:gap-4">
                    <!-- 返回 Home -->
                    <button @click="$emit('go-home')"
                            class="w-8 h-8 md:w-10 md:h-10 bg-zinc-800 rounded flex items-center justify-center border border-zinc-700 shrink-0 hover:bg-zinc-700 active:scale-95 transition-all group"
                            title="返回首页">
                        <svg class="w-4 h-4 md:w-5 md:h-5 text-zinc-400 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                        </svg>
                    </button>
                    <div>
                        <h1 class="text-lg md:text-xl font-bold tracking-widest text-white uppercase font-cinzel">Studio</h1>
                        <p class="text-zinc-500 text-[10px] md:text-xs mt-1 tracking-wider uppercase flex gap-2 items-center">
                            <span class="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-red-500"></span>
                            Dynamic Canvas
                        </p>
                    </div>
                </div>

                <!-- 右侧：时间码 + 用户信息 -->
                <div class="flex items-center gap-4">
                    <div class="text-right hidden sm:block">
                        <div class="text-zinc-500 font-mono text-xs md:text-sm">{{ currentTime }}</div>
                        <div class="text-zinc-600 text-[10px] md:text-xs tracking-widest">REC OUT - PRORES 4444</div>
                    </div>
                    <button @click="$emit('open-settings')"
                            class="flex items-center gap-2 hover:opacity-80 active:scale-95 transition group">
                        <img v-if="currentUser?.user_metadata?.avatar_url"
                             :src="currentUser.user_metadata.avatar_url"
                             class="w-7 h-7 rounded-full border border-zinc-700 group-hover:border-zinc-400 shrink-0 transition" />
                        <div v-else
                             class="w-7 h-7 rounded-full bg-zinc-700 border border-zinc-600 group-hover:border-zinc-400 flex items-center justify-center text-white text-xs font-bold shrink-0 transition">
                            {{ displayName.charAt(0).toUpperCase() }}
                        </div>
                        <span class="text-zinc-400 group-hover:text-white text-[10px] font-mono tracking-wider hidden sm:block max-w-[80px] truncate transition">
                            {{ displayName }}
                        </span>
                    </button>
                </div>
            </header>

            <!-- 核心交互区 -->
            <main class="flex-1 flex flex-col md:flex-row-reverse gap-4 md:gap-8 pb-4">

                <!-- 右侧（移动端顶部）：监视器预览 -->
                <div class="w-full md:w-3/5 lg:w-2/3 flex flex-col items-center bg-[#0a0a0c] rounded-2xl p-2 sm:p-4 md:p-8 border border-zinc-800/50 shadow-2xl relative overflow-y-auto md:overflow-visible sticky top-0 md:static z-40 md:z-auto max-h-[60vh] md:max-h-none">

                    <div class="absolute top-2 left-4 md:top-4 md:left-6 text-[8px] md:text-[10px] font-mono text-zinc-600 tracking-widest uppercase flex items-center gap-1.5 md:gap-2 z-50">
                        <div class="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full"
                             :class="dialogue.trim() ? 'bg-green-500' : 'bg-zinc-700'"></div>
                        Auto-Height Monitor
                    </div>

                    <!-- html2canvas 截取目标 -->
                    <div ref="cardRef"
                         class="cinema-card cinema-preview-float w-full max-w-4xl mt-6 md:mt-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">

                        <div class="absolute inset-0 transition-all duration-700 ease-in-out"
                             :style="{ background: currentGrade.css }"></div>
                        <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.8)_100%)] pointer-events-none z-10"></div>
                        <div class="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none z-10"
                             style="background-image: url('data:image/svg+xml;utf8,<svg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22><filter id=%22noise%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/></svg>');"></div>

                        <div class="w-full h-8 sm:h-12 bg-black z-20 shrink-0"></div>

                        <div class="relative z-30 flex-1 flex flex-col w-full py-12 sm:py-20 px-6 sm:px-16 min-h-[200px] sm:min-h-[300px]">

                            <div v-show="metadata.movie || metadata.character"
                                 class="absolute top-0 left-6 sm:left-12 text-white/50 font-mono text-[8px] md:text-[10px] tracking-[0.2em] uppercase max-w-[40%] text-left">
                                <div class="font-cinzel text-white/80 text-[10px] md:text-xs mb-1">
                                    {{ metadata.movie || 'UNTITLED' }} {{ metadata.year ? `(${metadata.year})` : '' }}
                                </div>
                                <div v-show="metadata.character">SCENE / {{ metadata.character }}</div>
                            </div>

                            <div class="absolute top-0 right-6 sm:right-12 text-white/30 font-mono text-[8px] md:text-[10px] tracking-[0.2em] text-right">
                                <div>TAKE {{ String(takeCount).padStart(3, '0') }}</div>
                                <div>{{ currentRecordId ? 'REPLAY' : currentTime }}</div>
                                <div class="text-white/20 mt-0.5">{{ currentDate }}</div>
                            </div>

                            <div class="flex-1 flex flex-col justify-center w-full mt-6">
                                <div class="w-full transition-all duration-500 subtitle-shadow"
                                     :class="isDialogueMode ? 'text-left max-w-3xl mx-auto' : 'text-center'">
                                    <template v-if="isDialogueMode">
                                        <div v-for="(line, i) in parsedDialogue" :key="i"
                                             class="mb-3 sm:mb-5 font-serif-sc font-medium leading-relaxed"
                                             :class="[line.length > 40 ? 'text-sm sm:text-lg' : 'text-base sm:text-2xl',
                                                      i % 2 === 0 ? 'text-[#f0f0f0]' : 'text-[#c0c0c0]']">
                                            - {{ line }}
                                        </div>
                                    </template>
                                    <template v-else>
                                        <div class="font-serif-sc font-medium text-[#f0f0f0] tracking-wide"
                                             :class="dialogue.length > 60
                                                 ? 'text-sm sm:text-xl md:text-2xl leading-[1.8]'
                                                 : 'text-lg sm:text-3xl md:text-4xl leading-relaxed'">
                                            {{ dialogue || 'The silence is deafening.' }}
                                        </div>
                                    </template>
                                </div>
                            </div>
                        </div>

                        <div class="w-full h-8 sm:h-12 bg-black z-20 shrink-0 mt-auto"></div>
                    </div>
                </div>

                <!-- 左侧（移动端底部）：录入控制台 -->
                <div class="w-full md:w-2/5 lg:w-1/3 flex flex-col gap-4 shrink-0 pr-0 md:pr-4 pb-8 md:pb-0 md:overflow-y-auto">

                    <!-- 编辑模式提示条 -->
                    <div v-if="currentRecordId"
                         class="flex items-center justify-between bg-purple-900/30 border border-purple-500/30 rounded-xl p-3">
                        <span class="text-xs text-purple-300 font-mono tracking-widest">EDITING RECORD</span>
                        <button @click="$emit('reset-form')"
                                class="text-xs bg-purple-500/20 hover:bg-purple-500/40 text-purple-200 px-3 py-1 rounded transition active:scale-95">
                            New Scene
                        </button>
                    </div>

                    <!-- 电影选择器：先选电影，再写台词 -->
                    <div class="console-input rounded-xl p-3 relative z-30">
                        <label class="block text-[10px] md:text-xs uppercase tracking-widest text-zinc-500 mb-2 flex justify-between items-center">
                            <span>Movie / 电影</span>
                            <span v-if="selectedMovieId" class="text-amber-500/70 normal-case tracking-normal text-[10px]">● 已关联观影记录</span>
                        </label>
                        <input :value="metadata.movie"
                               @input="onMovieInput($event.target.value)"
                               @focus="showMovieDropdown = true"
                               @blur="onMovieBlur"
                               type="text" placeholder="搜索或新建电影..." autocomplete="off"
                               class="w-full bg-transparent border-none outline-none text-white font-medium text-base placeholder-zinc-700">

                        <!-- 下拉：匹配已有电影 + 新建 -->
                        <div v-if="showMovieDropdown && (filteredMovies.length || metadata.movie.trim())"
                             class="absolute left-0 right-0 top-full mt-1.5 mx-0 bg-zinc-900/95 backdrop-blur border border-zinc-700/80 rounded-xl shadow-2xl max-h-56 overflow-y-auto z-50 py-1">
                            <button v-for="m in filteredMovies" :key="m.id"
                                    @mousedown.prevent="pickMovie(m)"
                                    class="w-full text-left px-4 py-2.5 hover:bg-zinc-800/80 flex items-center justify-between transition">
                                <span class="text-zinc-200 text-sm truncate">{{ m.title }}</span>
                                <span class="text-zinc-600 text-[10px] font-mono ml-2 shrink-0 tracking-wider">
                                    {{ m.year || '' }}<span v-if="m.cinema" class="text-amber-600/60"> · {{ m.cinema }}</span>
                                </span>
                            </button>
                            <button v-if="metadata.movie.trim() && !exactMatch"
                                    @mousedown.prevent="pickNew"
                                    class="w-full text-left px-4 py-2.5 hover:bg-zinc-800/80 text-amber-400/90 text-sm flex items-center gap-2 transition"
                                    :class="filteredMovies.length ? 'border-t border-zinc-800/60' : ''">
                                <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                                </svg>
                                新建《{{ metadata.movie.trim() }}》
                            </button>
                        </div>
                    </div>

                    <!-- 观影信息（票根）：新建电影时录入，已有电影继承 -->
                    <transition name="fade-slide">
                        <div v-if="metadata.movie.trim()" class="console-input rounded-xl p-3 space-y-3">
                            <div class="flex items-center justify-between">
                                <label class="block text-[10px] md:text-xs uppercase tracking-widest text-zinc-500">
                                    Ticket / 观影信息
                                    <span class="ml-1.5 text-zinc-700 normal-case tracking-normal">{{ selectedMovieId ? '继承自该电影' : '选填' }}</span>
                                </label>
                                <button v-if="selectedMovieId && !editingWatchInfo" @click="editingWatchInfo = true"
                                        class="text-[10px] text-zinc-500 hover:text-amber-400 tracking-wider uppercase transition">编辑</button>
                            </div>

                            <!-- 只读继承展示 -->
                            <div v-if="selectedMovieId && !editingWatchInfo" class="grid grid-cols-3 gap-2">
                                <div class="flex flex-col gap-0.5">
                                    <span class="text-[8px] text-zinc-600 uppercase tracking-widest">Cinema</span>
                                    <span class="text-xs text-amber-500/80 truncate">{{ movieDraft.cinema || '—' }}</span>
                                </div>
                                <div class="flex flex-col gap-0.5">
                                    <span class="text-[8px] text-zinc-600 uppercase tracking-widest">Date</span>
                                    <span class="text-xs text-zinc-300 font-mono">{{ movieDraft.watchedDate || '—' }}</span>
                                </div>
                                <div class="flex flex-col gap-0.5">
                                    <span class="text-[8px] text-zinc-600 uppercase tracking-widest">Seat</span>
                                    <span class="text-xs text-zinc-300 font-mono">{{ movieDraft.seat || '—' }}</span>
                                </div>
                            </div>

                            <!-- 可编辑：新建 或 点击编辑 -->
                            <template v-else>
                                <div class="flex gap-3">
                                    <div class="flex-1">
                                        <span class="block text-[8px] text-zinc-600 uppercase tracking-widest mb-1">Year / 年份</span>
                                        <input :value="metadata.year" @input="$emit('update:metadata', { ...metadata, year: $event.target.value })"
                                               type="text" placeholder="2014" maxlength="4"
                                               class="w-full bg-transparent border-none outline-none text-white text-sm font-mono placeholder-zinc-700">
                                    </div>
                                    <div class="flex-[2]">
                                        <span class="block text-[8px] text-zinc-600 uppercase tracking-widest mb-1">Cinema / 影院</span>
                                        <input :value="movieDraft.cinema" @input="$emit('update:movieDraft', { ...movieDraft, cinema: $event.target.value })"
                                               type="text" placeholder="e.g. IMAX 一号厅"
                                               class="w-full bg-transparent border-none outline-none text-white text-sm placeholder-zinc-700">
                                    </div>
                                </div>
                                <div class="flex gap-3">
                                    <div class="flex-1">
                                        <span class="block text-[8px] text-zinc-600 uppercase tracking-widest mb-1">Date / 观影日期</span>
                                        <input :value="movieDraft.watchedDate" @input="$emit('update:movieDraft', { ...movieDraft, watchedDate: $event.target.value })"
                                               type="date"
                                               class="w-full bg-transparent border-none outline-none text-zinc-300 text-sm font-mono placeholder-zinc-700 [color-scheme:dark]">
                                    </div>
                                    <div class="flex-1">
                                        <span class="block text-[8px] text-zinc-600 uppercase tracking-widest mb-1">Seat / 座位号</span>
                                        <input :value="movieDraft.seat" @input="$emit('update:movieDraft', { ...movieDraft, seat: $event.target.value })"
                                               type="text" placeholder="e.g. F12"
                                               class="w-full bg-transparent border-none outline-none text-white text-sm font-mono placeholder-zinc-700">
                                    </div>
                                </div>
                            </template>
                        </div>
                    </transition>

                    <!-- 角色（说话人，逐条台词不同）-->
                    <div class="console-input rounded-xl p-3">
                        <label class="block text-[10px] md:text-xs uppercase tracking-widest text-zinc-500 mb-2">Character / 角色（说话人）</label>
                        <input :value="metadata.character" @input="$emit('update:metadata', { ...metadata, character: $event.target.value })"
                               type="text" placeholder="e.g. Cooper"
                               class="w-full bg-transparent border-none outline-none text-white text-sm placeholder-zinc-700">
                    </div>

                    <!-- 台词 -->
                    <div class="console-input rounded-xl p-3 flex-1 min-h-[150px] flex flex-col">
                        <label class="block text-[10px] md:text-xs uppercase tracking-widest text-zinc-500 mb-2 flex justify-between">
                            <span>Dialogue / 台词</span>
                            <span class="text-zinc-700 font-mono">{{ dialogue.length }}</span>
                        </label>
                        <textarea :value="dialogue" @input="$emit('update:dialogue', $event.target.value)"
                                  class="flex-1 w-full resize-none outline-none bg-transparent text-zinc-300 text-sm md:text-base leading-relaxed placeholder-zinc-700"
                                  placeholder="长篇大论也会自动撑开画布高度。&#10;换行识别为多人对话。"></textarea>
                    </div>

                    <!-- 色彩预设（10 种）-->
                    <div class="console-input rounded-xl p-3">
                        <label class="block text-[10px] md:text-xs uppercase tracking-widest text-zinc-500 mb-3">
                            Color Grade / 色调
                            <span class="ml-2 text-zinc-700 normal-case tracking-normal">{{ currentGrade.name }}</span>
                        </label>
                        <div class="flex items-center gap-2.5 overflow-x-auto pb-1">
                            <button v-for="grade in colorGrades" :key="grade.name"
                                    @click="$emit('update:currentGrade', grade)"
                                    class="shrink-0 rounded-full border-2 transition-all duration-200"
                                    :class="currentGrade.name === grade.name
                                        ? 'w-9 h-9 border-white shadow-[0_0_14px_rgba(255,255,255,0.45)]'
                                        : 'w-7 h-7 border-transparent opacity-50 active:opacity-100'"
                                    :style="{ background: grade.preview }"
                                    :title="grade.name">
                            </button>
                        </div>
                    </div>

                    <!-- 保存 & 渲染 -->
                    <button @click="handleExportAndSave"
                            :disabled="isGenerating || !dialogue.trim()"
                            class="mt-2 w-full py-4 rounded-xl font-bold uppercase tracking-widest text-white text-sm transition-all duration-300 flex items-center justify-center gap-3 active:scale-[0.98]"
                            :class="[dialogue.trim()
                                        ? 'bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 shadow-[0_0_20px_rgba(255,255,255,0.03)] hover:shadow-[0_0_30px_rgba(255,255,255,0.06)]'
                                        : 'bg-zinc-900 text-zinc-700 cursor-not-allowed border border-transparent',
                                     isGenerating ? 'recording-active' : '']">
                        <div class="w-2.5 h-2.5 rounded-full rec-dot"
                             :class="dialogue.trim() ? 'bg-red-500' : 'bg-zinc-700'"></div>
                        {{ isGenerating ? 'Rendering...' : (currentRecordId ? 'Update & Render' : 'Save & Render') }}
                    </button>
                </div>
            </main>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'

const props = defineProps({
    currentUser:    Object,
    displayName:    String,
    metadata:       Object,
    dialogue:       String,
    currentGrade:   Object,
    colorGrades:    Array,
    isGenerating:   Boolean,
    currentTime:    String,
    takeCount:      Number,
    currentRecordId:{ type: [String, null], default: null },
    isDialogueMode: Boolean,
    parsedDialogue: Array,
    formatTime:     Function,
    // movie selection
    movies:         { type: Array, default: () => [] },
    selectedMovieId:{ type: [String, null], default: null },
    movieDraft:     { type: Object, default: () => ({ cinema: '', watchedDate: '', seat: '' }) },
})
const emit = defineEmits([
    'go-home', 'open-settings', 'reset-form', 'export-and-save',
    'update:metadata', 'update:dialogue', 'update:currentGrade', 'update:movieDraft',
    'select-movie', 'use-new-movie', 'deselect-movie',
])

const cardRef = ref(null)

// ── Movie autocomplete picker ──────────────────────────────
const showMovieDropdown = ref(false)
const editingWatchInfo  = ref(false)

const filteredMovies = computed(() => {
    const q = props.metadata.movie.trim().toLowerCase()
    if (!q) return props.movies.slice(0, 8)
    return props.movies.filter(m => m.title.toLowerCase().includes(q)).slice(0, 8)
})
const exactMatch = computed(() => {
    const q = props.metadata.movie.trim().toLowerCase()
    return props.movies.some(m => m.title.trim().toLowerCase() === q)
})
const selectedMovie = computed(() =>
    props.selectedMovieId ? props.movies.find(m => m.id === props.selectedMovieId) : null
)

const onMovieInput = (val) => {
    emit('update:metadata', { ...props.metadata, movie: val })
    // Typing away from the selected movie's title turns it into a new movie.
    if (selectedMovie.value && val.trim().toLowerCase() !== selectedMovie.value.title.trim().toLowerCase()) {
        emit('deselect-movie')
    }
    showMovieDropdown.value = true
}
const onMovieBlur = () => { setTimeout(() => { showMovieDropdown.value = false }, 120) }
const pickMovie = (m) => {
    emit('select-movie', m)
    editingWatchInfo.value = false
    showMovieDropdown.value = false
}
const pickNew = () => {
    emit('use-new-movie', props.metadata.movie.trim())
    editingWatchInfo.value = false
    showMovieDropdown.value = false
}
// Reset the inline-edit toggle whenever the selected movie changes.
watch(() => props.selectedMovieId, () => { editingWatchInfo.value = false })

const currentDate = ref('')
const updateDate = () => {
    const d = new Date()
    currentDate.value = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}
updateDate()
const dateTimer = setInterval(updateDate, 60000)
onUnmounted(() => clearInterval(dateTimer))

const handleExportAndSave = () => {
    emit('export-and-save', cardRef.value)
}
</script>
