<template>
    <div class="absolute inset-0 flex flex-col bg-[#050505]">

        <!-- 胶片颗粒全屏叠层 -->
        <div class="absolute inset-0 opacity-[0.025] pointer-events-none z-0"
             style="background-image: url('data:image/svg+xml;utf8,<svg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.75%22 numOctaves=%224%22 stitchTiles=%22stitch%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/></svg>');"></div>

        <!-- 顶栏 -->
        <header class="relative z-10 flex justify-between items-center px-6 md:px-10 pt-6 pb-4 shrink-0">
            <div>
                <h1 class="font-cinzel text-lg text-white tracking-[0.35em] uppercase">Pause</h1>
            </div>
            <button @click.stop="$emit('open-settings')"
                    class="flex items-center gap-2.5 hover:opacity-80 active:scale-95 transition-all group">
                <span class="text-zinc-500 group-hover:text-zinc-300 text-[11px] font-mono tracking-wider hidden sm:block transition">
                    {{ displayName }}
                </span>
                <img v-if="currentUser.user_metadata?.avatar_url"
                     :src="currentUser.user_metadata.avatar_url"
                     class="w-8 h-8 rounded-full border border-zinc-700 group-hover:border-zinc-400 transition" />
                <div v-else
                     class="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 group-hover:border-zinc-500 flex items-center justify-center text-white text-xs font-bold transition">
                    {{ displayName.charAt(0).toUpperCase() }}
                </div>
            </button>
        </header>

        <!-- 展示主区 -->
        <main class="flex-1 flex flex-col items-center justify-center px-6 relative z-10 overflow-hidden">

            <!-- ── 有卡片：Showcase ── -->
            <template v-if="showcaseCard">
                <transition name="card-swap" mode="out-in">
                    <div :key="showcaseCard.id" class="flex flex-col items-center w-full">

                        <div class="relative group w-full cursor-pointer"
                             @click.stop="$emit('card-tap', showcaseCard)"
                             @touchstart.passive="$emit('card-touch-start', showcaseCard.id)"
                             @touchend.passive="$emit('card-touch-end')">

                            <!-- 发光晕 -->
                            <div class="absolute -inset-8 rounded-full blur-3xl opacity-[0.07] bg-white pointer-events-none"></div>

                            <!-- 缩略图 -->
                            <img :src="showcaseCard.thumbnail"
                                 class="relative z-10 w-full rounded-2xl block shadow-[0_30px_80px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.04)]"
                                 style="max-height: calc(100dvh - 260px);"
                                 alt="Scene" />

                            <!-- 操作 Overlay -->
                            <div class="absolute inset-0 z-20 rounded-2xl bg-black/65 transition-all duration-300 flex flex-col justify-between p-4"
                                 :class="activeCardMenu === showcaseCard.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'">
                                <!-- 右上：下载 + 删除 -->
                                <div class="flex justify-end gap-2">
                                    <button @click.stop="$emit('download-record', showcaseCard)"
                                            class="bg-zinc-700/80 hover:bg-zinc-600 text-white p-2 rounded-full backdrop-blur transition hover:scale-110 active:scale-95">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                                        </svg>
                                    </button>
                                    <button @click.stop="$emit('delete-record', showcaseCard.id)"
                                            class="bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-full backdrop-blur transition hover:scale-110 active:scale-95">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                        </svg>
                                    </button>
                                </div>
                                <!-- 左下：编辑按钮 -->
                                <div>
                                    <button @click.stop="$emit('go-to-studio', showcaseCard)"
                                            class="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur text-white text-xs font-mono tracking-widest uppercase rounded-lg transition active:scale-95">
                                        Edit Scene →
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- 卡片元数据 -->
                        <div class="mt-5 text-center">
                            <p class="font-cinzel text-white/70 text-sm tracking-[0.2em] uppercase">
                                {{ showcaseCard.metadata.movie || 'Untitled Scene' }}
                            </p>
                            <p class="font-mono text-zinc-600 text-[11px] mt-1.5 tracking-wider">
                                {{ formatDate(showcaseCard.createdAt) }}
                                <span v-if="recordCount > 1" class="ml-3 text-zinc-700">{{ recordCount }} scenes</span>
                            </p>
                        </div>

                    </div>
                </transition>

                <!-- 换一张（在 transition 外，保持位置不跳动）-->
                <button v-if="recordCount > 1"
                        @click.stop="onShuffle"
                        class="mt-4 group flex items-center gap-1.5 text-zinc-700 hover:text-zinc-400 transition-colors duration-300"
                        style="animation: fade-up 0.7s 0.25s both;"
                        title="换一张">
                    <svg :class="['w-3.5 h-3.5 transition-transform duration-500', isSpinning ? 'spin-once' : 'group-hover:rotate-180']"
                         fill="none" stroke="currentColor" viewBox="0 0 24 24"
                         @animationend="isSpinning = false">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                    <span class="font-mono text-[10px] tracking-[0.25em] uppercase">shuffle</span>
                </button>
            </template>

            <!-- ── 无卡片：Ghost Cinema Card ── -->
            <template v-else>
                <div class="ghost-float max-w-[400px] w-full">

                    <div class="relative">
                        <div class="absolute -inset-6 rounded-full blur-3xl opacity-[0.05] bg-white pointer-events-none"></div>

                        <!-- Ghost Cinema Card -->
                        <div class="relative cinema-card rounded-2xl overflow-hidden opacity-60 shadow-[0_30px_80px_rgba(0,0,0,0.8)]">
                            <div class="absolute inset-0" style="background: linear-gradient(to bottom, #2a2a2a, #111)"></div>
                            <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.85)_100%)] pointer-events-none z-10"></div>
                            <div class="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none z-10"
                                 style="background-image: url('data:image/svg+xml;utf8,<svg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22><filter id=%22noise%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/></svg>');"></div>

                            <div class="w-full h-8 bg-black z-20 shrink-0"></div>
                            <div class="relative z-30 flex-1 flex flex-col py-10 px-8 min-h-[160px] sm:min-h-[200px]">
                                <div class="absolute top-0 left-8 text-white/30 font-cinzel text-[9px] tracking-[0.3em] uppercase">
                                    PAUSE
                                </div>
                                <div class="flex-1 flex items-center justify-center">
                                    <p class="font-serif-sc font-medium text-[#f0f0f0]/80 text-lg sm:text-xl leading-relaxed text-center subtitle-shadow">
                                        {{ emptyQuote }}
                                    </p>
                                </div>
                            </div>
                            <div class="w-full h-8 bg-black z-20 shrink-0"></div>
                        </div>
                    </div>

                    <p class="text-center font-mono text-zinc-700 text-[11px] mt-6 tracking-[0.3em] uppercase">
                        Your first scene awaits
                    </p>
                </div>
            </template>
        </main>

        <!-- 底栏 -->
        <footer class="relative z-10 flex justify-between items-center px-6 md:px-10 pb-6 pt-4 shrink-0">

            <!-- Gallery 入口 -->
            <button @click.stop="$emit('toggle-vault')"
                    class="flex items-center gap-2.5 px-4 py-2.5 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white rounded-xl text-xs font-mono tracking-widest uppercase active:scale-95 transition-all relative">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                </svg>
                Gallery
                <span v-if="recordCount > 0"
                      class="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center rounded-full bg-red-500 text-[9px] text-white font-bold">
                    {{ recordCount > 99 ? '99+' : recordCount }}
                </span>
            </button>

            <!-- 中心装饰 -->
            <span class="font-mono text-zinc-800 text-[9px] tracking-[0.5em] uppercase select-none hidden sm:block">· · ·</span>

            <!-- 新建场景 -->
            <button @click.stop="$emit('go-to-studio', null)"
                    class="flex items-center gap-2.5 px-4 py-2.5 bg-white text-zinc-900 hover:bg-zinc-100 rounded-xl text-xs font-bold tracking-widest uppercase active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.08)]">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
                </svg>
                New Scene
            </button>
        </footer>
    </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
    currentUser:    Object,
    displayName:    String,
    showcaseCard:   { type: Object, default: null },
    emptyQuote:     String,
    recordCount:    Number,
    activeCardMenu: { type: [String, null], default: null },
    formatDate:     Function,
})
const emit = defineEmits([
    'open-settings', 'go-to-studio', 'toggle-vault',
    'card-tap', 'card-touch-start', 'card-touch-end',
    'download-record', 'delete-record', 'shuffle-card',
])

const isSpinning = ref(false)
const onShuffle = () => {
    isSpinning.value = true
    emit('shuffle-card')
}
</script>

<style scoped>
@keyframes spin-once {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
}
.spin-once {
    animation: spin-once 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

/* Shuffle card swap transition */
.card-swap-enter-active {
    transition: opacity 0.35s ease, transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.card-swap-leave-active {
    transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.card-swap-enter-from {
    opacity: 0;
    transform: translateY(14px) scale(0.97);
}
.card-swap-leave-to {
    opacity: 0;
    transform: translateY(-10px) scale(0.97);
}
</style>
