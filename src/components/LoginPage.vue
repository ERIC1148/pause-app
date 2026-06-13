<template>
    <!-- Password reset (email link callback) -->
    <div v-if="showPasswordReset"
         class="absolute inset-0 z-[100] flex items-center justify-center bg-[#050505]">
        <div class="w-full max-w-sm px-8" style="animation: fade-up 0.5s both;">
            <div class="text-center mb-8">
                <h1 class="font-cinzel text-3xl text-white tracking-widest uppercase">重置密码</h1>
                <p class="text-zinc-600 text-xs font-mono mt-2">设置你的新密码</p>
            </div>
            <div class="space-y-3 mb-3">
                <div class="console-input rounded-xl px-4 py-3">
                    <input v-model="resetPassword" type="password" placeholder="新密码（至少 6 位）"
                           class="w-full bg-transparent outline-none text-white text-sm placeholder-zinc-600" />
                </div>
                <div class="console-input rounded-xl px-4 py-3">
                    <input v-model="resetConfirm" type="password" placeholder="确认新密码"
                           class="w-full bg-transparent outline-none text-white text-sm placeholder-zinc-600"
                           @keyup.enter="handlePasswordReset" />
                </div>
            </div>
            <p v-if="resetError" class="text-red-400 text-xs mb-3 px-1">{{ resetError }}</p>
            <button @click="handlePasswordReset" :disabled="resetLoading"
                    class="w-full py-3 bg-white text-zinc-900 rounded-xl font-bold text-sm hover:bg-zinc-100 active:scale-[0.98] transition-all disabled:opacity-50">
                {{ resetLoading ? '保存中...' : '确认重置' }}
            </button>
        </div>
    </div>

    <!-- Username setup (first login) -->
    <div v-else-if="needsUsername"
         class="absolute inset-0 z-[100] flex items-center justify-center bg-[#050505]">
        <div class="w-full max-w-sm px-8 text-center" style="animation: fade-up 0.5s both;">
            <div class="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto mb-6">
                <span class="text-2xl font-bold text-white">{{ (usernameInput || '?').charAt(0).toUpperCase() }}</span>
            </div>
            <h2 class="font-cinzel text-2xl text-white tracking-widest uppercase mb-2">Welcome</h2>
            <p class="text-zinc-500 text-xs font-mono tracking-wider mb-8">为自己起一个显示名称</p>
            <div class="console-input rounded-xl px-4 py-4 mb-3">
                <input v-model="usernameInput" type="text" placeholder="你的名字..."
                       class="w-full bg-transparent border-none outline-none text-white text-center text-xl placeholder-zinc-600"
                       @keyup.enter="handleSetUsername" />
            </div>
            <p v-if="usernameError" class="text-red-400 text-xs mb-3">{{ usernameError }}</p>
            <button @click="handleSetUsername" :disabled="usernameLoading || !usernameInput.trim()"
                    class="w-full py-3 bg-white text-zinc-900 rounded-xl font-bold text-sm hover:bg-zinc-100 active:scale-[0.98] transition-all disabled:opacity-50">
                {{ usernameLoading ? '保存中...' : '进入 Pause' }}
            </button>
        </div>
    </div>

    <!-- Login / signup -->
    <div v-else
         class="absolute inset-0 z-[100] flex items-center justify-center bg-[#050505] overflow-hidden">
        <div class="w-full max-w-sm px-8 flex flex-col items-center">

            <!-- Logo -->
            <div class="text-center" :class="expanded ? 'mt-0' : 'mt-0'">
                <h1 class="font-cinzel text-4xl text-white tracking-widest uppercase"
                    :class="expanded ? 'text-2xl' : 'text-4xl'"
                    style="transition: font-size 0.5s cubic-bezier(0.4,0,0.2,1);">Pause</h1>
                <p class="text-zinc-600 text-xs font-mono tracking-wider mt-2"
                   style="transition: opacity 0.4s ease;"
                   :style="expanded ? 'opacity:0; height:0; margin:0; overflow:hidden;' : 'opacity:1;'">
                    Pause the moment, save the echo.
                </p>
            </div>

            <!-- Preview image — shrinks when expanded -->
            <div class="overflow-hidden"
                 :style="expanded
                     ? 'max-height: 120px; margin-top: 12px; transition: max-height 0.55s cubic-bezier(0.4,0,0.2,1), margin 0.55s ease;'
                     : 'max-height: 360px; margin-top: 28px; transition: max-height 0.55s cubic-bezier(0.4,0,0.2,1), margin 0.55s ease;'">
                <img src="/examplesOnLoginPage.png"
                     alt="Scene examples"
                     class="mx-auto select-none pointer-events-none block"
                     :style="expanded ? 'width: 140px; transition: width 0.55s cubic-bezier(0.4,0,0.2,1);' : 'width: 260px; transition: width 0.55s cubic-bezier(0.4,0,0.2,1);'"
                     draggable="false" />
            </div>

            <!-- Phase 1: 开始按钮 -->
            <div v-if="!expanded"
                 class="w-full mt-8"
                 style="animation: fade-up 0.6s 0.2s both;">
                <button @click="expanded = true"
                        class="w-full py-3.5 bg-white text-zinc-900 rounded-xl font-bold text-sm tracking-widest uppercase hover:bg-zinc-100 active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(255,255,255,0.08)]">
                    开始
                </button>
            </div>

            <!-- Phase 2: 登录表单 -->
            <div v-else class="w-full form-expand">

                <!-- Email sent confirmation -->
                <div v-if="emailSent" class="text-center mt-6">
                    <div class="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-5">
                        <svg class="w-6 h-6 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                        </svg>
                    </div>
                    <p class="text-white font-medium mb-2">邮件已发送</p>
                    <p class="text-zinc-500 text-sm leading-relaxed mb-8">请查收邮箱，点击链接完成操作后返回此页。</p>
                    <button @click="emailSent = false" class="text-zinc-500 hover:text-white text-sm transition">← 返回</button>
                </div>

                <template v-else>
                    <div class="flex bg-zinc-900/80 rounded-xl p-1 mb-4 mt-5">
                        <button @click="loginTab = 'signin'; authError = ''"
                                class="flex-1 py-2 rounded-lg text-sm font-medium transition"
                                :class="loginTab === 'signin' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'">
                            登录
                        </button>
                        <button @click="loginTab = 'signup'; authError = ''"
                                class="flex-1 py-2 rounded-lg text-sm font-medium transition"
                                :class="loginTab === 'signup' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'">
                            注册
                        </button>
                    </div>

                    <div class="space-y-3 mb-2">
                        <div class="console-input rounded-xl px-4 py-3">
                            <input v-model="authEmail" type="email" placeholder="邮箱地址"
                                   class="w-full bg-transparent outline-none text-white text-sm placeholder-zinc-600"
                                   @keyup.enter="handleEmailAuth" />
                        </div>
                        <div class="console-input rounded-xl px-4 py-3">
                            <input v-model="authPassword" type="password" placeholder="密码（至少 6 位）"
                                   class="w-full bg-transparent outline-none text-white text-sm placeholder-zinc-600"
                                   @keyup.enter="handleEmailAuth" />
                        </div>
                    </div>

                    <div v-if="loginTab === 'signin'" class="text-right mb-3">
                        <button @click="handleForgotPassword"
                                class="text-zinc-500 hover:text-zinc-300 text-xs transition">
                            忘记密码？
                        </button>
                    </div>
                    <div v-else class="mb-3"></div>

                    <p v-if="authError" class="text-red-400 text-xs mb-3 px-1">{{ authError }}</p>

                    <button @click="handleEmailAuth" :disabled="authLoading"
                            class="w-full py-3 bg-white text-zinc-900 rounded-xl font-bold text-sm hover:bg-zinc-100 active:scale-[0.98] transition-all disabled:opacity-50 mb-4">
                        {{ authLoading ? '处理中...' : (loginTab === 'signin' ? '登录' : '创建账号') }}
                    </button>

                    <div class="flex items-center gap-3 mb-4">
                        <div class="flex-1 h-px bg-zinc-800"></div>
                        <span class="text-zinc-700 text-xs">或</span>
                        <div class="flex-1 h-px bg-zinc-800"></div>
                    </div>

                    <button @click="signInWithGoogle"
                            class="w-full flex items-center justify-center gap-3 py-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/80 text-white rounded-xl text-sm font-medium active:scale-[0.98] transition-all">
                        <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        使用 Google 继续
                    </button>
                </template>
            </div>

        </div>
    </div>
</template>

<script setup>
import { ref, inject } from 'vue'

const expanded = ref(false)

// Auth state is provided by App.vue — no prop drilling needed.
const {
    showPasswordReset, needsUsername,
    loginTab, authEmail, authPassword, authError, authLoading, emailSent,
    handleEmailAuth, handleForgotPassword, signInWithGoogle,
    usernameInput, usernameError, usernameLoading, handleSetUsername,
    resetPassword, resetConfirm, resetError, resetLoading, handlePasswordReset,
} = inject('auth')
</script>

<style scoped>
.form-expand {
    animation: form-slide-up 0.45s cubic-bezier(0.4, 0, 0.2, 1) both;
}
@keyframes form-slide-up {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
}
</style>
