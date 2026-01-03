# Toha Theme Color Guide - Refined Cold Morandi (修正版冷色調莫蘭迪)

本文件定義目前網站使用的配色系統。針對易讀性與高級感進行了修正。

要修改顏色，請編輯 `static/css/custom.css` 檔案。

## 🎨 核心調色盤 (Core Palette)

| 變數名稱 (Variable) | 顏色 (Color) | 色碼 (Hex) | 用途 (Usage) |
| :--- | :---: | :--- | :--- |
| `--primary-color` | ![#889CA9](https://via.placeholder.com/15/889CA9/000000?text=+) | `#889CA9` | **莫蘭迪灰藍 (Slate Blue Grey)**<br>低飽和度的主色，用於按鈕、連結、時間軸。 |
| `--secondary-color` | ![#DDE4E8](https://via.placeholder.com/15/DDE4E8/000000?text=+) | `#DDE4E8` | **極淺灰藍 (Pale Slate)**<br>用於 Footer 與裝飾性背景塊。 |
| `--accent-color` | ![#5F7380](https://via.placeholder.com/15/5F7380/000000?text=+) | `#5F7380` | **深岩灰 (Deep Slate)**<br>用於 Hover 效果、強調文字，比主色更深更沉穩。 |
| `--background-color`| ![#F4F6F7](https://via.placeholder.com/15/F4F6F7/000000?text=+) | `#F4F6F7` | **冷雲白 (Cool Cloud)**<br>極淡的冷灰色背景，保護眼睛同時避免純白刺眼。 |

## 📝 文字與介面 (Typography & UI)

| 變數名稱 (Variable) | 顏色 (Color) | 色碼 (Hex) | 用途 (Usage) |
| :--- | :---: | :--- | :--- |
| `--text-color` | ![#47545E](https://via.placeholder.com/15/47545E/000000?text=+) | `#47545E` | **岩石灰**<br>內文主色，確保在淺色背景上有絕佳的閱讀體驗。 |
| `--text-dark` | ![#2C353C](https://via.placeholder.com/15/2C353C/000000?text=+) | `#2C353C` | **深炭灰**<br>標題 (H1-H6) 與重要資訊，取代純黑 `#000000` 以減少視覺疲勞。 |
| `--border-color` | ![#CFD8DC](https://via.placeholder.com/15/CFD8DC/000000?text=+) | `#CFD8DC` | **淺灰邊框**<br>卡片、輸入框的邊界。 |
| `--highlight-bg` | ![#E8ECEF](https://via.placeholder.com/15/E8ECEF/000000?text=+) | `#E8ECEF` | **高亮背景**<br>Hover 狀態、標籤背景。 |

## �️ 修改方式
直接修改 `static/css/custom.css` 中的 `:root` 變數即可全站套用。

```css
:root {
    --primary-color: #889CA9;
    --secondary-color: #DDE4E8;
    /* ... */
}
```
