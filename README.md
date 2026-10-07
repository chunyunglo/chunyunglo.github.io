# chunyunglo.github.io

羅俊詠（Chun-Yung Yong Lo）的個人網站，以 [Hugo](https://gohugo.io) 建置，透過 GitHub Actions 部署到 GitHub Pages。

版型是放在 `layouts/` 的輕量自製版型，不依賴外部主題、Node 或 Go modules。

## 本機預覽

```bash
hugo server
```

需要 Hugo extended 0.156 以上（CI 固定使用 0.167.0；`brew upgrade hugo` 可更新）。

## 修改內容

| 內容 | 位置 |
| --- | --- |
| 姓名、簡介、頭像 | `data/{zh-tw,en}/author.yaml`、`data/{zh-tw,en}/sections/about.yaml` |
| 經歷、教育、發表、專案、技能 | `data/{zh-tw,en}/sections/*.yaml` |
| 文章 | `content/blog/` |
| 樣式 | `assets/css/main.css` |

## 寫新文章

```bash
hugo new content blog/my-post/index.md
```

- 中文寫在 `index.md`，英文版另存 `index.en.md`；沒有英文版的文章也會出現在英文文章列表並標示語言。
- 封面圖片命名為 `cover.jpg` 放在同一資料夾；內文用 `![說明](photo.jpg)` 引用。建置時會轉成 WebP（不含 EXIF/GPS），原始檔不會發布；但原始檔仍在 git 裡，commit 前最好先去除定位資訊。
- `draft: true` 的文章不會發布。

## 隱私

不要 commit 履歷 PDF、成績單、證件或含手機號碼與地址的檔案。`static/files/*.pdf` 已列入 `.gitignore`。
