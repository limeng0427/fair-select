import { useState, useEffect, useRef } from 'react'
import { useTheme, useMediaQuery } from '@mui/material'
import {
  Box,
  Button,
  Switch,
  Collapse,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import EditIcon from '@mui/icons-material/Edit'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import LockIcon from '@mui/icons-material/Lock'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import './App.css'

const slug = window.location.pathname.replace(/^\//, '')
const STORAGE_KEY = `fair-select/${slug || '__root__'}`

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const DEFAULT_PRIZES = [
  { id: 'prize-gold',   emoji: '🥇', label: 'Gold' },
  { id: 'prize-silver', emoji: '🥈', label: 'Silver' },
  { id: 'prize-bronze', emoji: '🥉', label: 'Bronze' },
]

const DEFAULT_OPTS = {
  animation: true,
  removeAfterSelected: true,
  allowDuplicates: false,
  saveToLocalStorage: true,
  biggerSelectDisplay: true,
  theme: 'standard',
  mode: 'standard',
  prizes: DEFAULT_PRIZES,
}

function normalizePrizes(prizes) {
  return prizes.map((p, i) => p.id ? p : { ...p, id: `prize-${Date.now()}-${i}` })
}

// ── Fortune Wheel ────────────────────────────────────────────────────────────

const WHEEL_COLORS = [
  '#667eea', '#f5576c', '#f9ca24', '#6ab04c',
  '#eb4d4b', '#be2edd', '#22a6b3', '#f0932b',
  '#a29bfe', '#fd79a8', '#00b894', '#e17055',
]

function drawPointer(ctx, cx, cy, r) {
  const tip = cy - r - 2
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(cx, tip)
  ctx.lineTo(cx - 11, tip - 16)
  ctx.lineTo(cx + 11, tip - 16)
  ctx.closePath()
  ctx.fillStyle = '#f5576c'
  ctx.shadowColor = 'rgba(0,0,0,0.35)'
  ctx.shadowBlur = 6
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.restore()
}

function drawWheel(canvas, people, rotation) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const w = canvas.width, h = canvas.height
  const cx = w / 2, cy = h / 2
  const r = Math.min(cx, cy) - 20

  ctx.clearRect(0, 0, w, h)

  // Outer shadow ring
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r + 4, 0, 2 * Math.PI)
  ctx.shadowColor = 'rgba(102,126,234,0.3)'
  ctx.shadowBlur = 16
  ctx.fillStyle = 'transparent'
  ctx.stroke()
  ctx.restore()

  if (people.length === 0) {
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, 2 * Math.PI)
    ctx.fillStyle = '#ede9fe'
    ctx.fill()
    ctx.fillStyle = '#9b8ec4'
    ctx.font = '13px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Add people to spin!', cx, cy)
    drawPointer(ctx, cx, cy, r)
    return
  }

  const n = people.length
  const segAngle = (2 * Math.PI) / n
  const fontSize = Math.max(8, Math.min(14, 200 / n))

  for (let i = 0; i < n; i++) {
    const startAngle = -Math.PI / 2 + rotation + i * segAngle
    const endAngle = startAngle + segAngle
    const midAngle = startAngle + segAngle / 2

    // Segment
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, r, startAngle, endAngle)
    ctx.closePath()
    ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length]
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Text — radial, readable on both halves
    const maxChars = Math.max(4, Math.floor(22 / n) + 5)
    const label = people[i].length > maxChars ? people[i].slice(0, maxChars) + '…' : people[i]
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(midAngle)
    ctx.font = `bold ${fontSize}px system-ui, sans-serif`
    ctx.fillStyle = 'white'
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    const textR = r * 0.62
    if (Math.cos(midAngle) >= 0) {
      ctx.fillText(label, textR, 0)
    } else {
      ctx.rotate(Math.PI)
      ctx.fillText(label, -textR, 0)
    }
    ctx.restore()
  }

  // Outer border
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, 2 * Math.PI)
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'
  ctx.lineWidth = 3
  ctx.stroke()

  // Center hub
  ctx.beginPath()
  ctx.arc(cx, cy, 18, 0, 2 * Math.PI)
  ctx.fillStyle = 'white'
  ctx.shadowColor = 'rgba(0,0,0,0.15)'
  ctx.shadowBlur = 4
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.strokeStyle = '#ddd'
  ctx.lineWidth = 2
  ctx.stroke()

  drawPointer(ctx, cx, cy, r)
}

function FortuneWheel({ pool, spinning, targetIndex, onSpinEnd }) {
  const canvasRef = useRef(null)
  const rotRef = useRef(0)
  const rafRef = useRef(null)

  // Redraw when pool changes (idle only)
  useEffect(() => {
    if (!spinning) drawWheel(canvasRef.current, pool, rotRef.current)
  }, [pool, spinning])

  // Spin animation
  useEffect(() => {
    if (!spinning || pool.length === 0 || targetIndex === null) return
    cancelAnimationFrame(rafRef.current)

    const n = pool.length
    const segAngle = (2 * Math.PI) / n
    // Rotation to bring segment targetIndex to the top pointer
    const targetSegCenter = (targetIndex + 0.5) * segAngle
    const targetMod = (((-targetSegCenter) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
    const currentMod = ((rotRef.current % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
    const delta = ((targetMod - currentMod) + 2 * Math.PI) % (2 * Math.PI)
    const extraSpins = (5 + Math.floor(Math.random() * 3)) * 2 * Math.PI
    const totalRot = extraSpins + delta

    const startRot = rotRef.current
    const duration = 4200
    const startTime = performance.now()

    function frame(now) {
      const t = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 4) // ease-out quartic
      rotRef.current = startRot + totalRot * eased
      drawWheel(canvasRef.current, pool, rotRef.current)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame)
      } else {
        onSpinEnd()
      }
    }
    rafRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafRef.current)
  }, [spinning, targetIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <canvas
        ref={canvasRef}
        width={320}
        height={320}
        style={{ width: '100%', maxWidth: 320 }}
      />
    </Box>
  )
}

// ── Prize row ────────────────────────────────────────────────────────────────

function SortablePrizeRow({ prize, onLabelChange, onEmojiChange, onDelete }) {
  const [editingEmoji, setEditingEmoji] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: prize.id })

  return (
    <Stack
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.45 : 1 }}
      direction="row"
      spacing={1}
      alignItems="center"
    >
      <Box
        {...attributes}
        {...listeners}
        sx={{ cursor: 'grab', color: 'text.disabled', display: 'flex', alignItems: 'center', touchAction: 'none', flexShrink: 0 }}
      >
        <DragIndicatorIcon fontSize="small" />
      </Box>

      {editingEmoji ? (
        <TextField
          size="small"
          value={prize.emoji}
          onChange={(e) => onEmojiChange(e.target.value)}
          onBlur={() => setEditingEmoji(false)}
          onKeyDown={(e) => { if (e.key === 'Enter') setEditingEmoji(false) }}
          autoFocus
          inputProps={{ maxLength: 4 }}
          sx={{ width: 52, flexShrink: 0, '& input': { textAlign: 'center', fontSize: '1.1rem', p: '4px' } }}
        />
      ) : (
        <Typography
          onClick={() => setEditingEmoji(true)}
          title="Click to change emoji"
          sx={{ fontSize: '1.2rem', lineHeight: 1, flexShrink: 0, cursor: 'pointer', userSelect: 'none' }}
        >
          {prize.emoji}
        </Typography>
      )}

      <TextField size="small" value={prize.label} onChange={onLabelChange} sx={{ flex: 1 }} />

      <IconButton size="small" onClick={onDelete} sx={{ flexShrink: 0 }}>
        <CloseIcon fontSize="small" />
      </IconButton>
    </Stack>
  )
}

// ── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const saved = loadSaved()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [peopleLists, setPeopleLists] = useState(() => {
    if (saved?.peopleLists) return saved.peopleLists
    // Migrate old single list → standard mode
    return { standard: saved?.people ?? [], 'prize-giving': [] }
  })
  const [inputValue, setInputValue] = useState('')
  const [selected, setSelected] = useState(saved?.selected ?? null)
  const [previouslySelected, setPreviouslySelected] = useState(saved?.previouslySelected ?? [])
  const [animating, setAnimating] = useState(false)
  const [slotTick, setSlotTick] = useState(0)
  const [reels, setReels] = useState([
    { tick: 0, name: '' },
    { tick: 0, name: saved?.selected ?? '' },
    { tick: 0, name: '' },
  ])
  const [prevOpen, setPrevOpen] = useState(saved?.prevOpen ?? true)
  const [peopleOpen, setPeopleOpen] = useState(saved?.peopleOpen ?? true)
  const [activeTab, setActiveTab] = useState(() => {
    const m = saved?.opts?.mode
    if (m === 'prize-giving') return 1
    return 0
  })
  const [confirmReset, setConfirmReset] = useState(false)
  const [opts, setOpts] = useState(() => {
    const merged = { ...DEFAULT_OPTS, ...(saved?.opts ?? {}) }
    merged.prizes = normalizePrizes(merged.prizes)
    // Migrate old fortune-wheel mode → theme
    if (merged.mode === 'fortune-wheel') {
      merged.mode = 'standard'
      merged.theme = 'fortune-wheel'
    }
    return merged
  })
  const [typewriterText, setTypewriterText] = useState('')
  const [typewriterDone, setTypewriterDone] = useState(false)
  const typewriterRef = useRef(null)
  const skipRef = useRef(false)
  const pendingWheelRemovalRef = useRef(null)
  const [biggerDisplayOpen, setBiggerDisplayOpen] = useState(false)
  const [prizeResults, setPrizeResults] = useState(
    (saved?.prizeResults ?? []).filter((r) => r.prize),
  )
  // Fortune wheel spin target: { pick, targetIndex } | null
  const [wheelSpinTarget, setWheelSpinTarget] = useState(null)
  const [prizeEditMode, setPrizeEditMode] = useState(false)

  // Per-mode people list — derived from current mode
  const people = peopleLists[opts.mode] ?? []
  const setPeople = (updater) => {
    const mode = opts.mode
    setPeopleLists((prev) => ({
      ...prev,
      [mode]: typeof updater === 'function' ? updater(prev[mode] ?? []) : updater,
    }))
  }

  useEffect(() => {
    if (!opts.saveToLocalStorage) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ opts, prevOpen, peopleOpen, prizeResults }))
      return
    }
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ peopleLists, previouslySelected, selected, opts, prevOpen, peopleOpen, prizeResults }),
    )
  }, [peopleLists, previouslySelected, selected, opts, prevOpen, peopleOpen, prizeResults])

  useEffect(() => {
    if (opts.theme !== 'typewriter' || animating || !selected) return
    clearTimeout(typewriterRef.current)
    setTypewriterText('')
    setTypewriterDone(false)
    let i = 0
    function typeNext() {
      i++
      setTypewriterText(selected.slice(0, i))
      if (i < selected.length) {
        typewriterRef.current = setTimeout(typeNext, 80)
      } else {
        setTypewriterDone(true)
      }
    }
    typewriterRef.current = setTimeout(typeNext, 300)
    return () => clearTimeout(typewriterRef.current)
  }, [selected, animating, opts.theme])

  function toggleOpt(key) {
    setOpts((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function handleAdd() {
    const names = inputValue.split(';').map((s) => s.trim()).filter(Boolean)
    if (names.length === 0) return
    const seen = new Set(people)
    const toAdd = []
    for (const name of names) {
      if (seen.has(name)) continue
      if (!opts.allowDuplicates && previouslySelected.includes(name)) continue
      seen.add(name)
      toAdd.push(name)
    }
    if (toAdd.length === 0) return
    setPeople((prev) => [...prev, ...toAdd])
    setInputValue('')
  }

  function handleReset() {
    setPeopleLists({ standard: [], 'prize-giving': [] })
    setPreviouslySelected([])
    setSelected(null)
    setPrizeResults([])
    setWheelSpinTarget(null)
    setOpts(DEFAULT_OPTS)
    setConfirmReset(false)
  }

  function handleAddBack(name, index) {
    setPreviouslySelected((prev) => prev.filter((_, i) => i !== index))
    if (!people.includes(name)) setPeople((prev) => [...prev, name])
  }

  function handleRemove(name) {
    setPeople(people.filter((p) => p !== name))
    if (selected === name) setSelected(null)
  }

  function updatePrize(i, patch) {
    setOpts((prev) => ({
      ...prev,
      prizes: prev.prizes.map((p, j) => j === i ? { ...p, ...patch } : p),
    }))
  }

  function handleStandardReset() {
    setPeopleLists((prev) => ({ ...prev, standard: [] }))
    setPreviouslySelected([])
    setSelected(null)
  }

  function handleStandardRedraw() {
    setPeopleLists((prev) => ({
      ...prev,
      standard: [...new Set([...(prev.standard ?? []), ...previouslySelected])],
    }))
    setPreviouslySelected([])
    setSelected(null)
  }

  function handlePrizeReset() {
    setPeopleLists((prev) => ({ ...prev, 'prize-giving': [] }))
    setPreviouslySelected([])
    setPrizeResults([])
    setSelected(null)
    setOpts((prev) => ({ ...prev, prizes: DEFAULT_PRIZES }))
  }

  function handlePrizeRedraw() {
    const names = prizeResults.map((r) => r.name)
    setPeopleLists((prev) => ({
      ...prev,
      'prize-giving': [...new Set([...(prev['prize-giving'] ?? []), ...names])],
    }))
    setPrizeResults([])
    setSelected(null)
  }

  function applyWheelRemoval(pick) {
    if (opts.removeAfterSelected) {
      setPeople((prev) => prev.filter((p) => p !== pick))
      setPreviouslySelected((prev) => [...prev, pick])
    } else if (!opts.allowDuplicates) {
      setPreviouslySelected((prev) => [...prev, pick])
    }
  }

  function closeBiggerDisplay() {
    if (pendingWheelRemovalRef.current) {
      const pick = pendingWheelRemovalRef.current
      if (opts.mode === 'prize-giving') {
        // Prize mode: person was already recorded in prizeResults; just remove from pool
        setPeople((prev) => prev.filter((p) => p !== pick))
      } else {
        applyWheelRemoval(pick)
      }
      pendingWheelRemovalRef.current = null
    }
    setBiggerDisplayOpen(false)
  }

  function handleWheelFinish() {
    const pick = wheelSpinTarget.pick
    setSelected(pick)
    setAnimating(false)
    setWheelSpinTarget((prev) => ({ ...prev, spinning: false }))

    if (opts.mode === 'prize-giving') {
      // Record prize result immediately (same as finish() for other themes)
      const awarded = new Set(prizeResults.map((r) => r.prizeId).filter(Boolean))
      const nextPrize = opts.prizes.slice().reverse().find((p) => !awarded.has(p.id))
      if (nextPrize) {
        setPrizeResults((prev) => [...prev, { name: pick, prizeId: nextPrize.id, prize: { emoji: nextPrize.emoji, label: nextPrize.label } }])
      }
      // Defer people removal so winner stays on wheel until display closes
      pendingWheelRemovalRef.current = pick
      return
    }

    if (biggerDisplayOpen) {
      pendingWheelRemovalRef.current = pick
    } else {
      applyWheelRemoval(pick)
    }
  }

  function handleSelect() {
    if (animating) return
    const pool = opts.allowDuplicates
      ? people
      : people.filter((p) => !previouslySelected.includes(p))
    if (pool.length === 0) return

    const pick = pool[Math.floor(Math.random() * pool.length)]

    // Fortune wheel: hand off to the canvas spinner
    if (opts.theme === 'fortune-wheel') {
      const targetIndex = pool.indexOf(pick)
      setWheelSpinTarget({ pick, targetIndex, spinning: true })
      setAnimating(true)
      if (opts.biggerSelectDisplay) setBiggerDisplayOpen(true)
      return
    }

    if (opts.biggerSelectDisplay) setBiggerDisplayOpen(true)
    const rand = () => pool[Math.floor(Math.random() * pool.length)]
    skipRef.current = false

    function finish() {
      skipRef.current = false
      if (opts.mode === 'prize-giving') {
        const awarded = new Set(prizeResults.map((r) => r.prizeId).filter(Boolean))
        const nextPrize = opts.prizes.slice().reverse().find((p) => !awarded.has(p.id))
        if (!nextPrize) return
        setPrizeResults((prev) => [...prev, { name: pick, prizeId: nextPrize.id, prize: { emoji: nextPrize.emoji, label: nextPrize.label } }])
        setPeople((prev) => prev.filter((p) => p !== pick))
        setSelected(pick)
        setAnimating(false)
        return
      }
      setSelected(pick)
      setAnimating(false)
      if (opts.removeAfterSelected) {
        setPeople((prev) => prev.filter((p) => p !== pick))
        setPreviouslySelected((prev) => [...prev, pick])
      } else if (!opts.allowDuplicates) {
        setPreviouslySelected((prev) => [...prev, pick])
      }
    }

    if (opts.animation) {
      setAnimating(true)
      let step = 0
      const steps = 20

      if (opts.theme === 'slot-machine') {
        setReels([{ tick: 0, name: rand() }, { tick: 0, name: rand() }, { tick: 0, name: rand() }])
        function cycleSM() {
          if (skipRef.current) {
            setReels([{ tick: step, name: pick }, { tick: step, name: pick }, { tick: step, name: pick }])
            finish()
            return
          }
          step++
          const delay = 60 + (step / steps) ** 2 * 240
          setReels((prev) => [
            step < 14  ? { tick: step, name: rand() } : step === 14 ? { tick: step, name: pick } : prev[0],
            step < 17  ? { tick: step, name: rand() } : step === 17 ? { tick: step, name: pick } : prev[1],
            step < 20  ? { tick: step, name: rand() } : step === 20 ? { tick: step, name: pick } : prev[2],
          ])
          if (step < steps) setTimeout(cycleSM, delay)
          else finish()
        }
        cycleSM()
      } else {
        function cycle() {
          if (skipRef.current) {
            finish()
            return
          }
          if (step < steps) {
            setSlotTick((t) => t + 1)
            setSelected(rand())
            step++
            setTimeout(cycle, 60 + (step / steps) ** 2 * 240)
          } else {
            finish()
          }
        }
        cycle()
      }
    } else {
      finish()
    }
  }

  function handleSkip() {
    if (!animating) return
    if (opts.theme === 'fortune-wheel') {
      handleWheelFinish()
      return
    }
    skipRef.current = true
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleAdd()
  }

  const title = slug
    ? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Fair Select'
  document.title = title

  const pool = opts.allowDuplicates
    ? people
    : people.filter((p) => !previouslySelected.includes(p))

  const isPrizeMode = opts.mode === 'prize-giving'
  const isFortuneWheel = opts.theme === 'fortune-wheel'
  const awardedPrizeIds = new Set(prizeResults.map((r) => r.prizeId).filter(Boolean))
  const allPrizesGiven = isPrizeMode && opts.prizes.length > 0 && opts.prizes.every((p) => awardedPrizeIds.has(p.id))
  const currentPrize = isPrizeMode && !allPrizesGiven
    ? (opts.prizes.slice().reverse().find((p) => !awardedPrizeIds.has(p.id)) ?? null)
    : null

  const selectLabel = isPrizeMode && currentPrize
    ? `${currentPrize.emoji} Select ${currentPrize.label} Winner`
    : isFortuneWheel ? '🎡 Spin the Wheel!'
    : '🎲 Select!'

  return (
    <>
      <CssBaseline />
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: { xs: 2, sm: 4 },
      }}>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper elevation={8} sx={{
          borderRadius: 4,
          p: { xs: 3, sm: 4 },
          width: '100%',
          maxWidth: { xs: 480, md: 720 },
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
        }}>

          {/* Title */}
          <Typography variant="h5" sx={{ fontWeight: 700, textAlign: 'center', color: '#4c3a8e', letterSpacing: '0.03em' }}>
            ✦ {title} ✦
          </Typography>
          {!slug && (
            <Typography variant="body2" sx={{ textAlign: 'center', color: '#7a6aaa', mt: -1.5 }}>
              Your customized random person picker and draw selector
            </Typography>
          )}

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onChange={(_, v) => {
              setActiveTab(v)
              if (v === 0) { setOpts((prev) => ({ ...prev, mode: 'standard' })); setSelected(null) }
              if (v === 1) { setOpts((prev) => ({ ...prev, mode: 'prize-giving' })); setSelected(null) }
            }}
            variant={isMobile ? 'scrollable' : 'standard'}
            centered={!isMobile}
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{ mt: -1, mb: -0.5, '& .MuiTab-root': { fontSize: '0.8rem', minHeight: 40 } }}
          >
            <Tab label="🎯 Standard" />
            <Tab label="🏆 Prize Draw" />
            <Tab label="⚙ Settings" />
          </Tabs>

          {/* ── Main content (tabs 0-1) ── */}
          {activeTab !== 2 && <>

          {/* Prize Setup Box */}
          {isPrizeMode && (
            <Paper variant="outlined" sx={{ borderRadius: 2, p: 1.5, borderColor: '#d4c5f9', background: '#f5f0ff' }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="caption" sx={{ color: '#6a5acd', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  🏆 Prizes
                </Typography>
                {prizeEditMode ? (
                  <IconButton size="small" onClick={() => setPrizeEditMode(false)} sx={{ color: '#6a5acd' }}>
                    <LockIcon fontSize="small" />
                  </IconButton>
                ) : (
                  <IconButton size="small" onClick={() => setPrizeEditMode(true)} sx={{ color: '#6a5acd' }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                )}
              </Stack>

              {prizeEditMode ? (
                <>
                  <DndContext
                    collisionDetection={closestCenter}
                    onDragEnd={({ active, over }) => {
                      if (active.id !== over?.id) {
                        const oldIdx = opts.prizes.findIndex((p) => p.id === active.id)
                        const newIdx = opts.prizes.findIndex((p) => p.id === over.id)
                        setOpts((prev) => ({ ...prev, prizes: arrayMove(prev.prizes, oldIdx, newIdx) }))
                      }
                    }}
                  >
                    <SortableContext items={opts.prizes.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                      <Stack spacing={0.75}>
                        {opts.prizes.map((prize, i) => (
                          <SortablePrizeRow
                            key={prize.id}
                            prize={prize}
                            onLabelChange={(e) => updatePrize(i, { label: e.target.value })}
                            onEmojiChange={(val) => updatePrize(i, { emoji: val })}
                            onDelete={() => setOpts((prev) => ({ ...prev, prizes: prev.prizes.filter((_, j) => j !== i) }))}
                          />
                        ))}
                      </Stack>
                    </SortableContext>
                  </DndContext>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => setOpts((prev) => ({ ...prev, prizes: [...prev.prizes, { id: `prize-${Date.now()}`, emoji: '⭐', label: 'New Prize' }] }))}
                    sx={{ mt: 1, color: '#6a5acd', textTransform: 'none' }}
                  >
                    Add prize
                  </Button>
                </>
              ) : (
                <Stack spacing={0.5}>
                  {opts.prizes.map((prize) => (
                    <Stack key={prize.id} direction="row" spacing={1} alignItems="center" sx={{ py: 0.25 }}>
                      <Typography sx={{ fontSize: '1.2rem', lineHeight: 1 }}>{prize.emoji}</Typography>
                      <Typography sx={{ fontSize: '0.9rem', fontWeight: 500, color: '#3a2d6e' }}>{prize.label}</Typography>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Paper>
          )}

          {/* Current prize banner */}
          {isPrizeMode && (
            <Box sx={{
              textAlign: 'center',
              borderRadius: 3,
              py: 1.5,
              px: 2,
              background: allPrizesGiven
                ? 'linear-gradient(135deg, #d4f8e8 0%, #b2f0d8 100%)'
                : 'linear-gradient(135deg, #f5f0ff 0%, #ede0ff 100%)',
              border: allPrizesGiven ? '1.5px solid #6fcf97' : '1.5px solid #c4a8f8',
            }}>
              {allPrizesGiven ? (
                <Typography sx={{ fontWeight: 700, color: '#27ae60', fontSize: '1rem' }}>
                  🎉 All prizes awarded!
                </Typography>
              ) : currentPrize ? (
                <>
                  <Typography variant="caption" sx={{ color: '#7a5acd', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', mb: 0.25 }}>
                    Now drawing for
                  </Typography>
                  <Typography sx={{ fontSize: '1.5rem', lineHeight: 1.2 }}>{currentPrize.emoji}</Typography>
                  <Typography sx={{ fontWeight: 700, color: '#4a2fa0', fontSize: '1rem' }}>{currentPrize.label}</Typography>
                </>
              ) : null}
            </Box>
          )}

          {/* Input row */}
          <Stack direction="row" spacing={1}>
            <TextField
              fullWidth
              size="small"
              placeholder="Enter name or names separated by ;"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button
              variant="contained"
              onClick={handleAdd}
              sx={{ whiteSpace: 'nowrap', bgcolor: '#667eea', '&:hover': { bgcolor: '#5570d8' } }}
            >
              Add
            </Button>
          </Stack>

          {/* People list */}
          <Box>
            <Button
              fullWidth
              onClick={() => setPeopleOpen((v) => !v)}
              endIcon={<ExpandMoreIcon sx={{ transform: peopleOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />}
              sx={{ justifyContent: 'space-between', color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.06em', fontWeight: 600, '&:hover': { bgcolor: 'transparent', color: 'text.primary' } }}
            >
              Selection Pool ({people.length})
            </Button>
            <Collapse in={peopleOpen}>
              {people.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.disabled', textAlign: 'center', py: 1 }}>
                  No entries added yet.
                </Typography>
              ) : (
                <List dense disablePadding sx={{ mt: 0.5 }}>
                  {people.map((name) => (
                    <ListItem
                      key={name}
                      sx={{
                        bgcolor: '#f7f7fb', borderRadius: 2, mb: 0.5,
                        opacity: (!opts.allowDuplicates && previouslySelected.includes(name)) ? 0.45 : 1,
                        '&:hover': { bgcolor: '#eeeef8' },
                      }}
                      secondaryAction={
                        <IconButton size="small" edge="end" onClick={() => handleRemove(name)} aria-label={`Remove ${name}`}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      <ListItemText primary={name} />
                    </ListItem>
                  ))}
                </List>
              )}
            </Collapse>
          </Box>

          {/* Select / Spin button */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Button
              variant="contained"
              size="large"
              disabled={pool.length === 0 || animating || allPrizesGiven}
              onClick={handleSelect}
              sx={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                borderRadius: '50px',
                px: 4,
                fontSize: '1.1rem',
                boxShadow: '0 4px 15px rgba(240,100,120,0.4)',
                '&:hover': { background: 'linear-gradient(135deg, #e080f0 0%, #e04460 100%)', boxShadow: '0 6px 20px rgba(240,100,120,0.5)' },
                '&.Mui-disabled': { background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', opacity: 0.4, color: 'white' },
              }}
            >
              {selectLabel}
            </Button>
            {animating && (
              <Button
                size="small"
                onClick={handleSkip}
                sx={{ color: 'text.secondary', textTransform: 'none', fontSize: '0.75rem' }}
              >
                ⏭ Skip animation
              </Button>
            )}
          </Box>

          {/* Result */}
          <>
            {opts.biggerSelectDisplay && biggerDisplayOpen && (
              <Box
                onClick={() => { if (!animating) closeBiggerDisplay() }}
                sx={{
                  position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.65)', zIndex: 1200,
                  cursor: animating ? 'default' : 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
                  pt: 6, pb: 6,
                }}
              >
                {/* Current prize indicator */}
                {isPrizeMode && (
                  <Box sx={{
                    textAlign: 'center',
                    bgcolor: 'rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    borderRadius: 3,
                    px: 4, py: 2,
                  }}>
                    {allPrizesGiven ? (
                      <Typography sx={{ fontWeight: 700, color: '#6fcf97', fontSize: '1.1rem' }}>
                        🎉 All prizes awarded!
                      </Typography>
                    ) : currentPrize ? (
                      <>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
                          Now drawing for
                        </Typography>
                        <Typography sx={{ fontSize: '2.5rem', lineHeight: 1 }}>{currentPrize.emoji}</Typography>
                        <Typography sx={{ fontWeight: 700, color: 'white', fontSize: '1.2rem', mt: 0.5 }}>{currentPrize.label}</Typography>
                      </>
                    ) : null}
                  </Box>
                )}
                {!isPrizeMode && <Box />}

                {!animating && (
                  <Typography sx={{
                    color: 'rgba(255,255,255,0.9)',
                    fontSize: '0.8rem',
                    letterSpacing: '0.08em',
                    userSelect: 'none',
                    bgcolor: 'rgba(0,0,0,0.45)',
                    px: 2, py: 0.75,
                    borderRadius: 2,
                  }}>
                    Click anywhere to return to the main screen.
                  </Typography>
                )}
                {animating && <Box />}
              </Box>
            )}
            <Box
              onClick={() => { if (opts.biggerSelectDisplay && biggerDisplayOpen && !animating) closeBiggerDisplay() }}
              sx={opts.biggerSelectDisplay && biggerDisplayOpen ? (isFortuneWheel ? {
                position: 'fixed', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1300, width: 360,
                cursor: animating ? 'default' : 'pointer',
              } : {
                position: 'fixed', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%) scale(1.6)',
                zIndex: 1300, width: 420,
                cursor: animating ? 'default' : 'pointer',
              }) : {}}
            >
              {/* ── Selection display — always themed ── */}
              {isFortuneWheel ? (
                <>
                  <FortuneWheel
                    pool={pool}
                    spinning={!!wheelSpinTarget?.spinning}
                    targetIndex={wheelSpinTarget?.targetIndex ?? null}
                    onSpinEnd={handleWheelFinish}
                  />
                  <Paper elevation={0} sx={{
                    background: 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)',
                    border: '2px solid #f9ca24', borderRadius: 3, p: 2,
                    textAlign: 'center', color: '#5a3e00', mt: 1,
                  }}>
                    {selected && !animating ? (
                      <>
                        <Typography component="span" sx={{ fontWeight: 600 }}>🎡 Winner:</Typography>{' '}
                        <Typography component="span" sx={{ fontWeight: 700, fontSize: '1.3rem' }}>🎉 {selected}</Typography>
                      </>
                    ) : (
                      <Typography sx={{ color: '#9a8040', fontStyle: 'italic' }}>
                        {animating ? '🎡 Spinning…' : 'Ready to spin…'}
                      </Typography>
                    )}
                  </Paper>
                </>
              ) : !selected && !animating ? (
                pool.length > 0 ? (
                  <Paper elevation={0} sx={{
                    background: 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)',
                    border: '2px solid #f9ca24', borderRadius: 3, p: 2,
                    textAlign: 'center', color: '#5a3e00',
                  }}>
                    <Typography sx={{ color: '#9a8040', fontStyle: 'italic' }}>Ready to select…</Typography>
                  </Paper>
                ) : null
              ) : opts.theme === 'typewriter' ? (
                <Box className="typewriter-result" sx={{ animation: animating ? 'pulse-scale 0.2s ease-in-out infinite' : 'none' }}>
                  {!animating && <Typography className="typewriter-label">Selected</Typography>}
                  <Typography className="typewriter-name">
                    {animating ? selected : typewriterText}
                    <span className={`typewriter-cursor${typewriterDone ? ' typewriter-cursor--blink' : ''}`}>|</span>
                  </Typography>
                </Box>
              ) : opts.theme === 'retro-arcade' ? (
                <Box className="arcade-result" sx={{ animation: animating ? 'pulse-scale 0.2s ease-in-out infinite' : 'arcade-flicker 4s infinite' }}>
                  <Typography className="arcade-label">✦ WINNER ✦</Typography>
                  <Typography className="arcade-name">{selected}</Typography>
                  {!animating && <Typography className="arcade-cursor">▋</Typography>}
                </Box>
              ) : opts.theme === 'slot-machine' ? (
                <Box sx={{
                  background: '#1a1035',
                  border: animating ? '3px solid #444' : '3px solid #f9ca24',
                  borderRadius: 3, p: 1.5, textAlign: 'center',
                  boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.6)',
                  animation: !animating ? 'winner-glow 1.6s ease-in-out infinite' : 'none',
                }}>
                  <Typography sx={{ fontSize: '1rem', letterSpacing: '0.15em', color: '#666', mb: 0.75 }}>🎰</Typography>
                  <Box sx={{ display: 'flex', gap: '6px' }}>
                    {reels.map((reel, i) => (
                      <Box key={i} sx={{ flex: 1, minWidth: 0 }} className={i === 1 ? 'slot-reel--center' : ''}>
                        <div className="slot-viewport">
                          <div className="slot-line slot-line--top" />
                          <div className="slot-line slot-line--bottom" />
                          <span key={reel.tick} className="slot-name">{reel.name}</span>
                        </div>
                      </Box>
                    ))}
                  </Box>
                  {!animating && (
                    <Typography sx={{ mt: 0.75, fontSize: '0.88rem', fontWeight: 700, color: '#f9ca24', letterSpacing: '0.06em', textShadow: '0 0 8px rgba(249,202,36,0.6)' }}>
                      🎉 {selected}
                    </Typography>
                  )}
                </Box>
              ) : (
                <Paper elevation={0} sx={{
                  background: 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)',
                  border: '2px solid #f9ca24', borderRadius: 3, p: 2,
                  textAlign: 'center', color: '#5a3e00',
                  animation: animating ? 'pulse-scale 0.2s ease-in-out infinite' : 'none',
                }}>
                  {selected ? (
                    <>
                      <Typography component="span" sx={{ fontWeight: 600 }}>Selected:</Typography>{' '}
                      <Typography component="span" sx={{ fontWeight: 700, fontSize: '1.3rem' }}>🎉 {selected}</Typography>
                    </>
                  ) : pool.length > 0 ? (
                    <Typography sx={{ color: '#9a8040', fontStyle: 'italic' }}>Ready to select…</Typography>
                  ) : null}
                </Paper>
              )}

              {/* ── Standard mode: reset/redraw when all people used up ── */}
              {!isPrizeMode && people.length === 0 && previouslySelected.length > 0 && (
                <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 1.5 }}>
                  <Tooltip title="Clear all people and selections" arrow>
                    <Button size="small" variant="outlined" color="error" onClick={handleStandardReset} sx={{ textTransform: 'none', fontSize: '0.8rem' }}>
                      Reset
                    </Button>
                  </Tooltip>
                  <Tooltip title="Move everyone back to the people list and draw again" arrow>
                    <Button size="small" variant="outlined" onClick={handleStandardRedraw} sx={{ textTransform: 'none', fontSize: '0.8rem', borderColor: '#667eea', color: '#667eea', '&:hover': { borderColor: '#5570d8', bgcolor: '#eef0ff' } }}>
                      Redraw
                    </Button>
                  </Tooltip>
                </Stack>
              )}

            </Box>
          </>

          {/* ── Prize results list — outside bigger-display Box so it stays visible ── */}
          {isPrizeMode && prizeResults.length > 0 && (
            <Box className="prize-result">
              {prizeResults.slice().reverse().map((r, i) => (
                <Box key={i} className="prize-result-row">
                  <Typography className="prize-result-medal">{r.prize.emoji}</Typography>
                  <Box>
                    <Typography className="prize-result-label">{r.prize.label}</Typography>
                    <Typography className="prize-result-name">{r.name}</Typography>
                  </Box>
                </Box>
              ))}
              {allPrizesGiven && (
                <Box sx={{ textAlign: 'center', pt: 0.5 }}>
                  <Typography className="prize-result-done">🎉 All prizes awarded!</Typography>
                  <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 1 }}>
                    <Tooltip title="Clear all people and results, restore default prizes" arrow>
                      <Button size="small" variant="outlined" color="error" onClick={handlePrizeReset} sx={{ textTransform: 'none', fontSize: '0.8rem' }}>
                        Reset
                      </Button>
                    </Tooltip>
                    <Tooltip title="Keep prizes, move everyone back to the people list and draw again" arrow>
                      <Button size="small" variant="outlined" onClick={handlePrizeRedraw} sx={{ textTransform: 'none', fontSize: '0.8rem', borderColor: '#6a5acd', color: '#6a5acd', '&:hover': { borderColor: '#5548b0', bgcolor: '#f5f0ff' } }}>
                        Redraw
                      </Button>
                    </Tooltip>
                  </Stack>
                </Box>
              )}
            </Box>
          )}

          {/* Previously Selected (hidden in prize giving mode) */}
          {!isPrizeMode && previouslySelected.length > 0 && (
            <Box>
              <Divider sx={{ mb: 0.5 }} />
              <Button
                fullWidth
                onClick={() => setPrevOpen((v) => !v)}
                endIcon={<ExpandMoreIcon sx={{ transform: prevOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />}
                sx={{ justifyContent: 'space-between', color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.06em', fontWeight: 600, '&:hover': { bgcolor: 'transparent', color: 'text.primary' } }}
              >
                Previously Selected ({previouslySelected.length})
              </Button>
              <Collapse in={prevOpen}>
                <List dense disablePadding sx={{ mt: 0.5 }}>
                  {previouslySelected.map((name, i) => (
                    <ListItem
                      key={i}
                      sx={{ bgcolor: '#f0f0f0', borderRadius: 2, mb: 0.5, opacity: 0.7, '&:hover': { bgcolor: '#e8e8e8', opacity: 1 } }}
                      secondaryAction={
                        <IconButton size="small" edge="end" onClick={() => handleAddBack(name, i)} aria-label={`Add ${name} back`}>
                          <AddIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      <ListItemText primary={name} primaryTypographyProps={{ color: 'text.secondary' }} />
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </Box>
          )}

          </>}

          {/* ── Settings tab ── */}
          {activeTab === 2 && (
            <Stack spacing={2} sx={{ overflowY: 'auto', maxHeight: { xs: '60vh', md: 'none' }, pt: 1.5 }}>
              <FormControl size="small">
                <InputLabel>Select Theme</InputLabel>
                <Select
                  value={opts.theme}
                  label="Select Theme"
                  onChange={(e) => setOpts((prev) => ({ ...prev, theme: e.target.value }))}
                >
                  <MenuItem value="standard">🎯 Standard</MenuItem>
                  <MenuItem value="fortune-wheel">🎡 Fortune Wheel</MenuItem>
                  <MenuItem value="slot-machine">🎰 Slot Machine</MenuItem>
                  <MenuItem value="retro-arcade">🕹️ Retro Arcade</MenuItem>
                  <MenuItem value="typewriter">🖊️ Typewriter</MenuItem>
                </Select>
              </FormControl>

              <FormGroup sx={{ gap: 0.75, pl: 1 }}>
                {[
                  ['animation', 'Animation'],
                  ['biggerSelectDisplay', 'Bigger selecting display'],
                  ['removeAfterSelected', 'Remove after selected'],
                  ['allowDuplicates', 'Allow duplicates'],
                  ['saveToLocalStorage', 'Save to local storage'],
                ].map(([key, label]) => (
                  <FormControlLabel
                    key={key}
                    control={
                      <Switch
                        size="small"
                        checked={opts[key]}
                        onChange={() => toggleOpt(key)}
                        sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#667eea' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#667eea' } }}
                      />
                    }
                    label={<Typography variant="body2">{label}</Typography>}
                  />
                ))}
              </FormGroup>

              <Divider />

              <Button
                color="error"
                size="small"
                sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
                onClick={() => setConfirmReset(true)}
              >
                ↺ Reset all data
              </Button>
            </Stack>
          )}

        </Paper>
        </Box>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', pt: 3, pb: 1 }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block', mb: 0.5 }}>
            © 2026 TL Lab. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5 }}>
            <Typography
              component="a"
              href="/privacy"
              variant="caption"
              sx={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', '&:hover': { color: 'white' } }}
            >
              Privacy
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)' }}>·</Typography>
            <Typography
              component="a"
              href="/terms"
              variant="caption"
              sx={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', '&:hover': { color: 'white' } }}
            >
              Terms of Service
            </Typography>
          </Box>
        </Box>

        {/* Confirm Reset Dialog */}
        <Dialog open={confirmReset} onClose={() => setConfirmReset(false)}>
          <DialogContent>
            <DialogContentText>Clear all people and selections?</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmReset(false)}>Cancel</Button>
            <Button color="error" variant="contained" onClick={handleReset}>Reset</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  )
}
