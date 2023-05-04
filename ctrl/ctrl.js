// ~ WEBSOCKET THINGS ~

let id = null

const ws_address = `wss://capogreco-omni.deno.dev`
// const ws_address = `ws://localhost/`

const socket = new WebSocket (ws_address)

socket.addEventListener (`message`, msg => {
   const obj = JSON.parse (msg.data)
   switch (obj.type) {
      case `id`:
         id = obj.body
         console.log (`identity is ${ id }`)
         const msg = {
            type: `request_control`,
            body: id,
         }
         socket.send (JSON.stringify (msg))
         break
      case `sockets`:
         socket_list.textContent = ``
         obj.body.forEach (e => {
            const div = document.createElement (`div`)
            div.innerText = e[0]
            div.style.width = `100%`
            div.style.color  = e[1].joined ? `white` : `grey`
            socket_list.appendChild (div)
         })
         break
   }
})

socket.addEventListener ('open', msg => {
   console.log (`websocket at ${ msg.target.url } is ${ msg.type }`)
})


// ~ UI THINGS ~

document.body.style.margin   = 0
document.body.style.overflow = `hidden`
document.body.style.backgroundColor = `indigo`

// let active = false
let total_pressed = []
let show_graphic = false

const socket_list            = document.createElement (`div`)
socket_list.style.font       = `14 px`
socket_list.style.fontFamily = 'monospace'
socket_list.style.color      = `white`
socket_list.style.display    = `block`
socket_list.style.position   = `fixed`
socket_list.style.width      = `${ window.innerWidth }px`
socket_list.style.height     = `${ window.innerHeight }px`
socket_list.style.left       = 0
socket_list.style.top        = 0
document.body.appendChild (socket_list)

const tempo_display                = document.createElement (`div`)
tempo_display.style.font           = `14 px`
tempo_display.style.fontFamily     = 'monospace'
tempo_display.style.color          = `white`
tempo_display.style.display        = `block`
tempo_display.style.position       = `fixed`
tempo_display.style.width          = `${ window.innerWidth }px`
tempo_display.style.height         = `${ window.innerHeight }px`
tempo_display.style.left           = 0
tempo_display.style.top            = 0
document.body.appendChild (tempo_display)

const bpm_display = document.createElement (`div`)
bpm_display.style.textAlign  = 'end'
bpm_display.innerText        = `120.00 bpm`
bpm_display.style.width      = `100%`
tempo_display.appendChild (bpm_display)

const sub_display = document.createElement (`div`)
sub_display.style.textAlign  = 'end'
sub_display.innerText        = `2 sub`
sub_display.style.width      = `100%`
tempo_display.appendChild (sub_display)

const octaves_display = document.createElement (`div`)
octaves_display.style.textAlign  = 'end'
octaves_display.innerText        = `1 oct`
octaves_display.style.width      = `100%`
tempo_display.appendChild (octaves_display)

const port_display = document.createElement (`div`)
port_display.style.textAlign  = 'end'
port_display.innerText        = `0 por`
port_display.style.width      = `100%`
tempo_display.appendChild (port_display)

const bright_display = document.createElement (`div`)
bright_display.style.textAlign  = 'end'
bright_display.innerText        = `1 bri`
bright_display.style.width      = `100%`
tempo_display.appendChild (bright_display)

const reverb_display = document.createElement (`div`)
reverb_display.style.textAlign  = 'end'
reverb_display.innerText        = `0 rev`
reverb_display.style.width      = `100%`
tempo_display.appendChild (reverb_display)

const release_display = document.createElement (`div`)
release_display.style.textAlign  = 'end'
release_display.innerText        = `0 rel`
release_display.style.width      = `100%`
tempo_display.appendChild (release_display)

const mode_display = document.createElement (`div`)
mode_display.style.textAlign  = 'end'
mode_display.innerText        = `stat mod`
mode_display.style.width      = `100%`
tempo_display.appendChild (mode_display)

const modes  = [ `stat` ,`asce` ,`desc` ,`shuf` ,`rand` ]
// let mode_i = 0
const isPlaying_display = document.createElement (`div`)
isPlaying_display.style.textAlign  = 'end'
isPlaying_display.innerText        = `stopped`
isPlaying_display.style.width      = `100%`
tempo_display.appendChild (isPlaying_display)


const cnv = document.getElementById (`cnv`)
cnv.width  = window.innerWidth
cnv.height = window.innerHeight

const mid = {
   x: cnv.width  / 2,
   y: cnv.height / 2
}

const ctx = cnv.getContext (`2d`)

ctx.fillStyle = `deeppink`
ctx.beginPath ()

function check_dimensions () {
   const good_ar = cnv.width / cnv.height > 1.3
   const good_h = cnv.height > 300
   if (good_ar && good_h) {
      show_graphic = true
   }
}

check_dimensions ()

window.onresize = () => {
   location.reload ()
}

const r1 = 100
const r2 = (cnv.height - 100) / 2

const p1_x = cnv.width - (50 + r1)
const p1_y = 50 + r1
const p2_x = 50 + r2
const p2_y = 50 + r2

const x_length = p1_x - p2_x
const rad_inc = (r2 - r1) / x_length
const y_inc = (p2_y - p1_y) / x_length

let rad = r1
let y = p1_y

if (show_graphic) {
   for (let x = p1_x; x > p2_x; x--) {
      ctx.ellipse (x, y, rad, rad, 0, 0, Math.PI * 2)
      y += y_inc
      rad += rad_inc
   }

   ctx.fill ()
   const unit = r1 / 3
   const butt_inc = x_length / 13
   ctx.fillStyle = `turquoise`
   for (let x = p2_x; x < p1_x; x += butt_inc) {
      for (let r = 0; r < 3; r++) {
         const y = 50 + unit + (r * butt_inc)
         ctx.fillRect (x - (r * (butt_inc / 3)), y, butt_inc / 2, butt_inc / 2)
      }
   }
}

// ~ ChordSelector Class ~

class ChordSelector {
   constructor (root, key_array) {
      this.root    = root
      this.keys    = key_array
      this.acc     = 0
      this.pressed = [ 0, 0, 0 ]
      this.chords  = [
         [ 0, 4, 7 ],
         [ 0, 3, 7 ],
         [ 0, 3, 6, 9 ],
         [ 0, 4, 7, 10 ],
         [ 0, 4, 7, 11 ],
         [ 0, 3, 7, 10 ],
         [ 0, 3, 6, 10 ],
      ]
   }

   press (key) {
      const i = this.keys.indexOf (key)

      if (i == -1) return

      this.pressed[i] = 1

      this.acc += 2 ** i
   }

   unpress (key) {
      const i = this.keys.indexOf (key)

      if (i == -1) return

      this.pressed[i] = 0

      if (this.acc && this.pressed.reduce ((a, v) => a + v) == 0) {
         const chord = []
         const down = Math.floor (octaves / 2)
         for (let i = 0; i < octaves; i++) {
            const offset = (i - down) * 12
            this.chords[this.acc - 1].forEach (n => {
               chord.push (this.root + n + offset)
            })
         }
         this.acc = 0
         return chord
      }
      else return false
   }
}

const omni_chord = []

omni_chord.push (new ChordSelector (61, [ '1', 'q', 'a'  ])) // Db4
omni_chord.push (new ChordSelector (68, [ '2', 'w', 's'  ])) // Ab4
omni_chord.push (new ChordSelector (63, [ '3', 'e', 'd'  ])) // Eb4
omni_chord.push (new ChordSelector (70, [ '4', 'r', 'f'  ])) // Bb4
omni_chord.push (new ChordSelector (65, [ '5', 't', 'g'  ])) // F4
omni_chord.push (new ChordSelector (60, [ '6', 'y', 'h'  ])) // C4
omni_chord.push (new ChordSelector (67, [ '7', 'u', 'j'  ])) // G4
omni_chord.push (new ChordSelector (62, [ '8', 'i', 'k'  ])) // D4
omni_chord.push (new ChordSelector (69, [ '9', 'o', 'l'  ])) // A4
omni_chord.push (new ChordSelector (64, [ '0', 'p', ';'  ])) // E4
omni_chord.push (new ChordSelector (71, [ '-', '[', `'`  ])) // B4
omni_chord.push (new ChordSelector (66, [ '=', ']', `\\` ])) // F#4

const taps = [ Date.now () ]

// state

let octaves = 1

const state = {
   type        : `state`,
   active      : false,
   bpm         : 120,
   subdivision : 2,
   portamento  : 0,
   bright      : 1,
   reverb      : 0,
   release     : 0,
   mode_i      : 0,
   chord       : [ 60, 63, 67 ],
}

function tempo_tap () {
   taps.push (Date.now ())

   while (taps.length > 2) {
      taps.splice (0, 1)
   }

   const tap_period = (taps[1] - taps[0]) / 1000

   const bpm_candidate  = (60 / tap_period).toFixed (2)
   if (bpm_candidate > 30) {
      state.bpm = bpm_candidate
      bpm_display.innerText = `${ state.bpm } bpm`
   }
}

document.body.onkeydown = e => {
   e.preventDefault ()

   console.log (e.key)

   if (total_pressed.indexOf (e.key) != -1) return

   total_pressed.push (e.key)

   switch (e.key) {
      case 'Enter':
         state.active = !state.active
         socket.send (JSON.stringify (state))
         isPlaying_display.innerText = state.active ? `playing` : `stopped`
         break
      case ' ':
         tempo_tap ()
         break
      case ',':
         state.subdivision--
         state.subdivision = Math.max (state.subdivision, 0)
         sub_display.innerText = `${ state.subdivision } sub`
         break
      case '.':
         state.subdivision++
         sub_display.innerText = `${ state.subdivision } sub`
         break
      case '>':
         octaves++
         octaves_display.innerText = `${ octaves } oct`
         break
      case '<':
         octaves--
         octaves = Math.max (octaves, 1)
         octaves_display.innerText = `${ octaves } oct`
         break
      case 'z':
         state.mode_i--
         if (state.mode_i < 0) {
            state.mode_i = modes.length - 1
         }
         mode_display.innerText = `${ modes[state.mode_i] } mod`
         break
      case 'x':
         state.mode_i++
         state.mode_i %= modes.length
         mode_display.innerText = `${ modes[state.mode_i] } mod`
         break
      case 'Z':
         state.release--
         state.release = Math.max (state.release, 0)
         release_display.innerText = `${ state.release } rel`
         break
      case 'X':
         state.release++
         release_display.innerText = `${ state.release } rel`
         break
      case 'c':
         state.reverb--
         state.reverb = Math.max (state.reverb, 0)
         reverb_display.innerText = `${ state.reverb } rev`
         break
      case 'v':
         state.reverb++
         state.reverb = Math.min (state.reverb, 8)
         reverb_display.innerText = `${ state.reverb } rev`
         break
      case 'ArrowLeft':
         state.portamento--
         state.portamento = Math.max (state.portamento, 0)
         port_display.innerText = `${ state.portamento } por`
         break
      case 'ArrowRight':
         state.portamento++
         state.portamento = Math.min (state.portamento, 8)
         port_display.innerText = `${ state.portamento } por`
         break
      case 'ArrowDown':
         state.bright--
         state.bright = Math.max (state.bright, 1)
         bright_display.innerText = `${ state.bright } bri`
         break      
      case 'ArrowUp':
         state.bright++
         state.bright = Math.min (state.bright, 12)
         bright_display.innerText = `${ state.bright } bri`
         break
      case '/':
         socket.send (JSON.stringify (state))
         return
   }

   omni_chord.forEach (s => {
      s.press (e.key)
   })

   return false
}


document.body.onkeyup = e => {
   const i = total_pressed.indexOf (e.key)
   total_pressed.splice (i, 1)

   omni_chord.forEach (s => {
      const new_chord = s.unpress (e.key)
      if (new_chord) {
         state.chord = new_chord
         socket.send (JSON.stringify (state))
      }
   })
}
