import { serve }    from "https://deno.land/std@0.185.0/http/server.ts"
import { serveDir } from "https://deno.land/std@0.185.0/http/file_server.ts"
import { generate } from "https://deno.land/std@0.185.0/uuid/v1.ts"

// map to manage sockets
const sockets = new Map ()

// object to hold state
const state = {
   control: null,
}

// function to manage requests
const req_handler = async incoming_req => {

   let req = incoming_req

   // get path from request
   const path = new URL (req.url).pathname

   // get upgrade header
   // or empty string
   const upgrade = req.headers.get ("upgrade") || ""

   // if upgrade for websockets exists
   if (upgrade.toLowerCase () == "websocket") {

      // unwrap socket & response
      // using upgradeWebSocket method
      const { socket, response } = Deno.upgradeWebSocket (req)

      // generate a unique ID
      const id = generate ()

      // defining an onopen method
      socket.onopen = () => {

         // assign false to 
         // audio_enabled property
         socket.audio_enabled = false

         // add socket to map
         sockets.set (id, socket)

         // bundle the id into an object
         const parcel = { 
            'content' :  id,
            'context' : `id`
         }

         // stringify & send the parcel
         // to the client via the socket 
         socket.send (JSON.stringify (parcel))

         // call update_control function
         update_control ()
      }

      // defining an onmessage method
      socket.onmessage = m => {

         // unwrap the message
         const message = JSON.parse (m.data)

         
         switch (message.context) {
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
         if (state.control) {
            if (state.control.id == id) {
               state.control = null
            }
         }
         else {
            sockets.delete (id)
            update_control ()
         }
      }

      return response
   }

   if (req.url.endsWith (`/`)) {

      // add 'index.html' to the url
      req = new Request (`${ req.url }index.html`, req)
   }

   const options = {

      // route requests to this
      // directory in the file system
      fsRoot: path.includes (`ctrl`) ? `` : `client`
   }

   console.log (path)

   // return the requested asset
   // from `public` folder
   return serveDir (req, options)

}

serve (req_handler, { port: 80 })

function update_control () {
   if (state.control) {
      const msg = {
         type: 'sockets',
         body: Array.from (sockets.entries ())
      }
      control.send (JSON.stringify (msg))
   }
}

function check_sockets () {
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

setInterval (check_sockets, 200)
