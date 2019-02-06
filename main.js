const electron = require('electron');
const {app, globalShortcut, ipcMain ,BrowserWindow, shell} = electron;
const URL = require('url').URL;


// Consider using Twillio for app sync: https://www.twilio.com/docs/sync/quickstart/js

let win = null;
app.on('ready', () => {
    win = new BrowserWindow({width: 1280, height: 720})
    win.loadURL(`file://${__dirname}/index.html`)
    win.toggleDevTools();
    win.setTitle("kTube");
    win.setIcon("./resources/kTube_Icon.png");
    // win.setMenu(null);


    // Register a 'MediaPlayPause' shortcut listener.
    const MediaPlayPause = globalShortcut.register('MediaPlayPause', () => {
        win.webContents.send('MediaPlayPause', 'MediaPlayPause')
    })

    if (!MediaPlayPause) {
        console.log('MediaPlayPause registration failed')
    }

    // Register a 'MediaStop' shortcut listener.
    const MediaStop  = globalShortcut.register('MediaStop', () => {
        win.webContents.send('MediaStop', 'MediaStop')
    })

    if (!MediaStop) {
        console.log('MediaStop registration failed')
    }


    // Register a 'MediaNextTrack' shortcut listener.
    // TODO: Add handler in render process for this
    const MediaNextTrack  = globalShortcut.register('MediaNextTrack', () => {
        win.webContents.send('MediaNextTrack', 'MediaNextTrack')
    })

    if (!MediaNextTrack) {
        console.log('MediaNextTrack registration failed')
    }


    // Register a 'MediaPreviousTrack' shortcut listener.
    // TODO: Add handler in render process for this
    const MediaPreviousTrack  = globalShortcut.register('MediaPreviousTrack', () => {
        win.webContents.send('MediaPreviousTrack', 'MediaPreviousTrack')
    })

    if (!MediaPreviousTrack) {
        console.log('MediaPreviousTrack registration failed')
    }
})

// Seacurity feature: https://electronjs.org/docs/tutorial/security#12-disable-or-limit-navigation
app.on('web-contents-created', (event, contents) => {
    contents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl)
        // if (parsedUrl.origin !== 'https://www.youtube.com') {
            event.preventDefault();
        // }
    })
})

// Security feature: https://electronjs.org/docs/tutorial/security#13-disable-or-limit-creation-of-new-windows
app.on('web-contents-created', (event, contents) => {
    contents.on('new-window', (event, navigationUrl) => {
      // We'll ask the operating system
      // to open this event's url in the default browser.
      event.preventDefault()
    //   shell.openExternalSync(navigationUrl)  // TODO: Open in default browser does not work for some reason
    })
})


// Security feature: https://electronjs.org/docs/tutorial/security#11-verify-webview-options-before-creation
app.on('web-contents-created', (event, contents) => {
    contents.on('will-attach-webview', (event, webPreferences, params) => {
      // Strip away preload scripts if unused or verify their location is legitimate
      delete webPreferences.preload
      delete webPreferences.preloadURL
  
      // Disable Node.js integration
      webPreferences.nodeIntegration = false
  
      // Verify URL being loaded
    //   if (!params.src.startsWith('https://yourapp.com/')) { // External web contents should not be created.
        event.preventDefault()
    //   }
    })
})



app.on('will-quit', () => {
    // // Unregister a shortcut.
    // globalShortcut.unregister('MediaPlayPause')

    // Unregister all shortcuts.
    globalShortcut.unregisterAll()
})
