# Chit Chat Bot
A bot specifically built for a friend's server.

And yes it's just JS. I was bored and built this in a day and just kept adding stuff over time and didn't care to use TS or Python.

## Functionality
* Minor mod automation
  - Can assign forbidden words (etc. slurs or profanity) in which the bot will time out the user that says the word
* Automaic role assigning on joining
  - Can set a welcome channel, welcome message, and a member role to assign on joining the server.
* Role assigning
  - Can add/remove roles from a role assign command, where all users can execute /role-assign and pick a role they want.
* Uptime/help commands

## How to use
* Go to [Discord Developer Portal](https://discord.com/developers/applications)
* Create an application
* Go to OAuth2 tab
  - Scroll down to Oauth2 URL Generator and tick `bot` and `application.commands`.
  
  ![image](https://github.com/user-attachments/assets/ec428883-ad34-4fcb-8481-d9bce29327be)
  
  - Scroll down to bot permissions and tick `administrator`.
  
  ![image](https://github.com/user-attachments/assets/51ec6d97-a128-47ce-b14f-8f2854580cf4)
  
  - Then scroll down and copy the generated URL and put it in your URL bar in your chosen browser.
  - Choose the server you want the bot to join.
* Go to Bot tab
  - Scroll down and enable all three of the privledged gateway intents
    
  ![image](https://github.com/user-attachments/assets/6e29c0e3-d7ae-4b07-b26e-24b15b63c592)
  
  - Scroll down some more and tick `administrator`
    
  ![image](https://github.com/user-attachments/assets/5c781a5e-e541-4c4c-b32f-67059295fd17)
  
  - After that scroll up and reset the bot token and copy the bot token keep it on the side be sure to not lose it.
* Pull the code
  - cd into the folder
  - rename the `.env-template` or copy the file and rename it to `.env` in the root directory and edit or create two variables one called `BOT_TOKEN` and one called `CLIENT_ID`
  - paste your bot token into `BOT_TOKEN` and grab your application id on the general information tab of discord developer portal. Paste that id into `CLIENT_ID`
  - `npm install`
  - `node syncdb.js` will create the SQLite database that is locally stored.
  - `node deply-commands.js` will grab the commands and make them useable. (if you ever add more commands be sure to run this)
  - `npm run dev` or `npm start` or `node .` to run the bot
* Enjoy! :)

