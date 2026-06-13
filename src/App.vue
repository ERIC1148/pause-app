<template>
    <div class="relative w-full h-[100dvh] overflow-hidden" @click="dismissCardMenu">

        <!-- Loading splash -->
        <div v-if="isAuthLoading"
             class="absolute inset-0 flex items-center justify-center bg-[#050505]">
            <p class="font-cinzel text-zinc-700 text-sm tracking-[0.5em] uppercase" style="animation: fade-up 0.6s both;">Pause</p>
        </div>

        <!-- Auth screens: login / password reset / username setup -->
        <LoginPage v-else-if="!isMainVisible" />

        <!-- Main views: Home ↔ Studio with slide transition -->
        <transition name="page-slide" mode="out-in">
            <HomeView
                v-if="isMainVisible && currentView === 'home'"
                key="home"
                :currentUser="currentUser"
                :displayName="displayName"
                :showcaseCard="showcaseCard"
                :emptyQuote="emptyQuote"
                :recordCount="recordCount"
                :activeCardMenu="activeCardMenu"
                :formatDate="formatDate"
                @open-settings="openSettings(displayName)"
                @go-to-studio="goToStudio"
                @toggle-vault="toggleVault"
                @shuffle-card="nextShowcase"
                @card-tap="onCardTap"
                @card-touch-start="onCardTouchStart"
                @card-touch-end="onCardTouchEnd"
                @download-record="downloadRecord"
                @delete-record="deleteRecord"
            />
            <StudioView
                v-else-if="isMainVisible && currentView === 'studio'"
                key="studio"
                :currentUser="currentUser"
                :displayName="displayName"
                :metadata="metadata"
                :dialogue="dialogue"
                :currentGrade="currentGrade"
                :colorGrades="colorGrades"
                :isGenerating="isGenerating"
                :currentTime="currentTime"
                :currentDate="currentDate"
                :takeCount="takeCount"
                :currentRecordId="currentRecordId"
                :isDialogueMode="isDialogueMode"
                :parsedDialogue="parsedDialogue"
                :formatTime="formatTime"
                :movies="movies"
                :selectedMovieId="selectedMovieId"
                :movieDraft="movieDraft"
                @go-home="goHome"
                @open-settings="openSettings(displayName)"
                @reset-form="resetForm"
                @export-and-save="exportAndSave"
                @update:metadata="metadata = $event"
                @update:dialogue="dialogue = $event"
                @update:currentGrade="currentGrade = $event"
                @update:movieDraft="movieDraft = $event"
                @select-movie="selectMovie"
                @use-new-movie="useNewMovie"
                @deselect-movie="selectedMovieId = null"
            />
        </transition>

        <!-- Global overlays (always rendered once logged in) -->
        <template v-if="currentUser">
            <GalleryOverlay
                :showVault="showVault"
                :galleryTab="galleryTab"
                :records="records"
                :movies="movies"
                :movieCount="movieCount"
                :scenesForMovie="scenesForMovie"
                :activeCardMenu="activeCardMenu"
                :recordCount="recordCount"
                :formatDate="formatDate"
                @toggle-vault="toggleVault"
                @update:galleryTab="galleryTab = $event"
                @card-tap="onCardTap"
                @card-touch-start="onCardTouchStart"
                @card-touch-end="onCardTouchEnd"
                @download-record="downloadRecord"
                @delete-record="deleteRecord"
                @update-movie="onUpdateMovie"
                @delete-movie="deleteMovie"
            />
            <SettingsOverlay
                :showSettings="showSettings"
                :currentUser="currentUser"
                :displayName="displayName"
                :settingsTab="settingsTab"
                :settingsLoading="settingsLoading"
                :settingsMsg="settingsMsg"
                :editUsername="editUsername"
                :newPassword="newPassword"
                :confirmPassword="confirmPassword"
                :hasEmailLinked="hasEmailLinked"
                :hasGoogleLinked="hasGoogleLinked"
                @close="showSettings = false"
                @clear-msg="settingsMsg = { type: '', text: '' }"
                @update:settingsTab="settingsTab = $event"
                @update:editUsername="editUsername = $event"
                @update:newPassword="newPassword = $event"
                @update:confirmPassword="confirmPassword = $event"
                @update-username="handleUpdateUsername"
                @save-password="handleSavePassword"
                @link-google="linkGoogle"
                @sign-out="signOut"
            />
        </template>

        <ToastMessage :message="toastMessage" />

        <!-- About -->
        <div class="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
            <a href="https://src.cyg.world"
               target="_blank"
               rel="noopener noreferrer"
               class="pointer-events-auto font-mono text-[9px] tracking-[0.25em] uppercase text-zinc-700 hover:text-zinc-500 transition-colors duration-300 select-none whitespace-nowrap">
                about · built by eric
            </a>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, provide } from 'vue'
import { useAuth } from './composables/useAuth.js'
import { useScenes } from './composables/useScenes.js'
import LoginPage from './components/LoginPage.vue'
import HomeView from './views/HomeView.vue'
import StudioView from './views/StudioView.vue'
import GalleryOverlay from './components/GalleryOverlay.vue'
import SettingsOverlay from './components/SettingsOverlay.vue'
import ToastMessage from './components/ToastMessage.vue'

const auth = useAuth()
const scenes = useScenes(auth.currentUser)

// Make auth available to LoginPage via inject() — avoids threading 15+ props down.
provide('auth', auth)

let _appInitialized = false
auth.onLogin = async () => {
    await scenes.loadMoviesFromDB()
    await scenes.loadRecordsFromDB()
    // Only navigate to home on the very first login in this session.
    // Subsequent calls (token refresh, SIGNED_IN re-fires on tab focus) must not
    // disrupt the user's current view — especially not kick them out of Studio.
    if (!_appInitialized) {
        _appInitialized = true
        if (scenes.records.value.length) scenes.goHome()
    }
}

// Must be called in setup() (not onMounted) so the INITIAL_SESSION event isn't missed.
auth.setupAuthListener()

const {
    currentUser, isAuthLoading, needsUsername, showPasswordReset, displayName,
    hasGoogleLinked, hasEmailLinked,
    showSettings, settingsTab, settingsLoading, settingsMsg,
    editUsername, handleUpdateUsername, newPassword, confirmPassword,
    handleSavePassword, linkGoogle, openSettings, signOut,
} = auth

const {
    currentView, showcaseCard, emptyQuote,
    goToStudio, goHome, nextShowcase,
    metadata, dialogue, isGenerating, currentTime, currentDate, takeCount,
    colorGrades, currentGrade, isDialogueMode, parsedDialogue,
    showVault, galleryTab, records, currentRecordId, toastMessage, recordCount,
    activeCardMenu,
    movies, movieCount, selectedMovieId, movieDraft,
    selectMovie, useNewMovie, scenesForMovie,
    loadMoviesFromDB, updateMovie, deleteMovie,
    loadRecordsFromDB, deleteRecord, downloadRecord,
    resetForm, exportAndSave, toggleVault,
    onCardTouchStart, onCardTouchEnd, onCardTap, dismissCardMenu,
    setupScenes, formatTime, formatDate,
} = scenes

const isMainVisible = computed(() =>
    !isAuthLoading.value && !!currentUser.value && !needsUsername.value && !showPasswordReset.value
)

// MovieDetailOverlay emits { id, patch }
const onUpdateMovie = ({ id, patch }) => updateMovie(id, patch)

onMounted(() => { setupScenes() })
</script>
