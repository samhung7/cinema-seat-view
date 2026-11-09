# 影廳座位視角（3D Cinema Seat View）

從影城的 2D 座位圖點選座位，飛入程式生成的 3D 影廳，預覽從該座位看銀幕的畫面，並顯示到銀幕距離、水平視角、偏離中心、抬頭角度與推薦度。不含售票功能。

## 使用

程式用 ES modules，需要透過本機伺服器開啟（直接雙擊 `index.html` 會被瀏覽器擋下）：

```bash
npm start            # 等同 python3 -m http.server 8000
# 打開 http://localhost:8000
npm test             # 跑領域邏輯的單元測試（Node 18+）
```

Three.js 從 jsDelivr 載入，需要網路。

1. 在上方選擇影廳（目前內建台北信義威秀 1、2(4DX)、3、5、6、7、9、10、12、14、15、16 廳）。
2. 點選座位，按「看座位視角」。
3. 拖曳畫面轉頭，左右箭頭換到隔壁座位。

## 影廳資料格式

右上角設定可編輯影廳 JSON。`rows` 每一行是一排，冒號後每個格子對應座位圖上的一欄：

- 數字：座號；`1-4`：連續座號
- `W`：輪椅位
- `.`：空格或走道

```json
"rows": ["A: 1-4 . 5-16 . 17-20", "I: 1 2 W . . 5-14 W . . . W 19 20"]
```

座位排列依信義威秀官網座位圖轉錄；銀幕尺寸、排距、階梯高度等 3D 尺寸為依座位數推估，非實測值。

## 程式架構

```
index.html                 只放畫面結構
css/                       依畫面拆分：base / seat-map / seat-view / settings
js/
  main.js                  進入點：建立具體實作並注入 App
  app.js                   組裝層：狀態流轉，把各元件接起來
  core/store.js            極簡狀態容器（訂閱 / 通知）
  config/seat-types.js     座位類型登錄表（名稱、顏色、圖示）
  data/vieshow-xinyi.js    信義威秀各廳座位排列
  domain/                  純邏輯，不碰 DOM 與 three.js，可用 Node 測試
    row-layout.js            排格式解析、欄位與走道座標
    hall-model.js            影廳 JSON → 每個座位的 3D 位置
    hall-estimator.js        只有座位圖時推估 3D 尺寸
    hall-validator.js        檢查使用者編輯的 JSON
    screen-geometry.js       弧形銀幕幾何
    seat-metrics.js          距離、視角、推薦度計算
    seat-format.js           座位名稱文字
  infra/storage.js         localStorage 包裝與自訂影廳存取
  ui/                      DOM 元件，各自只管一塊畫面
  three/                   3D：檢視器、場景生成、座椅造型、相機控制、銀幕貼圖
tests/                     domain 層單元測試
```

設計原則（SOLID）：

- **單一職責**：每個模組只做一件事，例如 `seat-metrics.js` 只算數據，`seat-sheet.js` 只顯示數據。
- **開放封閉**：新增座位類型、廳型或警示規則，是在登錄表加一筆（`seat-types.js`、`seat-geometry.js`、`hall-estimator.js` 的 `PROFILES`、`seat-metrics.js` 的 `WARNINGS`），不用改既有流程。
- **依賴反轉**：`App` 不直接 import 影城資料、儲存或 3D 引擎，而是由 `main.js` 注入；`buildHallModel` 的評分方式、`CinemaViewer` 的場景生成也都是注入的。換影城資料或換 3D 引擎只要改 `main.js`。
- **介面隔離**：UI 元件只收到自己需要的回呼（例如 `SeatSheet` 只知道上一個、下一個、換座位）。

技術：Three.js 0.170（InstancedMesh 座椅、弧形銀幕、UnrealBloom），無建置步驟。
