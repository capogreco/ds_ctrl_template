import { serve } from "https://deno.land/std@0.157.0/http/server.ts"
import { serveFile } from "https://deno.land/std@0.157.0/http/file_server.ts?s=serveFile"
import * as uuid from "https://deno.land/std@0.119.0/uuid/mod.ts";

const sockets = new Map ()
let control = null
let is_playing = false
let current_chord = []
const state = {}

const req_handler = async req => {
   const path = new URL (req.url).pathname

   const upgrade = req.headers.get ("upgrade") || ""
   if (upgrade.toLowerCase () == "websocket") {
      const { socket, response } = Deno.upgradeWebSocket (req)
      const id = uuid.v1.generate ()

      socket.onopen = () => {
         socket.joined = false
         sockets.set (id, socket)
         const data = { 
            'type' : `id`,
            'body' : id,
         }
         socket.send (JSON.stringify (data))
         updateControl ()
      }

      socket.onmessage = e => {
         const obj = JSON.parse (e.data)
         switch (obj.type) {
            case 'state':
               Object.assign (state, obj)
               sockets.forEach (s => {
                  s.send (JSON.stringify (state))
               })
               break
            case 'greeting': 
               break
            case 'request_control':
               if (!control) {
                  control = socket
                  control.id = id
                  sockets.delete (id)
                  updateControl ()
                  console.log (`${ control.id } has control.`)
               }
               else {
                  console.log (`${ id } wants control!`)
               }
               break
            case 'joined':
               socket.joined = obj.body
               console.log (`${ id } has joined!`)
               updateControl ()

               if (is_playing) {
                  const msg = {
                     type: 'play',
                     body: is_playing,
                  }
                  socket.send (JSON.stringify (msg))

                  if (current_chord.length > 0) {
                     const msg = {
                        type: `chord`,
                        body: current_chord
                     }
                     socket.send (JSON.stringify (msg))
                  }
               }
               break
            case 'play':
               is_playing = obj.body
               sockets.forEach (s => {
                  s.send (JSON.stringify (obj))
               })
               break
            case 'chord':
               current_chord = obj.body
               sockets.forEach (s => {
                  s.send (JSON.stringify (obj))
               })
               break
         }
      }

      socket.onerror = e => console.log(`socket error: ${ e.message }`)

      socket.onclose = () => {
         if (control) {
            if (control.id == id) {
               control = null
            }
         }
         else {
            sockets.delete (id)
            updateControl ()
         }
      }

      return response
   }
   
   switch (path) {
      case "/":
         return serveFile (req, `synthesis/index.html`)
      case "/synthesis.js":
         return serveFile (req, `synthesis/synthesis.js`)
      case "/reverb.js":
         return serveFile (req, `synthesis/reverb.js`)
      case "/R1NuclearReactorHall.m4a":
         return serveFile (req, `synthesis/R1NuclearReactorHall.m4a`)
      case "/favicon.ico":
         return serveFile (req, `synthesis/favicon.ico`)
      case "/control":
         return serveFile (req, `control/index.html`)
      case "/control/control.js":
         return serveFile (req, `control/control.js`)
      case "/control/favicon.ico":
         return serveFile (req, `control/favicon.ico`)
      }
}

serve (req_handler, { port: 80 })

function updateControl () {
   if (control) {
      const msg = {
         type: 'sockets',
         body: Array.from (sockets.entries ())
      }
      control.send (JSON.stringify (msg))
   }
}

function checkSockets () {
   const removals = []
   sockets.forEach ((val, key) => {
      if (val.readyState == 3) {
         removals.push (key)
      }
   })

   if (removals.length) {
      removals.forEach (id => {
         sockets.delete (id)
      })
      updateControl ()
   }
}

setInterval (checkSockets, 200)
