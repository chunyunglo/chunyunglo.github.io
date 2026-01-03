# 圖片格式支援指南

本網站支援多種圖片格式，您可以自由選擇最適合的格式。

## 支援的格式

### ✅ 完全支援（自動優化）
- **JPG/JPEG** - 適合照片、背景圖
- **PNG** - 適合需要透明背景的圖片（logo、圖示）
- **WEBP** - 現代格式，檔案更小，品質更好

### ⚠️ 部分支援（不會自動優化）
- **SVG** - 向量圖，適合 logo 和圖示
- **GIF** - 動畫圖片

## 如何更換圖片

### 1. 作者頭像
**位置**: `assets/images/author/`
**配置**: `data/zh-tw/author.yaml` 或 `data/en/author.yaml`

```yaml
image: "images/author/chunyung.png"  # 可改為 .jpg, .jpeg, .webp
```

### 2. 背景圖片
**位置**: `assets/images/site/`
**配置**: `hugo.yaml`

```yaml
params:
  background: /images/site/background.jpg  # 可改為 .png, .webp
```

### 3. Logo 和 Favicon
**位置**: `assets/images/site/`
**配置**: `hugo.yaml`

```yaml
params:
  logo:
    main: /images/site/main-logo.png      # 建議使用 PNG（透明背景）
    inverted: /images/site/inverted-logo.png
    favicon: /images/site/favicon.png
```

### 4. 技能圖示
**位置**: `assets/images/sections/skills/`
**配置**: `data/zh-tw/sections/skills.yaml` 或 `data/en/sections/skills.yaml`

```yaml
- name: Kubernetes
  logo: /images/sections/skills/kubernetes.png  # 可改為 .jpg, .svg
```

### 5. 專案圖片
**位置**: `assets/images/sections/projects/`
**配置**: `data/zh-tw/sections/projects.yaml` 或 `data/en/sections/projects.yaml`

```yaml
- name: Toha
  logo: /images/sections/projects/toha.png  # 可改為 .jpg, .webp
  image: /images/sections/projects/toha_website.png  # 專案預覽圖
```

### 6. 經驗/教育機構 Logo
**位置**: `assets/images/sections/experiences/` 或 `assets/images/sections/education/`
**配置**: 對應的 YAML 檔案

```yaml
- company:
    logo: /images/sections/experiences/company1.jpg  # 可改為 .png, .webp
```

## 圖片優化建議

### JPG/JPEG
- **適用**: 照片、背景圖、沒有透明需求的圖片
- **優點**: 檔案小、瀏覽器支援度高
- **建議品質**: 85-95%
- **建議尺寸**: 
  - 背景圖: 2560x1440 或更大
  - 頭像: 600x600
  - Logo: 200x200

### PNG
- **適用**: Logo、圖示、需要透明背景的圖片
- **優點**: 支援透明背景、無損壓縮
- **缺點**: 檔案較大
- **建議**: 使用 PNG-8（256色）而非 PNG-24（真彩色）可減小檔案

### WEBP
- **適用**: 所有類型（現代瀏覽器）
- **優點**: 檔案最小、品質最好、支援透明
- **缺點**: 舊瀏覽器可能不支援
- **建議**: 作為主要格式，搭配 JPG/PNG 作為後備

### SVG
- **適用**: 簡單的 logo、圖示
- **優點**: 無限縮放不失真、檔案極小
- **注意**: 不會被 Hugo 自動優化處理

## 自動處理機制

網站會自動對圖片進行以下處理：

1. **格式檢測**: 自動識別 JPG、PNG、WEBP
2. **尺寸優化**: 根據使用場景調整大小
3. **品質優化**: 使用 `q100` 確保最高品質
4. **響應式載入**: 根據螢幕大小載入適當尺寸
5. **排除特殊格式**: SVG 和 GIF 不會被處理（保持原樣）

## 快速更換圖片步驟

1. 將新圖片放入對應的 `assets/images/` 目錄
2. 更新對應的 YAML 配置檔案中的路徑
3. 重新啟動 Hugo 伺服器（`hugo server`）
4. 檢查網站顯示是否正常

**注意**: 圖片路徑必須以 `/images/` 開頭，對應 `assets/images/` 目錄。

## 疑難排解

### 圖片不顯示
- 檢查檔案路徑是否正確
- 確認檔案確實存在於 `assets/images/` 目錄
- 檢查檔案名稱大小寫是否一致
- 重新啟動 Hugo 伺服器

### 圖片模糊
- 確認原始圖片解析度足夠高
- 檢查 Hugo 配置中的品質設定（應為 `q100`）
- 考慮使用更大尺寸的原始圖片

### 載入速度慢
- 考慮轉換為 WEBP 格式
- 壓縮原始圖片檔案大小
- 使用適當的圖片尺寸（不要過大）
