/**
 * electron 主文件
 */
 import { join } from 'path'
 import { app, BrowserWindow } from 'electron'
 import dotenv from 'dotenv'
 
 dotenv.config({ path: join(__dirname, '../.env') })
 
let win: BrowserWindow;
 
 function createWindow() {
   // 创建浏览器窗口
   win = new BrowserWindow({
     width: 1024,
     height: 768,
     webPreferences: {
       nodeIntegration: true,
       contextIsolation: false,
       //preload:join(__dirname, '../preload/preload.js')
     },
   })
   win.webContents.openDevTools();


   const URL = app.isPackaged
     ? `file://${join(__dirname, '../index.html')}` // vite 构建后的静态文件地址
     : `http://localhost:${process.env.PORT}` // vite 启动的服务器地址

   win.loadURL(URL);
 }
 app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  }
)})
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})