/**
 * electron 主文件
 */
 import { join } from 'path'
 import { app, BrowserWindow, BrowserWindowConstructorOptions, ipcMain, Menu, Tray } from "electron";
import dotenv from 'dotenv';
 
dotenv.config({ path: join(__dirname, '../.env') })

 function createWindow() {
  let _window = new ElectronWin();
  _window.listen();
   //创建浏览器窗口
  _window.createWindows({
    title: '后台管理系统',
    width: 1027,
    height: 860,
    isMultiWindow:true
  });
  _window.createTray();
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
});

export const windowsCfg  = {
  id: String, //唯一id
  title: String, //窗口标题
  width: Number(), //宽度
  height: Number(), //高度
  minWidth: Number(860), //最小宽度
  minHeight: Number(600), //最小高度
  route: String, // 页面路由URL '/manage?id=123'
  resizable: Boolean(true), //是否支持调整窗口大小
  maximize: Boolean(false), //是否最大化
  backgroundColor:'#eee', //窗口背景色
  data: null, //数据
  isMultiWindow: Boolean(false), //是否支持多开窗口 (如果为false，当窗体存在，再次创建不会新建一个窗体 只focus显示即可，，如果为true，即使窗体存在，也可以新建一个)
  isMainWin: Boolean(false), //是否主窗口(当为true时会替代当前主窗口)
  parentId: Number(0), //父窗口id  创建父子窗口 -- 子窗口永远显示在父窗口顶部 【父窗口可以操作】
  modal: Boolean(false), //模态窗口 -- 模态窗口是禁用父窗口的子窗口，创建模态窗口必须设置 parent 和 modal 选项 【父窗口不能操作】
  isDevTool: Boolean(true)
}

export class ElectronWin {
  main: any;//当前页
  group: any;//窗口组
  tray: any;//托盘
  constructor() {
    this.main = null;
    this.group = {};
    this.tray = null;
  }

  // 窗口配置
  winOpts(wh: any = []) {
    return {
      width: Number(wh[0]),
      height: Number(wh[1]),
      backgroundColor: '#f00',
      autoHideMenuBar: Boolean(true),
      //titleBarStyle: 'hidden',
      resizable: Boolean(true),
      minimizable: Boolean(true),
      maximizable: Boolean(true),
      frame: Boolean(false),
      show: Boolean(false),
      modal: Boolean(false),
      minWidth: Number(0),
      minHeight: Number(0),
      webPreferences: {
        contextIsolation: Boolean(false), //上下文隔离
        nodeIntegration: Boolean(true), //启用Node集成（是否完整的支持 node）
        //nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
        devTools: Boolean(true),
        webSecurity: Boolean(false),
        enableRemoteModule: Boolean(true), //是否启用远程模块（即在渲染进程页面使用remote）
      }
    }
  }
  // 获取窗口
  getWindow(id: Number) {
    return BrowserWindow.fromId(Number(id))
  }

  // 获取全部窗口
  getAllWindows() {
    return BrowserWindow.getAllWindows();
  }

  // 创建窗口
  createWindows(options: any) {
    console.log('------------开始创建窗口...');

    let args = Object.assign({}, windowsCfg, options);

    // 判断窗口是否存在
    for (let i in this.group) {
      console.log("8888",this.group[i].isMultiWindow,this.getWindow(Number(i)),(this.group[i].route === args.route));
      if (this.getWindow(Number(i)) && this.group[i].route === args.route && !this.group[i].isMultiWindow) {
        console.log("重复");
        this.getWindow(Number(i))?.focus();
        return;
      }
    }
    console.log("合并参数");
    let opts = this.winOpts([args.width || 1027, args.height || 860]);
    let opt = <BrowserWindowConstructorOptions>opts;
    console.log('parentId：' + args.parentId);
    if (args.parentId) {
      console.log('parentId：' + args.parentId)
      opt.parent = <BrowserWindow>this.getWindow(args.parentId);
    }
    else if (this.main) {
      console.log("当前页");
    }

    if (typeof args.modal === 'boolean') opt.modal = args.modal
    if (typeof args.resizable === 'boolean') opt.resizable = args.resizable
    if (args.backgroundColor) opt.backgroundColor = args.backgroundColor
    if (args.minWidth) opt.minWidth = args.minWidth
    if (args.minHeight) opt.minHeight = args.minHeight

    let win = new BrowserWindow(opt);

    if (args.isDevTool) {
       //打开调试窗口
       win.webContents.openDevTools();
    }
   

    this.group[win.id] = {
      route: args.route,
      isMultiWindow: args.isMultiWindow,
    };

    // 是否最大化
    if (args.maximize && args.resizable) {
      win.maximize();
    }
    // 是否主窗口
    if (args.isMainWin) {
      if (this.main) {
        console.log('主窗口存在')
        delete this.group[this.main.id]
        this.main.close();
      }
      this.main = win;
    }
    args.id = win.id
    win.on('close', () => win.setOpacity(0));

    // 打开网址（加载页面）
    /**
     * 开发环境: http://localhost:8080
     * 正式环境: app://./index.html
     */
    let winURL;
    if (process.env.WEBPACK_DEV_SERVER_URL) {
      winURL = args.route ? `http://localhost:${process.env.PORT}${args.route}` : `http://localhost:${process.env.PORT}`;
    } else {
      //winURL = args.route ? `app://./index.html${args.route}` : `app://./index.html`;
      winURL = `http://localhost:${process.env.PORT}`;
    }
    console.log("加载地址",winURL);
    win.loadURL(winURL);//加载页面

    win.once('ready-to-show', () => {
      win.show()
    })

   // 屏蔽窗口菜单（-webkit-app-region: drag）
    win.hookWindowMessage(278, function (e) {
      win.setEnabled(false)
      setTimeout(() => {
        win.setEnabled(true)
      }, 100)

      return true
    })
    console.log("最终参数", opt);
  }

  // 关闭所有窗口
  closeAllWindow() {
    for (let i in this.group) {
      if (this.group[i]) {
        if (this.getWindow(Number(i))) {
          this.getWindow(Number(i))?.close()
        } else {
          console.log('---------------------------')
          app.quit()
        }
      }
    }
  }

  // 创建托盘
  createTray() {
    console.log('创建托盘')
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示',
        click: () => {
          for (let i in this.group) {
            if (this.group[i]) {
              // this.getWindow(Number(i)).show()
              let win = this.getWindow(Number(i))
              if (!win) return
              if (win.isMinimized()) win.restore()
              win.show()
            }
          }
        }
      }, {
        label: '退出',
        click: () => {
          app.quit()
        }
      }
    ]);

    console.log("开始加载logo");
    const trayIco = join(__dirname, '../../public/logo.png');
    console.log("加载logo",trayIco);
    let tray = new Tray(trayIco);
    this.tray = tray;
    this.tray.setContextMenu(contextMenu);
    this.tray.setToolTip(app.name);
  }

  /**
   * 开启监听
   */
  listen() {
    // 关闭
    ipcMain.on('window-closed', (event, winId) => {
      if (winId) {
        this.getWindow(Number(winId))?.close()
        if (this.group[Number(winId)]) delete this.group[Number(winId)]
      } else {
        this.closeAllWindow()
      }
    })

    // 隐藏
    ipcMain.on('window-hide', (event, winId) => {
      if (winId) {
        this.getWindow(Number(winId))?.hide()
      } else {
        for (let i in this.group) if (this.group[i]) this.getWindow(Number(i))?.hide()
      }
    })

    // 显示
    ipcMain.on('window-show', (event, winId) => {
      if (winId) {
        this.getWindow(Number(winId))?.show()
      } else {
        for (let i in this.group) if (this.group[i]) this.getWindow(Number(i))?.show()
      }
    })

    // 最小化
    ipcMain.on('window-mini', (event, winId) => {
      if (winId) {
        this.getWindow(Number(winId))?.minimize()
      } else {
        for (let i in this.group) if (this.group[i]) this.getWindow(Number(i))?.minimize()
      }
    })

    // 最大化
    ipcMain.on('window-max', (event, winId) => {
      if (winId) {
        this.getWindow(Number(winId))?.maximize()
      } else {
        for (let i in this.group) if (this.group[i]) this.getWindow(Number(i))?.maximize()
      }
    })

    // 最大化/最小化
    ipcMain.on('window-max-min-size', (event, winId) => {
      if (winId) {
        if (this.getWindow(winId)?.isMaximized()) {
          this.getWindow(winId)?.unmaximize()
        } else {
          this.getWindow(winId)?.maximize()
        }
      }
    })

    // 还原
    ipcMain.on('window-restore', (event, winId) => {
      if (winId) {
        this.getWindow(Number(winId))?.restore()
      } else {
        for (let i in this.group) if (this.group[i]) this.getWindow(Number(i))?.restore()
      }
    })

    // 重新加载
    ipcMain.on('window-reload', (event, winId) => {
      if (winId) {
        this.getWindow(Number(winId))?.reload()
      } else {
        for (let i in this.group) if (this.group[i]) this.getWindow(Number(i))?.reload()
      }
    })

    // 创建窗口
    ipcMain.on('window-new', (event, args) => this.createWindows(args))
  }

}
