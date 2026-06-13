<template>
    <transition name="fade-slide">
        <div v-if="showSettings"
             class="absolute inset-0 z-[80] bg-[#050505]/98 backdrop-blur-md flex flex-col">

            <div class="p-4 md:p-8 flex justify-between items-center border-b border-zinc-800/50 shrink-0">
                <h2 class="font-cinzel text-xl text-white tracking-widest uppercase">Account</h2>
                <button @click="$emit('close')"
                        class="px-5 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white text-sm tracking-wider active:scale-95 transition-all">
                    关闭
                </button>
            </div>

            <div class="flex border-b border-zinc-800/50 px-6 md:px-8 shrink-0">
                <button @click="$emit('update:settingsTab', 'profile'); $emit('clear-msg')"
                        class="px-4 py-3 text-sm font-medium border-b-2 transition mr-4"
                        :class="settingsTab === 'profile'
                            ? 'border-white text-white'
                            : 'border-transparent text-zinc-500 hover:text-zinc-300'">
                    个人资料
                </button>
                <button @click="$emit('update:settingsTab', 'security'); $emit('clear-msg')"
                        class="px-4 py-3 text-sm font-medium border-b-2 transition"
                        :class="settingsTab === 'security'
                            ? 'border-white text-white'
                            : 'border-transparent text-zinc-500 hover:text-zinc-300'">
                    安全设置
                </button>
            </div>

            <div class="flex-1 overflow-y-auto">
                <div class="max-w-md mx-auto px-6 md:px-8 py-8 space-y-6">

                    <!-- 个人资料 Tab -->
                    <template v-if="settingsTab === 'profile'">
                        <div class="flex items-center gap-4 p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/50">
                            <img v-if="currentUser?.user_metadata?.avatar_url"
                                 :src="currentUser.user_metadata.avatar_url"
                                 class="w-14 h-14 rounded-full border-2 border-zinc-700 shrink-0" />
                            <div v-else
                                 class="w-14 h-14 rounded-full bg-zinc-700 border-2 border-zinc-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
                                {{ displayName.charAt(0).toUpperCase() }}
                            </div>
                            <div class="min-w-0">
                                <p class="text-white font-medium truncate">{{ displayName }}</p>
                                <p class="text-zinc-500 text-xs mt-0.5 truncate">{{ currentUser?.email }}</p>
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs uppercase tracking-widest text-zinc-500 mb-2">显示名称</label>
                            <div class="flex gap-2">
                                <div class="console-input rounded-xl px-4 py-3 flex-1">
                                    <input :value="editUsername" @input="$emit('update:editUsername', $event.target.value)"
                                           type="text" placeholder="输入新名称"
                                           class="w-full bg-transparent outline-none text-white text-sm placeholder-zinc-600"
                                           @keyup.enter="$emit('update-username')" />
                                </div>
                                <button @click="$emit('update-username')"
                                        :disabled="settingsLoading || !editUsername.trim()"
                                        class="px-4 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl text-sm font-medium active:scale-95 transition-all disabled:opacity-40 shrink-0">
                                    保存
                                </button>
                            </div>
                        </div>
                    </template>

                    <!-- 安全设置 Tab -->
                    <template v-if="settingsTab === 'security'">
                        <div>
                            <label class="block text-xs uppercase tracking-widest text-zinc-500 mb-3">登录方式</label>
                            <div class="space-y-2">
                                <div class="flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                                    <div class="flex items-center gap-3">
                                        <svg class="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                                        </svg>
                                        <div>
                                            <p class="text-sm text-white">邮箱 + 密码</p>
                                            <p class="text-xs text-zinc-500 mt-0.5">{{ currentUser?.email }}</p>
                                        </div>
                                    </div>
                                    <span class="text-xs font-mono px-2 py-1 rounded-md"
                                          :class="hasEmailLinked ? 'bg-green-900/40 text-green-400' : 'bg-zinc-800 text-zinc-500'">
                                        {{ hasEmailLinked ? '已绑定' : '未绑定' }}
                                    </span>
                                </div>
                                <div class="flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                                    <div class="flex items-center gap-3">
                                        <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                        </svg>
                                        <p class="text-sm text-white">Google</p>
                                    </div>
                                    <div>
                                        <span v-if="hasGoogleLinked"
                                              class="text-xs font-mono px-2 py-1 rounded-md bg-green-900/40 text-green-400">已绑定</span>
                                        <button v-else @click="$emit('link-google')" :disabled="settingsLoading"
                                                class="text-xs font-mono px-3 py-1 rounded-md bg-zinc-700 hover:bg-zinc-600 text-white active:scale-95 transition-all disabled:opacity-50">
                                            {{ settingsLoading ? '跳转中...' : '绑定' }}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs uppercase tracking-widest text-zinc-500 mb-1">
                                {{ hasEmailLinked ? '更改密码' : '设置密码' }}
                            </label>
                            <p class="text-zinc-600 text-xs mb-3">
                                {{ hasEmailLinked ? '更改后需重新登录' : '设置密码后可用邮箱登录，无需 Google' }}
                            </p>
                            <div class="space-y-2">
                                <div class="console-input rounded-xl px-4 py-3">
                                    <input :value="newPassword" @input="$emit('update:newPassword', $event.target.value)"
                                           type="password" placeholder="新密码（至少 6 位）"
                                           class="w-full bg-transparent outline-none text-white text-sm placeholder-zinc-600" />
                                </div>
                                <div class="console-input rounded-xl px-4 py-3">
                                    <input :value="confirmPassword" @input="$emit('update:confirmPassword', $event.target.value)"
                                           type="password" placeholder="确认新密码"
                                           class="w-full bg-transparent outline-none text-white text-sm placeholder-zinc-600"
                                           @keyup.enter="$emit('save-password')" />
                                </div>
                                <button @click="$emit('save-password')"
                                        :disabled="settingsLoading || !newPassword || !confirmPassword"
                                        class="w-full py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl text-sm font-medium active:scale-95 transition-all disabled:opacity-40">
                                    保存密码
                                </button>
                            </div>
                        </div>

                        <div class="pt-2 border-t border-zinc-800/50">
                            <button @click="$emit('sign-out')"
                                    class="w-full py-3 bg-zinc-900 hover:bg-red-900/30 border border-zinc-800 hover:border-red-500/30 text-zinc-400 hover:text-red-400 rounded-xl text-sm font-medium active:scale-95 transition-all">
                                退出登录
                            </button>
                        </div>
                    </template>

                    <div v-if="settingsMsg.text"
                         class="p-3 rounded-xl text-sm text-center"
                         :class="settingsMsg.type === 'success'
                             ? 'bg-green-900/20 border border-green-500/30 text-green-400'
                             : 'bg-red-900/20 border border-red-500/30 text-red-400'">
                        {{ settingsMsg.text }}
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script setup>
defineProps({
    showSettings:    Boolean,
    currentUser:     Object,
    displayName:     String,
    settingsTab:     String,
    settingsLoading: Boolean,
    settingsMsg:     Object,
    editUsername:    String,
    newPassword:     String,
    confirmPassword: String,
    hasEmailLinked:  Boolean,
    hasGoogleLinked: Boolean,
})
defineEmits([
    'close', 'clear-msg',
    'update:settingsTab', 'update:editUsername',
    'update:newPassword', 'update:confirmPassword',
    'update-username', 'save-password', 'link-google', 'sign-out',
])
</script>
