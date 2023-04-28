// ~ WEBSOCKET THINGS ~
let id = null
const ws_address = `wss://capogreco-omni.deno.dev`
// const ws_address = `ws://localhost/`

const socket = new WebSocket (ws_address)

let init    = false
const state = {}

socket.addEventListener (`message`, msg => {
   const obj = JSON.parse (msg.data)
   const t = audio_context.currentTime
   switch (obj.type) {
      case 'id':
         id = obj.body
         console.log (`identity is ${ id }`)
         const greeting = {
            type: `greeting`,
            body: `${ id } ~> hello!`
         }
         socket.send (JSON.stringify (greeting))      
         break
      // case 'play':
      //    active = obj.body
      //    const mult = active ? 1 : 0
      //    amp.gain.setValueAtTime (amp.gain.value, t)
      //    amp.gain.linearRampToValueAtTime (1 * mult, t + 2)
      //    console.log (`bpm is ${ obj.tempo.bpm }, sudivision is ${ obj.tempo.sub }`)
      //    break
      // case 'chord':
      //    const note = rand_element (obj.body)
      //    const freq = midi_to_cps (note)
      //    osc.frequency.cancelScheduledValues (t)
      //    osc.frequency.setValueAtTime (osc.frequency.value, t)
      //    osc.frequency.exponentialRampToValueAtTime (freq, t + 1)
      //    console.log (`bpm is ${ obj.tempo.bpm }, sudivision is ${ obj.tempo.sub }`)
      //    break
      case 'state':

         if (JSON.stringify (obj) != JSON.stringify (state)) {
            Object.assign (state, obj)
            new_state ()
         }

         if (!init) {
            init = true
         }

         break
   }
})


function midi_to_cps (n) {
   return 440 * (2 ** ((n - 69) / 12))
}

function rand_element (arr) {
   return arr[rand_integer (arr.length)]
}

function rand_integer (max) {
   return Math.floor (Math.random () * max)
}

socket.addEventListener ('open', msg => {
   console.log (`websocket is ${ msg.type } at ${ msg.target.url } `)
})

// ~ UI THINGS ~

document.body.style.margin   = 0
document.body.style.overflow = `hidden`

document.body.style.backgroundColor = `black`
const text_div                = document.createElement (`div`)
text_div.innerText            = `tap to join`
text_div.style.font           = `italic bolder 80px sans-serif`
text_div.style.color          = `white`
text_div.style.display        = `flex`
text_div.style.justifyContent = `center`
text_div.style.alignItems     = `center`
text_div.style.position       = `fixed`
text_div.style.width          = `${ window.innerWidth }px`
text_div.style.height         = `${ window.innerHeight }px`
text_div.style.left           = 0
text_div.style.top            = 0
document.body.appendChild (text_div)

document.body.onclick = async () => {
   if (document.body.style.backgroundColor == `black`) {

      await audio_context.resume ()

      document.body.style.backgroundColor = `deeppink`
      text_div.remove ()

      const msg = {
         type: 'joined',
         body: true,
      }
      socket.send (JSON.stringify (msg))   
   }
}

// ~ WEB AUDIO THINGS ~

const audio_context = new AudioContext ()
audio_context.suspend ()

reverbjs.extend(audio_context)

const reverb_url = "R1NuclearReactorHall.m4a"
var rev = audio_context.createReverbFromUrl (reverb_url, () => {
  rev.connect (audio_context.destination)
})

const osc_array = []
for (let i = 0; i < 12; i++) {
   const osc = audio_context.createOscillator ()
   osc.type  = `triangle`
   osc.frequency.value = Math.random () * 20000
   osc.start ()
   osc_array.push (osc)
}

const amp_array = []
for (let i = 0; i < 12; i++) {
   const amp = audio_context.createGain ()
   amp.gain.value = 0
   amp_array.push (amp)
}

const rev_gate = audio_context.createGain ()
rev_gate.gain.value = 0
rev_gate.connect (rev)

osc_array.forEach ((osc, i) => {
   osc.connect (amp_array[i])
      .connect (audio_context.destination)
   
   amp_array[i].connect (rev_gate)
})

const modes  = [ `stat` ,`asce` ,`desc` ,`shuf` ,`rand` ]

const arpeggiator = {
   active  : false,
   period  : 1,
   port    : 0,
   shuff   : [],
   i       : 0,
   mode    : 'stat',
   init    : function () {
      this.i = rand_integer (state.chord.length)
      this.u = this.i
      this.shuff = new_shuff (state.chord.length)
   },
   play    : function play_note () {
      switch (this.mode) {         
         case `stat` :
            if (this.shuff.length != state.chord.length) this.init ()
            break
         case `asce` :
            this.i++
            this.i %= state.chord.length
            this.u = this.i
            break
         case `desc` :
            this.i--
            if (this.i < 0) {
               this.i = state.chord.length - 1
            }
            this.u = this.i
            break
         case `shuf` :
            if (this.shuff.length != state.chord.length) this.init ()
            else {
               this.i++
               this.i %= state.chord.length
            }
            this.u = this.shuff[this.i]
            break
         case `rand` :
            this.u = rand_integer (state.chord.length)
            while (this.u == this.i) {
               this.u = rand_integer (state.chord.length)
            }
            this.i = this.u
            break
      }

      const note = state.chord[this.u]
      const freq = midi_to_cps (note)
      const t = audio_context.currentTime

      osc_array.forEach ((osc, i) => {
         osc.frequency.cancelScheduledValues (t)
         osc.frequency.setValueAtTime (osc.frequency.value, t)
         const glide = ((state.portamento * 0.125) ** 2) * this.period
         osc.frequency.exponentialRampToValueAtTime (freq * (i + 1), t + glide)   
      })

      if (state.active) {
         setTimeout (play_note.bind (this), this.period * 1000)
      }
   }
}

function new_shuff (l) {
   let n = l

   const acc = []
   while (n > 0) {
      n--
      acc.push (n)
   }

   const res = []
   while (acc.length > 0) {
      const s = acc.splice (rand_integer (acc.length), 1)
      res.push (s[0])
   }

   return res
}

function new_state () {
   if (state.active && !arpeggiator.active) arpeggiator.init ()

   arpeggiator.period = 60 / (state.bpm * state.subdivision)
   arpeggiator.mode   = modes[state.mode_i]

   const gate = state.active ? 1 : 0      
   const rel = state.release * arpeggiator.period
   const t = audio_context.currentTime

   amp_array.forEach ((amp, i) => {
      const mult = i < state.bright ? 1 / (i + 1) : 0
      amp.gain.cancelScheduledValues (t)
      amp.gain.setValueAtTime (amp.gain.value, t)
      amp.gain.linearRampToValueAtTime (1 * gate * mult, t + rel)      
   })

   const rev_amt = (state.reverb * 0.125) ** 2

   rev_gate.gain.cancelScheduledValues (t)
   rev_gate.gain.setValueAtTime (rev_gate.gain.value, t)
   rev_gate.gain.linearRampToValueAtTime (rev_amt, t + rel)      

   if (state.active && !arpeggiator.active) {
      arpeggiator.active = true
      arpeggiator.play ()
      console.log (`playing!!`)
   }

   if (!state.active && arpeggiator.active) {
      console.log (`stopping!!`)
      arpeggiator.active = false
   }

}
