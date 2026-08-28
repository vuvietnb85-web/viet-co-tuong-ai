# VIET CỜ TƯỚNG AI — PLAN

## Mục tiêu
Xây dựng trải nghiệm cờ tướng dark mode tỷ lệ 9:16, ưu tiên mobile, với hai camera live có thể kéo thả, bàn cờ tương tác, AI phía trình duyệt và các lớp hiệu ứng trang trí không chặn thao tác.

## Risk slices
1. **Board interaction:** mô hình bàn cờ 9×10, luật đi cơ bản của các quân Việt hóa, bắt quân, undo/reset và kiểm tra không tự chiếu tướng.
2. **AI:** minimax alpha-beta có sắp xếp nước ăn quân và heuristic vật chất/vị trí, chạy không chặn UI qua setTimeout.
3. **Camera:** yêu cầu hai MediaStream độc lập với facingMode user/environment, hiển thị trạng thái permission, tắt stream khi unmount và kéo thả theo phần trăm khung sân.
4. **Visual layering:** 5 lớp rõ ràng; layer 1–3 pointer-events none; chỉ layer camera và bàn cờ/control nhận tương tác.

## Verification criteria
- Preview hiển thị đúng khung 9:16 ở viewport di động và desktop.
- Click quân đỏ → ô hợp lệ → AI tự đi; capture tạo badge emblem; undo/reset hoạt động.
- Hai ô camera có nút bật và có thể kéo bằng pointer/touch.
- Cá vàng, advertisement path và reward emblem xuất hiện nhưng không cản click.
- `pnpm check`, `pnpm test`, `pnpm build` không lỗi.

## Assumptions
- Không dùng backend AI bên ngoài để đảm bảo app chơi được ngay cả offline sau khi tải; AI là minimax client-side.
- Camera thực tế cần HTTPS và quyền trình duyệt; khi preview bị chặn, UI hiển thị trạng thái để người dùng bật lại.
- Asset logo là emblem trừu tượng không chữ/không nhãn hiệu cụ thể theo yêu cầu logo không tên.
