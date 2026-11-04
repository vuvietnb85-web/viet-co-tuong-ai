# VIET Cờ Tướng AI — Vietnamese Xiangqi (Chinese Chess) Web Game with AI and Live Cameras

🔗 **Live demo / Chơi thử ngay:** https://vuvietnb85-web.github.io/viet-co-tuong-ai/

**VIET Cờ Tướng AI is a dark-mode, mobile-first (9:16) web game for playing Xiangqi (cờ tướng) against a minimax alpha-beta AI, with two draggable live camera views on the board screen.**

## Features

- Interactive 9×10 Xiangqi board with Vietnamese labels (coordinates A–I · 1–10).
- Basic movement rules for every piece, captures, and a check that you cannot leave your own general in check.
- AI opponent: minimax with alpha-beta pruning (depth 3), capture ordering and material/position heuristics; runs in the browser without blocking the UI.
- Move history, undo (hoàn tác), new game (trận mới) and hint.
- Two live camera streams (front `user` / rear `environment`) that can be dragged around the screen, with permission status.
- Sound effects via Web Audio API; five layered visual effect planes that never block input.
- Gameplay unit tests (Vitest).

## How to run

Requirements: Node.js 20+ and pnpm.

```bash
pnpm install
pnpm dev        # local development server
pnpm build      # production build
pnpm start      # run the production build
```

Run tests with `pnpm test`.

## Tech stack

React, TypeScript, Vite, Tailwind CSS, shadcn/ui, tRPC + Express server, Drizzle ORM schema (MySQL), Vitest, Web APIs (`getUserMedia`, Web Audio API).

## FAQ

**What is VIET Cờ Tướng AI?** A Vietnamese-language Xiangqi (Chinese chess) game in the browser where you play red against an AI.

**How does the AI think?** It searches 3 plies deep with minimax and alpha-beta pruning, ordering captures first and scoring material and position.

**Why does it ask for camera access?** To show two optional live camera tiles (front and rear). The game is playable without granting access.

**Can I undo a move?** Yes — use HOÀN TÁC (undo); TRẬN MỚI starts a new game.

## Tiếng Việt

**VIET Cờ Tướng AI** là game **cờ tướng online chơi với máy** bằng tiếng Việt, giao diện tối dọc 9:16 cho điện thoại. AI dùng thuật toán minimax alpha-beta độ sâu 3, có lịch sử nước đi, hoàn tác, trận mới, gợi ý, và hai camera trực tiếp (trước/sau) kéo thả được trên màn hình.

Từ khóa: cờ tướng, chơi cờ tướng với máy, cờ tướng AI, cờ tướng tiếng Việt, Xiangqi.

## Support / Ủng hộ

If this project helps you, you can support the author:

- ☕ Ko-fi: https://ko-fi.com/quocvietvu
- 💙 PayPal: https://www.paypal.com/donate?business=vuvietnb85%40gmail.com&currency_code=USD

## Author

**Vu Quoc Viet (Vũ Quốc Việt)** — VXO Digital Lab, Vietnam · GitHub [@vuvietnb85-web](https://github.com/vuvietnb85-web)

## 📺 Trình phát media tích hợp / Built-in media player

Nút **▶︎ Media** nổi ở góc màn hình mở một bảng toàn màn hình (giao diện tiếng Việt):

- **TV tiếng Việt**: một số kênh địa phương phát HLS công khai (hls.js), đã thử phát được trên trình duyệt ngày 05/11/2026. Các kênh không cho nhúng (VTV, HTV, THVL, Hà Nội, DRT, NTV…) chỉ có nút mở trang chính thức của đài. Không dùng nguồn phát lại lậu. Luồng do đài cung cấp, có thể ngừng bất cứ lúc nào.
- **Radio**: VOV1–VOV5, VOV Giao thông Hà Nội / TP.HCM, VOV Mekong (luồng công khai của VOV).
- **Nhạc tải lên**: chọn tệp hoặc cả thư mục; lưu trên máy bằng IndexedDB (không tải lên mạng). Dung lượng **không giới hạn cứng nhưng phụ thuộc bộ nhớ thiết bị và hạn mức trình duyệt**. Có trộn bài, lặp, điều khiển trên màn hình khoá (Media Session).
- **Đọc EPUB** (epub.js): mục lục, cỡ chữ, nền tối, nhớ vị trí đọc.
- **OCR ảnh / PDF scan** (tesseract.js, tiếng Việt + tiếng Anh): xử lý ngay trên máy; lần đầu cần tải dữ liệu ngôn ngữ (~vài MB). Sao chép hoặc tải về .txt.

EN: a floating **▶︎ Media** button opens Vietnamese TV (legal public streams only; others link to the official site), VOV radio, a local music library stored in IndexedDB (capacity limited by device/browser storage), an EPUB reader and on-device Vietnamese/English OCR. Heavy libraries are lazy-loaded.
