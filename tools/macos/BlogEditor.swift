// 文章編輯器: a small native macOS app that runs the local preview (Hugo) and the post
// editor (Decap CMS) in the background and shows the editor in its own window.
// Build with: sh tools/macos/build-app.sh
import Cocoa
import WebKit

let editorURL = URL(string: "http://localhost:1313/admin/")!
let previewURL = URL(string: "http://localhost:1313/blog/")!

final class AppDelegate: NSObject, NSApplicationDelegate, WKUIDelegate, WKNavigationDelegate {
  var window: NSWindow!
  var webView: WKWebView!
  var status: NSTextField!
  var server: Process?
  var extraWindows: [NSWindow] = []

  var repoPath: String {
    Bundle.main.object(forInfoDictionaryKey: "RepoPath") as? String
      ?? (NSHomeDirectory() as NSString).appendingPathComponent("chunyunglo.github.io")
  }

  func applicationDidFinishLaunching(_ notification: Notification) {
    buildMenu()
    let config = WKWebViewConfiguration()
    webView = WKWebView(frame: .zero, configuration: config)
    webView.uiDelegate = self
    webView.navigationDelegate = self
    webView.isHidden = true

    status = NSTextField(labelWithString: "正在啟動編輯器…")
    status.font = .systemFont(ofSize: 15)
    status.textColor = .secondaryLabelColor
    status.alignment = .center

    let content = NSView()
    for v in [webView!, status!] as [NSView] {
      v.translatesAutoresizingMaskIntoConstraints = false
      content.addSubview(v)
    }
    NSLayoutConstraint.activate([
      webView.leadingAnchor.constraint(equalTo: content.leadingAnchor),
      webView.trailingAnchor.constraint(equalTo: content.trailingAnchor),
      webView.topAnchor.constraint(equalTo: content.topAnchor),
      webView.bottomAnchor.constraint(equalTo: content.bottomAnchor),
      status.centerXAnchor.constraint(equalTo: content.centerXAnchor),
      status.centerYAnchor.constraint(equalTo: content.centerYAnchor),
      status.widthAnchor.constraint(lessThanOrEqualTo: content.widthAnchor, constant: -80),
    ])

    window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 1280, height: 820),
                      styleMask: [.titled, .closable, .miniaturizable, .resizable],
                      backing: .buffered, defer: false)
    window.title = "文章編輯器"
    window.contentView = content
    window.setFrameAutosaveName("EditorWindow")
    window.center()
    window.makeKeyAndOrderFront(nil)
    NSApp.activate(ignoringOtherApps: true)

    startServers()
  }

  // MARK: background servers

  func startServers() {
    if isListening() { showEditor(); return }
    guard FileManager.default.fileExists(atPath: (repoPath as NSString).appendingPathComponent("tools/write.mjs")) ||
          FileManager.default.fileExists(atPath: (repoPath as NSString).appendingPathComponent(".git")) else {
      fail("找不到網站資料夾：\(repoPath)")
      return
    }
    let script = """
      export PATH=/opt/homebrew/bin:/usr/local/bin:$PATH
      cd "$REPO" || exit 1
      git pull --ff-only --quiet >/dev/null 2>&1 || true
      command -v hugo >/dev/null || { echo "需要先安裝 Hugo：brew install hugo"; exit 2; }
      command -v node >/dev/null || { echo "需要先安裝 Node.js：brew install node"; exit 2; }
      [ -f tools/write.mjs ] || { echo "網站資料夾還沒有編輯器程式，請先用 GitHub Desktop 更新（pull）。"; exit 2; }
      [ -d node_modules/decap-server ] || npm install --no-audit --no-fund >/dev/null 2>&1
      BLOG_EDITOR_NO_OPEN=1 exec node tools/write.mjs
      """
    let p = Process()
    p.executableURL = URL(fileURLWithPath: "/bin/zsh")
    p.arguments = ["-lc", script]
    var env = ProcessInfo.processInfo.environment
    env["REPO"] = repoPath
    p.environment = env
    let out = Pipe()
    p.standardOutput = out
    p.standardError = out
    var log = ""
    out.fileHandleForReading.readabilityHandler = { h in
      if let s = String(data: h.availableData, encoding: .utf8) { log += s }
    }
    p.terminationHandler = { [weak self] proc in
      DispatchQueue.main.async {
        guard let self, proc.terminationStatus != 0, proc.terminationStatus != 15 else { return }
        let lines = log.split(separator: "\n").suffix(3).joined(separator: "\n")
        self.fail(lines.isEmpty ? "編輯器沒有成功啟動。" : lines)
      }
    }
    do { try p.run(); server = p } catch { fail("無法啟動：\(error.localizedDescription)"); return }
    waitUntilReady(attempts: 120)
  }

  func isListening() -> Bool {
    func probe(_ s: String) -> Bool {
      var ok = false
      let sem = DispatchSemaphore(value: 0)
      var req = URLRequest(url: URL(string: s)!)
      req.timeoutInterval = 0.5
      URLSession.shared.dataTask(with: req) { _, r, _ in
        ok = (r as? HTTPURLResponse) != nil
        sem.signal()
      }.resume()
      _ = sem.wait(timeout: .now() + 1)
      return ok
    }
    return probe("http://localhost:1313/admin/config.yml") && probe("http://localhost:8081/api/v1")
  }

  func waitUntilReady(attempts: Int) {
    DispatchQueue.global().async {
      let ready = self.isListening()
      DispatchQueue.main.async {
        if ready { self.showEditor() }
        else if attempts > 0, self.server?.isRunning ?? false {
          DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { self.waitUntilReady(attempts: attempts - 1) }
        } else if self.server?.isRunning ?? false {
          self.fail("編輯器啟動逾時。")
        }
      }
    }
  }

  func showEditor() {
    status.isHidden = true
    webView.isHidden = false
    webView.load(URLRequest(url: editorURL))
  }

  func fail(_ message: String) {
    AppDelegate.log("error \(message)")
    status.stringValue = message
    status.isHidden = false
    webView.isHidden = true
  }

  // A small log in ~/Library/Logs helps when something goes wrong.
  static let logURL = URL(fileURLWithPath: NSHomeDirectory()).appendingPathComponent("Library/Logs/文章編輯器.log")
  static func log(_ line: String) {
    let text = "\(Date()) \(line)\n"
    if let h = try? FileHandle(forWritingTo: logURL) { h.seekToEndOfFile(); h.write(text.data(using: .utf8)!); try? h.close() }
    else { try? text.write(to: logURL, atomically: true, encoding: .utf8) }
  }

  func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
    AppDelegate.log("loaded \(webView.url?.absoluteString ?? "") \(webView.title ?? "")")
  }

  func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
    AppDelegate.log("failed \(error.localizedDescription)")
  }

  func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }

  func applicationWillTerminate(_ notification: Notification) {
    if let p = server, p.isRunning {
      p.terminate()
      p.waitUntilExit()
    }
  }

  // MARK: menus

  func buildMenu() {
    let main = NSMenu()
    let appItem = NSMenuItem(); main.addItem(appItem)
    let app = NSMenu()
    app.addItem(withTitle: "結束文章編輯器", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
    appItem.submenu = app

    let editItem = NSMenuItem(); main.addItem(editItem)
    let edit = NSMenu(title: "編輯")
    edit.addItem(withTitle: "還原", action: Selector(("undo:")), keyEquivalent: "z")
    edit.addItem(withTitle: "重做", action: Selector(("redo:")), keyEquivalent: "Z")
    edit.addItem(.separator())
    edit.addItem(withTitle: "剪下", action: #selector(NSText.cut(_:)), keyEquivalent: "x")
    edit.addItem(withTitle: "拷貝", action: #selector(NSText.copy(_:)), keyEquivalent: "c")
    edit.addItem(withTitle: "貼上", action: #selector(NSText.paste(_:)), keyEquivalent: "v")
    edit.addItem(withTitle: "全選", action: #selector(NSText.selectAll(_:)), keyEquivalent: "a")
    editItem.submenu = edit

    let viewItem = NSMenuItem(); main.addItem(viewItem)
    let view = NSMenu(title: "顯示方式")
    view.addItem(withTitle: "重新載入", action: #selector(reload), keyEquivalent: "r")
    view.addItem(withTitle: "預覽網站", action: #selector(openPreview), keyEquivalent: "p")
    viewItem.submenu = view

    let winItem = NSMenuItem(); main.addItem(winItem)
    let win = NSMenu(title: "視窗")
    win.addItem(withTitle: "縮到最小", action: #selector(NSWindow.performMiniaturize(_:)), keyEquivalent: "m")
    win.addItem(withTitle: "關閉", action: #selector(NSWindow.performClose(_:)), keyEquivalent: "w")
    winItem.submenu = win
    NSApp.windowsMenu = win
    NSApp.mainMenu = main
  }

  @objc func reload() { webView.reload() }

  @objc func openPreview() { openWindow(URLRequest(url: previewURL), title: "網站預覽") }

  @discardableResult
  func openWindow(_ request: URLRequest?, title: String, configuration: WKWebViewConfiguration = WKWebViewConfiguration()) -> WKWebView {
    let w = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 1200, height: 800),
                     styleMask: [.titled, .closable, .miniaturizable, .resizable], backing: .buffered, defer: false)
    w.title = title
    w.isReleasedWhenClosed = false
    let v = WKWebView(frame: .zero, configuration: configuration)
    v.uiDelegate = self
    v.navigationDelegate = self
    w.contentView = v
    w.cascadeTopLeft(from: window.frame.origin)
    w.center()
    w.makeKeyAndOrderFront(nil)
    extraWindows.append(w)
    if let request { v.load(request) }
    return v
  }

  // MARK: web view behaviour

  // File pickers for uploading images.
  func webView(_ webView: WKWebView, runOpenPanelWith parameters: WKOpenPanelParameters,
               initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping ([URL]?) -> Void) {
    let panel = NSOpenPanel()
    panel.allowsMultipleSelection = parameters.allowsMultipleSelection
    panel.canChooseDirectories = false
    panel.beginSheetModal(for: webView.window ?? window) { r in completionHandler(r == .OK ? panel.urls : nil) }
  }

  // Links that open a new window: local pages in an app window, everything else in the default browser.
  func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
               for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
    guard let url = navigationAction.request.url else { return nil }
    if url.host == "localhost" || url.host == "127.0.0.1" {
      return openWindow(nil, title: "網站預覽", configuration: configuration)
    }
    NSWorkspace.shared.open(url)
    return nil
  }

  func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String,
               initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
    let a = NSAlert(); a.messageText = message; a.runModal(); completionHandler()
  }

  func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String,
               initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
    let a = NSAlert(); a.messageText = message
    a.addButton(withTitle: "確定"); a.addButton(withTitle: "取消")
    completionHandler(a.runModal() == .alertFirstButtonReturn)
  }

  func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
               decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
    if let url = navigationAction.request.url, let host = url.host,
       !["localhost", "127.0.0.1"].contains(host), navigationAction.navigationType == .linkActivated {
      NSWorkspace.shared.open(url)
      decisionHandler(.cancel)
      return
    }
    decisionHandler(.allow)
  }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()
