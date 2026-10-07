-- 文章編輯器: starts the local preview and post editor for this site, and stops them on quit.
property repoPath : "__REPO__"
property editorURL : "http://localhost:1313/admin/"
property pidFile : "/tmp/chunyunglo-blog-editor.pid"
property logFile : "/tmp/chunyunglo-blog-editor.log"
property shellEnv : "export PATH=/opt/homebrew/bin:/usr/local/bin:$HOME/.nvm/versions/node/*/bin:$PATH; cd " & quoted form of repoPath & "; "

on run
	try
		do shell script shellEnv & "command -v hugo >/dev/null && command -v node >/dev/null"
	on error
		display dialog "需要先安裝 Hugo 與 Node.js：" & return & return & "brew install hugo node" buttons {"好"} default button 1 with icon caution with title "文章編輯器"
		quit
		return
	end try
	if not (isListening()) then
		try
			do shell script shellEnv & "[ -d node_modules ] || npm install --no-audit --no-fund >" & logFile & " 2>&1"
			do shell script shellEnv & "BLOG_EDITOR_NO_OPEN=1 nohup node tools/write.mjs >>" & logFile & " 2>&1 & echo $! > " & pidFile
		on error errMsg
			display dialog "無法啟動編輯器：" & errMsg buttons {"好"} default button 1 with icon stop with title "文章編輯器"
			quit
			return
		end try
		repeat 40 times
			if isListening() then exit repeat
			delay 0.5
		end repeat
		if not (isListening()) then
			display dialog "編輯器沒有成功啟動，詳細訊息在 " & logFile buttons {"好"} default button 1 with icon stop with title "文章編輯器"
			quit
			return
		end if
	end if
	openEditor()
end run

on reopen
	openEditor()
end reopen

on openEditor()
	open location editorURL
end openEditor

on isListening()
	try
		do shell script "lsof -nP -iTCP:1313 -sTCP:LISTEN >/dev/null && lsof -nP -iTCP:8081 -sTCP:LISTEN >/dev/null"
		return true
	on error
		return false
	end try
end isListening

on idle
	return 120
end idle

on quit
	try
		do shell script "if [ -f " & pidFile & " ]; then kill -TERM $(cat " & pidFile & ") 2>/dev/null; rm -f " & pidFile & "; fi"
	end try
	continue quit
end quit
