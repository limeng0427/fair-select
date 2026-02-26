import { useState, useEffect, useRef } from 'react'
import {
  Box,
  Button,
  Checkbox,
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
  TextField,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
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

const DEFAULT_OPTS = {
  animation: true,
  removeAfterSelected: true,
  allowDuplicates: false,
  saveToLocalStorage: true,
  biggerSelectDisplay: false,
  theme: 'standard',
}

export default function App() {
  const saved = loadSaved()

  const [people, setPeople] = useState(saved?.people ?? [])
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
  const [optsOpen, setOptsOpen] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [opts, setOpts] = useState({ ...DEFAULT_OPTS, ...(saved?.opts ?? {}) })
  const [typewriterText, setTypewriterText] = useState('')
  const [typewriterDone, setTypewriterDone] = useState(false)
  const typewriterRef = useRef(null)
  const [biggerDisplayOpen, setBiggerDisplayOpen] = useState(false)

  useEffect(() => {
    if (!opts.saveToLocalStorage) {
      // Keep opts + UI state but clear people/selection data
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ opts, prevOpen }))
      return
    }
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ people, previouslySelected, selected, opts, prevOpen }),
    )
  }, [people, previouslySelected, selected, opts, prevOpen])

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
    const name = inputValue.trim()
    if (!name || people.includes(name)) return
    if (!opts.allowDuplicates && previouslySelected.includes(name)) return
    setPeople([...people, name])
    setInputValue('')
  }

  function handleReset() {
    setPeople([])
    setPreviouslySelected([])
    setSelected(null)
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

  function handleSelect() {
    if (animating) return
    const pool = opts.allowDuplicates
      ? people
      : people.filter((p) => !previouslySelected.includes(p))
    if (pool.length === 0) return
    if (opts.biggerSelectDisplay) setBiggerDisplayOpen(true)
    const pick = pool[Math.floor(Math.random() * pool.length)]
    const rand = () => pool[Math.floor(Math.random() * pool.length)]

    function finish() {
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
          step++
          const delay = 60 + (step / steps) ** 2 * 240
          setReels((prev) => [
            step < 14  ? { tick: step, name: rand() }
              : step === 14 ? { tick: step, name: pick }
              : prev[0],
            step < 17  ? { tick: step, name: rand() }
              : step === 17 ? { tick: step, name: pick }
              : prev[1],
            step < 20  ? { tick: step, name: rand() }
              : step === 20 ? { tick: step, name: pick }
              : prev[2],
          ])
          if (step < steps) setTimeout(cycleSM, delay)
          else finish()
        }
        cycleSM()
      } else {
        function cycle() {
          if (step < steps) {
            setSlotTick((t) => t + 1)
            setSelected(rand())
            step++
            const delay = 60 + (step / steps) ** 2 * 240
            setTimeout(cycle, delay)
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

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleAdd()
  }

  const title = slug
    ? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Fair Select'

  const pool = opts.allowDuplicates
    ? people
    : people.filter((p) => !previouslySelected.includes(p))

  return (
    <>
      <CssBaseline />
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: { xs: 2, sm: 4 },
      }}>
        <Paper elevation={8} sx={{
          borderRadius: 4,
          p: { xs: 3, sm: 4 },
          width: '100%',
          maxWidth: 480,
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
        }}>

          {/* Title */}
          <Typography variant="h5" sx={{
            fontWeight: 700,
            textAlign: 'center',
            color: '#4c3a8e',
            letterSpacing: '0.03em',
          }}>
            ✦ {title} ✦
          </Typography>

          {/* Input row */}
          <Stack direction="row" spacing={1}>
            <TextField
              fullWidth
              size="small"
              placeholder="Enter a name..."
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

          {/* People section */}
          <Box>
            <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              People ({people.length})
            </Typography>
            {people.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'text.disabled', textAlign: 'center', py: 1 }}>
                No people added yet.
              </Typography>
            ) : (
              <List dense disablePadding>
                {people.map((name) => (
                  <ListItem
                    key={name}
                    sx={{
                      bgcolor: '#f7f7fb',
                      borderRadius: 2,
                      mb: 0.5,
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
          </Box>

          {/* Select button */}
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              size="large"
              disabled={pool.length === 0 || animating}
              onClick={handleSelect}
              sx={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                borderRadius: '50px',
                px: 4,
                fontSize: '1.1rem',
                boxShadow: '0 4px 15px rgba(240,100,120,0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #e080f0 0%, #e04460 100%)',
                  boxShadow: '0 6px 20px rgba(240,100,120,0.5)',
                },
                '&.Mui-disabled': {
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  opacity: 0.4,
                  color: 'white',
                },
              }}
            >
              🎲 Select!
            </Button>
          </Box>

          {/* Result */}
          {selected && (
            <>
              {opts.biggerSelectDisplay && biggerDisplayOpen && (
                <Box
                  onClick={() => { if (!animating) setBiggerDisplayOpen(false) }}
                  sx={{
                    position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.65)', zIndex: 1200,
                    cursor: animating ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'flex-end', justifyContent: 'center', pb: 6,
                  }}
                >
                  {!animating && (
                    <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', letterSpacing: '0.08em', userSelect: 'none' }}>
                      click to dismiss
                    </Typography>
                  )}
                </Box>
              )}
              <Box sx={opts.biggerSelectDisplay && biggerDisplayOpen ? {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) scale(1.6)',
                zIndex: 1300,
                width: 420,
              } : {}}>
                {opts.theme === 'typewriter' ? (
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
                    borderRadius: 3,
                    p: 1.5,
                    textAlign: 'center',
                    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.6)',
                    animation: !animating ? 'winner-glow 1.6s ease-in-out infinite' : 'none',
                  }}>
                    <Typography sx={{ fontSize: '1rem', letterSpacing: '0.15em', color: '#666', mb: 0.75 }}>
                      🎰
                    </Typography>
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
                      <Typography sx={{
                        mt: 0.75,
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        color: '#f9ca24',
                        letterSpacing: '0.06em',
                        textShadow: '0 0 8px rgba(249,202,36,0.6)',
                      }}>
                        🎉 {selected}
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Paper elevation={0} sx={{
                    background: 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)',
                    border: '2px solid #f9ca24',
                    borderRadius: 3,
                    p: 2,
                    textAlign: 'center',
                    color: '#5a3e00',
                    animation: animating ? 'pulse-scale 0.2s ease-in-out infinite' : 'none',
                  }}>
                    <Typography component="span" sx={{ fontWeight: 600 }}>Selected:</Typography>{' '}
                    <Typography component="span" sx={{ fontWeight: 700, fontSize: '1.3rem' }}>🎉 {selected}</Typography>
                  </Paper>
                )}
              </Box>
            </>
          )}

          {/* Previously Selected */}
          {previouslySelected.length > 0 && (
            <Box>
              <Divider sx={{ mb: 0.5 }} />
              <Button
                fullWidth
                onClick={() => setPrevOpen((v) => !v)}
                endIcon={
                  <ExpandMoreIcon sx={{
                    transform: prevOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                  }} />
                }
                sx={{
                  justifyContent: 'space-between',
                  color: 'text.secondary',
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  letterSpacing: '0.06em',
                  fontWeight: 600,
                  '&:hover': { bgcolor: 'transparent', color: 'text.primary' },
                }}
              >
                Previously Selected ({previouslySelected.length})
              </Button>
              <Collapse in={prevOpen}>
                <List dense disablePadding sx={{ mt: 0.5 }}>
                  {previouslySelected.map((name, i) => (
                    <ListItem
                      key={i}
                      sx={{
                        bgcolor: '#f0f0f0',
                        borderRadius: 2,
                        mb: 0.5,
                        opacity: 0.7,
                        '&:hover': { bgcolor: '#e8e8e8', opacity: 1 },
                      }}
                      secondaryAction={
                        <IconButton size="small" edge="end" onClick={() => handleAddBack(name, i)} aria-label={`Add ${name} back`}>
                          <AddIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={name}
                        primaryTypographyProps={{ color: 'text.secondary' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </Box>
          )}

          {/* Options drawer */}
          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 0.5 }}>
            <Button
              fullWidth
              onClick={() => setOptsOpen((v) => !v)}
              endIcon={
                <ExpandMoreIcon sx={{
                  transform: optsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }} />
              }
              sx={{
                justifyContent: 'space-between',
                color: 'text.secondary',
                textTransform: 'uppercase',
                fontSize: '0.8rem',
                letterSpacing: '0.06em',
                fontWeight: 600,
                '&:hover': { color: '#667eea', bgcolor: 'transparent' },
              }}
            >
              ⚙ Options
            </Button>
            <Collapse in={optsOpen}>
              <Stack spacing={1} sx={{ pt: 1, pb: 0.5 }}>
                <FormControl size="small">
                  <InputLabel>Theme</InputLabel>
                  <Select
                    value={opts.theme}
                    label="Theme"
                    onChange={(e) => setOpts((prev) => ({ ...prev, theme: e.target.value }))}
                  >
                    <MenuItem value="standard">🎯 Standard</MenuItem>
                    <MenuItem value="slot-machine">🎰 Slot Machine</MenuItem>
                    <MenuItem value="retro-arcade">🕹️ Retro Arcade</MenuItem>
                    <MenuItem value="typewriter">🖊️ Typewriter</MenuItem>
                  </Select>
                </FormControl>

                <FormGroup>
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
                        <Checkbox
                          size="small"
                          checked={opts[key]}
                          onChange={() => toggleOpt(key)}
                          sx={{ color: '#667eea', '&.Mui-checked': { color: '#667eea' } }}
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
            </Collapse>
          </Box>
        </Paper>

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
