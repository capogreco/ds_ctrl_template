// ~ WEBSOCKET THINGS ~

let id = null
// const ws_address = `wss://capogreco-omni.deno.dev`
const ws_address = `ws://localhost/`

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
         method: 'join',
         content: true,
      }
      socket.send (JSON.stringify (msg))   
   }
}

// ~ WEB AUDIO THINGS ~

const audio_context = new AudioContext ()
audio_context.suspend ()

