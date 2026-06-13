import { ref, computed } from 'vue'
import html2canvas from 'html2canvas'
import { supabaseClient } from '../lib/supabase.js'

// Module-level so the quote only changes on full page reload, not on component remount.
const CINEMATIC_QUOTES = [
    "The silence is deafening.",
    "In the beginning was the word.",
    "Every frame is a lie — and a truth.",
    "Light is time. Time is cinema.",
    "We tell ourselves stories in order to live.",
    "What we cannot speak about, we must pass over in silence.",
    "The eye sees only what the mind is prepared to comprehend.",
    "All that we see or seem is but a dream within a dream.",
]
export const emptyQuote = CINEMATIC_QUOTES[Math.floor(Math.random() * CINEMATIC_QUOTES.length)]

export const COLOR_GRADES = [
    { name: 'Noir',         preview: '#202020',                                             css: 'linear-gradient(to bottom, #2a2a2a, #111)' },
    { name: 'Teal & Orange',preview: 'linear-gradient(to bottom right, #0f3c4c, #5c2c16)', css: 'linear-gradient(135deg, #0d2836 0%, #1f2229 50%, #4a2511 100%)' },
    { name: 'Sci-Fi',       preview: '#0f172a',                                             css: 'linear-gradient(to bottom, #0f172a, #020617)' },
    { name: 'Warm Vintage', preview: '#451a03',                                             css: 'radial-gradient(circle at center, #562911 0%, #291002 100%)' },
    { name: 'Melancholy',   preview: '#94a3b8',                                             css: 'linear-gradient(to right, #1e293b, #334155)' },
    { name: 'Rose Dusk',    preview: 'linear-gradient(to bottom right, #2d1321, #8b3a52)', css: 'linear-gradient(135deg, #1a0a13 0%, #3d1a2a 50%, #6b2b3e 100%)' },
    { name: 'Deep Ocean',   preview: '#0a2342',                                             css: 'linear-gradient(to bottom, #040e1c, #0a1e38, #0d3055)' },
    { name: 'Crimson',      preview: '#7f1d1d',                                             css: 'linear-gradient(to bottom, #2a0303, #5c0a0a, #7f1d1d)' },
    { name: 'Forest Night', preview: '#14532d',                                             css: 'linear-gradient(135deg, #020f07 0%, #0a2414 50%, #14532d 100%)' },
    { name: 'Golden Hour',  preview: '#92400e',                                             css: 'radial-gradient(circle at 30% 70%, #4a1a03 0%, #7c3210 40%, #b86010 100%)' },
]

export const formatTime = (date) =>
    [date.getHours(), date.getMinutes(), date.getSeconds()]
        .map(n => String(n).padStart(2, '0')).join(':')

export const formatDate = (timestamp) => {
    const d = new Date(timestamp)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

const canvasToThumbnail = (canvas, maxWidth = 600, quality = 0.5) => {
    const ratio = Math.min(1, maxWidth / canvas.width)
    const thumb = document.createElement('canvas')
    thumb.width  = Math.round(canvas.width  * ratio)
    thumb.height = Math.round(canvas.height * ratio)
    thumb.getContext('2d').drawImage(canvas, 0, 0, thumb.width, thumb.height)
    return thumb.toDataURL('image/jpeg', quality)
}

export function useScenes(currentUser = ref(null)) {

    // navigation
    const currentView   = ref('home')
    const showcaseIndex = ref(0)

    const showcaseCard = computed(() =>
        records.value.length ? records.value[showcaseIndex.value % records.value.length] : null
    )

    const goToStudio = (record = null) => {
        if (record) loadRecord(record)
        else resetForm()
        currentView.value = 'studio'
    }

    const goHome = () => {
        if (records.value.length)
            showcaseIndex.value = Math.floor(Math.random() * records.value.length)
        currentView.value = 'home'
    }

    const nextShowcase = () => {
        if (records.value.length <= 1) return
        let next
        do { next = Math.floor(Math.random() * records.value.length) }
        while (next === showcaseIndex.value)
        showcaseIndex.value = next
    }

    // studio state
    const metadata     = ref({ movie: '', character: '', year: '' })
    const dialogue     = ref('')
    const isGenerating = ref(false)
    const currentTime  = ref('')
    const currentDate  = ref('')
    const takeCount    = ref(1)

    // movie selection state (Studio: pick existing movie or create new)
    const movies          = ref([])
    const selectedMovieId = ref(null)
    const movieDraft      = ref({ cinema: '', watchedDate: '', seat: '' })
    const isNewMovie      = computed(() => !selectedMovieId.value)

    // gallery state
    const showVault       = ref(false)
    const galleryTab      = ref('quotes')   // 'quotes' | 'movies'
    const records         = ref([])
    const currentRecordId = ref(null)
    const toastMessage    = ref('')
    const colorGrades     = COLOR_GRADES
    const currentGrade    = ref(colorGrades[0])
    const recordCount     = computed(() => records.value.length)
    const movieCount      = computed(() => movies.value.length)

    // scenes belonging to a given movie (for MovieDetailOverlay)
    const scenesForMovie = (movieId) =>
        records.value.filter(r => r.movieId === movieId)

    // Apply a movie selection from the autocomplete: existing movie or new title.
    const selectMovie = (movie) => {
        selectedMovieId.value = movie.id
        metadata.value = { ...metadata.value, movie: movie.title, year: movie.year || '' }
        movieDraft.value = {
            cinema:      movie.cinema || '',
            watchedDate: movie.watchedDate || '',
            seat:        movie.seat || '',
        }
    }
    const useNewMovie = (title) => {
        selectedMovieId.value = null
        metadata.value = { ...metadata.value, movie: title }
        movieDraft.value = { cinema: '', watchedDate: '', seat: '' }
    }

    // dialogue parsing for multi-speaker cards
    const isDialogueMode = computed(() =>
        dialogue.value.trim().split('\n').filter(l => l.trim()).length > 1
    )
    const parsedDialogue = computed(() =>
        isDialogueMode.value
            ? dialogue.value.split('\n').map(l => l.trim()).filter(Boolean)
            : []
    )

    // long-press card menu
    const activeCardMenu = ref(null)
    let _longPressTimer  = null

    const onCardTouchStart = (id) => {
        _longPressTimer = setTimeout(() => { activeCardMenu.value = id }, 500)
    }
    const onCardTouchEnd  = () => clearTimeout(_longPressTimer)
    const onCardTap       = (record) => {
        if (activeCardMenu.value) { activeCardMenu.value = null; return }
        goToStudio(record)
    }
    const dismissCardMenu = () => { activeCardMenu.value = null }

    const toggleVault = () => { showVault.value = !showVault.value }

    const showToast = (msg) => {
        toastMessage.value = msg
        setTimeout(() => { toastMessage.value = '' }, 3000)
    }

    // Supabase CRUD
    const loadRecordsFromDB = async () => {
        if (!currentUser.value) return
        const { data, error } = await supabaseClient
            .from('scenes').select('*').order('created_at', { ascending: false })
        if (error) { console.error('loadRecordsFromDB:', error); return }
        records.value = data.map(row => ({
            id:         row.id,
            movieId:    row.movie_id,
            metadata:   row.metadata,
            dialogue:   row.dialogue,
            colorGrade: row.color_grade,
            thumbnail:  row.thumbnail,
            createdAt:  row.created_at,
        }))
    }

    const loadMoviesFromDB = async () => {
        if (!currentUser.value) return
        const { data, error } = await supabaseClient
            .from('movies').select('*').order('watched_date', { ascending: false, nullsFirst: false })
        if (error) { console.error('loadMoviesFromDB:', error); return }
        movies.value = data.map(row => ({
            id:          row.id,
            title:       row.title,
            year:        row.year,
            cinema:      row.cinema,
            watchedDate: row.watched_date,
            seat:        row.seat,
            createdAt:   row.created_at,
        }))
    }

    // Create a movie row from a draft; returns the new id (or null on failure).
    const createMovie = async ({ title, year, cinema, watchedDate, seat }) => {
        if (!currentUser.value) return null
        const { data, error } = await supabaseClient.from('movies').insert({
            user_id:      currentUser.value.id,
            title,
            year:         year || null,
            cinema:       cinema || null,
            watched_date: watchedDate || null,
            seat:         seat || null,
        }).select('id').single()
        if (error) { console.error('createMovie:', error); return null }
        return data.id
    }

    // Low-level write, no toast/reload — used during scene save.
    const persistMovie = async (id, { title, year, cinema, watchedDate, seat }) => {
        if (!currentUser.value) return false
        const { error } = await supabaseClient.from('movies').update({
            title,
            year:         year || null,
            cinema:       cinema || null,
            watched_date: watchedDate || null,
            seat:         seat || null,
            updated_at:   new Date().toISOString(),
        }).eq('id', id)
        if (error) { console.error('persistMovie:', error); return false }
        return true
    }

    // Explicit edit from the Gallery — gives user feedback and refreshes the list.
    const updateMovie = async (id, patch) => {
        const ok = await persistMovie(id, patch)
        if (!ok) { showToast('更新观影记录失败'); return }
        await loadMoviesFromDB()
        showToast('观影记录已更新 ✓')
    }

    const deleteMovie = async (id) => {
        if (!currentUser.value) return
        if (!confirm('删除这条观影记录？关联的台词会保留，只是解除关联。')) return
        const { error } = await supabaseClient.from('movies').delete().eq('id', id)
        if (error) { console.error('deleteMovie:', error); return }
        await loadMoviesFromDB()
        await loadRecordsFromDB()
        showToast('已删除观影记录')
    }

    const deleteRecord = async (id) => {
        if (!currentUser.value) return
        if (!confirm('确定要从画廊中删除这个场景吗？')) return
        activeCardMenu.value = null
        const { error } = await supabaseClient.from('scenes').delete().eq('id', id)
        if (error) { console.error('deleteRecord:', error); return }
        if (currentRecordId.value === id) resetForm()
        await loadRecordsFromDB()
        if (records.value.length)
            showcaseIndex.value = Math.floor(Math.random() * records.value.length)
        showToast('已删除场景')
    }

    const downloadRecord = (record) => {
        const link      = document.createElement('a')
        const safeTitle = (record.metadata?.movie || 'Scene').replace(/\s+/g, '_')
        link.download   = `Pause_${safeTitle}.jpg`
        link.href       = record.thumbnail
        link.click()
        activeCardMenu.value = null
        showToast('已下载场景图片')
    }

    const resetForm = () => {
        metadata.value        = { movie: '', character: '', year: '' }
        dialogue.value        = ''
        currentGrade.value    = colorGrades[0]
        currentRecordId.value = null
        selectedMovieId.value = null
        movieDraft.value      = { cinema: '', watchedDate: '', seat: '' }
    }

    const loadRecord = (record) => {
        metadata.value        = { ...record.metadata }
        dialogue.value        = record.dialogue
        const grade           = colorGrades.find(g => g.name === record.colorGrade.name)
        if (grade) currentGrade.value = grade
        currentRecordId.value = record.id
        // Restore the linked movie selection (watch-info inherited from the movie record).
        const movie = record.movieId ? movies.value.find(m => m.id === record.movieId) : null
        if (movie) selectMovie(movie)
        else {
            selectedMovieId.value = null
            movieDraft.value = { cinema: '', watchedDate: '', seat: '' }
        }
        showVault.value       = false
        activeCardMenu.value  = null
    }

    // cardRefEl is the DOM node passed in from StudioView — composables shouldn't own DOM refs.
    const exportAndSave = async (cardRefEl) => {
        if (!cardRefEl || !dialogue.value.trim() || isGenerating.value) return
        isGenerating.value = true
        try {
            const canvas = await html2canvas(cardRefEl, {
                scale: window.devicePixelRatio > 1 ? 2 : 3,
                useCORS: true,
                backgroundColor: '#000000',
                logging: false,
            })
            const thumbnail = canvasToThumbnail(canvas, 1200, 0.88)

            // Resolve the linked movie: reuse existing, or create a new one from the draft.
            let movieId = selectedMovieId.value
            const title = metadata.value.movie?.trim()
            if (movieId) {
                // Existing movie may have had its watch-info completed inline ("补全观影信息").
                await persistMovie(movieId, {
                    title,
                    year:        metadata.value.year,
                    cinema:      movieDraft.value.cinema,
                    watchedDate: movieDraft.value.watchedDate,
                    seat:        movieDraft.value.seat,
                })
            } else if (title) {
                movieId = await createMovie({
                    title,
                    year:        metadata.value.year,
                    cinema:      movieDraft.value.cinema,
                    watchedDate: movieDraft.value.watchedDate,
                    seat:        movieDraft.value.seat,
                })
                selectedMovieId.value = movieId
            }

            const sceneData = {
                user_id:     currentUser.value.id,
                movie:       metadata.value.movie,
                character:   metadata.value.character,
                metadata:    metadata.value,
                dialogue:    dialogue.value,
                color_grade: currentGrade.value,
                thumbnail,
                movie_id:    movieId,
                updated_at:  Date.now(),
            }

            if (currentRecordId.value) {
                const { error } = await supabaseClient
                    .from('scenes').update(sceneData).eq('id', currentRecordId.value)
                if (error) throw error
                showToast('场景已更新至 Gallery ✓')
            } else {
                sceneData.created_at = Date.now()
                const { data, error } = await supabaseClient
                    .from('scenes').insert(sceneData).select('id').single()
                if (error) throw error
                currentRecordId.value = data.id
                showToast('场景已保存至 Gallery ✓')
            }
            await loadMoviesFromDB()
            await loadRecordsFromDB()
            takeCount.value++
            if (records.value.length) showcaseIndex.value = 0
        } catch (err) {
            console.error('exportAndSave:', err)
            showToast('渲染失败，请重试')
        } finally {
            isGenerating.value = false
        }
    }

    const setupScenes = () => {
        const tick = () => {
            const d = new Date()
            currentTime.value = formatTime(d)
            currentDate.value = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
        }
        tick()
        setInterval(tick, 1000)
    }

    return {
        currentView, showcaseCard, goToStudio, goHome, nextShowcase,
        metadata, dialogue, isGenerating, currentTime, currentDate, takeCount,
        colorGrades, currentGrade, isDialogueMode, parsedDialogue,
        showVault, galleryTab, records, currentRecordId, toastMessage, recordCount,
        activeCardMenu,
        movies, movieCount, selectedMovieId, movieDraft, isNewMovie,
        selectMovie, useNewMovie, scenesForMovie,
        loadMoviesFromDB, createMovie, updateMovie, deleteMovie,
        loadRecordsFromDB, deleteRecord, downloadRecord,
        resetForm, loadRecord, exportAndSave,
        toggleVault, showToast,
        onCardTouchStart, onCardTouchEnd, onCardTap, dismissCardMenu,
        setupScenes, formatTime, formatDate, emptyQuote,
    }
}
