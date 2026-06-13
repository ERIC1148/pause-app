import { ref, computed } from 'vue'
import { supabaseClient } from '../lib/supabase.js'

export function useAuth() {
    // onLogin is assigned by App.vue after both composables are ready.
    // Using a setter instead of a prop keeps useAuth self-contained.
    let onLogin = null

    // auth state
    const currentUser       = ref(null)
    const isAuthLoading     = ref(true)
    const showPasswordReset = ref(false)

    const hasGoogleLinked = computed(() =>
        currentUser.value?.identities?.some(i => i.provider === 'google') ?? false
    )
    const hasEmailLinked = computed(() =>
        currentUser.value?.identities?.some(i => i.provider === 'email') ?? false
    )
    const displayName = computed(() =>
        currentUser.value?.user_metadata?.username ||
        currentUser.value?.user_metadata?.full_name ||
        currentUser.value?.email?.split('@')[0] || ''
    )
    const needsUsername = computed(() =>
        !!currentUser.value && !currentUser.value.user_metadata?.onboarded
    )

    // login form
    const loginTab     = ref('signin')
    const authEmail    = ref('')
    const authPassword = ref('')
    const authError    = ref('')
    const authLoading  = ref(false)
    const emailSent    = ref(false)

    const ERROR_MAP = {
        'Invalid login credentials':                         '邮箱或密码错误',
        'Email not confirmed':                               '请先点击邮件中的验证链接',
        'User already registered':                           '该邮箱已注册，请直接登录',
        'Password should be at least 6 characters':          '密码至少需要 6 位',
        'Unable to validate email address: invalid format':  '邮箱格式不正确',
    }

    const handleEmailAuth = async () => {
        authError.value   = ''
        authLoading.value = true
        try {
            if (loginTab.value === 'signup') {
                const { data, error } = await supabaseClient.auth.signUp({
                    email: authEmail.value.trim(),
                    password: authPassword.value,
                })
                if (error) throw error
                if (!data.session) emailSent.value = true
            } else {
                const { error } = await supabaseClient.auth.signInWithPassword({
                    email: authEmail.value.trim(),
                    password: authPassword.value,
                })
                if (error) throw error
            }
        } catch (err) {
            authError.value = ERROR_MAP[err.message] || err.message
        } finally {
            authLoading.value = false
        }
    }

    const handleForgotPassword = async () => {
        if (!authEmail.value.trim()) { authError.value = '请先填写邮箱地址'; return }
        authLoading.value = true
        authError.value   = ''
        const { error } = await supabaseClient.auth.resetPasswordForEmail(
            authEmail.value.trim(),
            { redirectTo: window.location.origin + window.location.pathname }
        )
        authLoading.value = false
        if (error) { authError.value = error.message } else { emailSent.value = true }
    }

    const signInWithGoogle = () => supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + window.location.pathname },
    })

    const signOut = async () => {
        await supabaseClient.auth.signOut()
        showSettings.value = false
    }

    // username setup (first login)
    const usernameInput   = ref('')
    const usernameError   = ref('')
    const usernameLoading = ref(false)

    const handleSetUsername = async () => {
        const name = usernameInput.value.trim()
        if (!name) return
        usernameLoading.value = true
        usernameError.value   = ''
        const { data, error } = await supabaseClient.auth.updateUser({
            data: { username: name, onboarded: true }
        })
        if (error) { usernameError.value = error.message }
        else        { currentUser.value = data.user }
        usernameLoading.value = false
    }

    // password reset (email callback)
    const resetPassword = ref('')
    const resetConfirm  = ref('')
    const resetError    = ref('')
    const resetLoading  = ref(false)

    const handlePasswordReset = async () => {
        if (resetPassword.value.length < 6) { resetError.value = '密码至少需要 6 位'; return }
        if (resetPassword.value !== resetConfirm.value) { resetError.value = '两次密码不一致'; return }
        resetLoading.value = true
        resetError.value   = ''
        const { error } = await supabaseClient.auth.updateUser({ password: resetPassword.value })
        if (error) {
            resetError.value = error.message
        } else {
            showPasswordReset.value = false
            await supabaseClient.auth.signOut()
        }
        resetLoading.value = false
    }

    // account settings panel
    const showSettings    = ref(false)
    const settingsTab     = ref('profile')
    const settingsLoading = ref(false)
    const settingsMsg     = ref({ type: '', text: '' })
    const editUsername    = ref('')

    const handleUpdateUsername = async () => {
        const name = editUsername.value.trim()
        if (!name) return
        settingsLoading.value = true
        settingsMsg.value     = { type: '', text: '' }
        const { data, error } = await supabaseClient.auth.updateUser({ data: { username: name } })
        if (error) { settingsMsg.value = { type: 'error', text: error.message } }
        else        { currentUser.value = data.user; settingsMsg.value = { type: 'success', text: '用户名已更新' } }
        settingsLoading.value = false
    }

    const linkGoogle = async () => {
        settingsMsg.value     = { type: '', text: '' }
        settingsLoading.value = true
        const { error } = await supabaseClient.auth.linkIdentity({
            provider: 'google',
            options: { redirectTo: window.location.origin + window.location.pathname },
        })
        settingsLoading.value = false
        if (error) {
            settingsMsg.value = {
                type: 'error',
                text: error.message.includes('not enabled')
                    ? '请先在 Supabase Console → Authentication → Sessions 中开启账号关联功能'
                    : error.message,
            }
        }
    }

    const newPassword     = ref('')
    const confirmPassword = ref('')

    const handleSavePassword = async () => {
        if (newPassword.value.length < 6) { settingsMsg.value = { type: 'error', text: '密码至少需要 6 位' }; return }
        if (newPassword.value !== confirmPassword.value) { settingsMsg.value = { type: 'error', text: '两次密码不一致' }; return }
        settingsLoading.value = true
        settingsMsg.value     = { type: '', text: '' }
        const { data, error } = await supabaseClient.auth.updateUser({ password: newPassword.value })
        if (error) {
            settingsMsg.value = { type: 'error', text: error.message }
        } else {
            currentUser.value = data.user
            settingsMsg.value = { type: 'success', text: '密码已保存，现在可以用邮箱登录了' }
            newPassword.value = ''; confirmPassword.value = ''
            const { data: fresh } = await supabaseClient.auth.getUser()
            if (fresh?.user) currentUser.value = fresh.user
        }
        settingsLoading.value = false
    }

    const openSettings = (currentDisplayName) => {
        editUsername.value    = currentDisplayName
        newPassword.value     = ''
        confirmPassword.value = ''
        settingsMsg.value     = { type: '', text: '' }
        settingsTab.value     = 'profile'
        showSettings.value    = true
    }

    // session handling
    const handleSession = async (session, triggerLogin = false) => {
        try {
            if (session?.user) {
                const { data } = await supabaseClient.auth.getUser()
                currentUser.value = data?.user ?? session.user
                const meta = currentUser.value.user_metadata ?? {}

                // Back-fill onboarded flag for users who set a username before the flag existed.
                if (meta.username && !meta.onboarded) {
                    const { data: patched } = await supabaseClient.auth.updateUser({
                        data: { onboarded: true }
                    })
                    if (patched?.user) currentUser.value = patched.user
                }

                if (!currentUser.value.user_metadata?.onboarded) {
                    usernameInput.value = meta.full_name || ''
                }

                if (triggerLogin && onLogin) await onLogin()
            } else {
                currentUser.value = null
            }
        } catch (err) {
            console.error('handleSession:', err)
        } finally {
            isAuthLoading.value = false
        }
    }

    const setupAuthListener = async () => {
        try {
            // getSession() reads from localStorage — synchronous in practice but async by API contract.
            const { data } = await supabaseClient.auth.getSession()
            await handleSession(data?.session ?? null, true)
        } catch (err) {
            console.error('setupAuthListener:', err)
            isAuthLoading.value = false
        }

        // Listen for subsequent auth changes (sign-in, sign-out, password recovery).
        supabaseClient.auth.onAuthStateChange(async (event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                showPasswordReset.value = true
                isAuthLoading.value = false
                return
            }
            if (event === 'INITIAL_SESSION') return  // already handled by getSession() above
            // TOKEN_REFRESHED fires when the tab regains focus — do not navigate, just update user state.
            const shouldNavigate = event === 'SIGNED_IN'
            await handleSession(session, shouldNavigate)
        })
    }

    return {
        currentUser, isAuthLoading, showPasswordReset, needsUsername,
        displayName, hasGoogleLinked, hasEmailLinked,
        loginTab, authEmail, authPassword, authError, authLoading, emailSent,
        handleEmailAuth, handleForgotPassword, signInWithGoogle, signOut,
        usernameInput, usernameError, usernameLoading, handleSetUsername,
        resetPassword, resetConfirm, resetError, resetLoading, handlePasswordReset,
        showSettings, settingsTab, settingsLoading, settingsMsg,
        editUsername, handleUpdateUsername,
        newPassword, confirmPassword, handleSavePassword,
        linkGoogle, openSettings,
        setupAuthListener,
        set onLogin(fn) { onLogin = fn },
    }
}
