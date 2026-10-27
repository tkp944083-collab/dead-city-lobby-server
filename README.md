# Dead City lobby server

This is a first step toward multiplayer: it creates lobby codes, lists players, and supports text chat. It DOES NOT synchronize the game world, players, zombies, combat, or revives. The current Dead City website still needs to be connected to these endpoints. Lobby state is stored in memory and disappears when the server restarts. This prototype is intended for testing with trusted friends, not production.

For Render: create a Web Service from a GitHub repository containing these files. Runtime: Node. Build command: `npm install`. Start command: `npm start`. Select the Free instance if available. Render supplies the PORT environment variable. Visit the resulting URL to see the health response.

API: POST /create {name}; POST /join {code,name}; POST /poll {code,id,token}; POST /chat {code,id,token,message}; POST /leave {code,id,token}. Create and join return id and token. Poll at an appropriate interval to stay present. This sample has no persistent storage or public abuse protections.
