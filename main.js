const electron = require('electron')
const {app, globalShortcut, ipcMain ,BrowserWindow} = electron

let win = null

app.on('ready', () => {
    win = new BrowserWindow({width: 1280, height: 720})
    win.loadURL(`file://${__dirname}/index.html`)
    win.toggleDevTools();


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





app.on('will-quit', () => {
    // // Unregister a shortcut.
    // globalShortcut.unregister('MediaPlayPause')

    // Unregister all shortcuts.
    globalShortcut.unregisterAll()
})
