# ⚔️ EchoWorld RPG — Discord Bot

> Một dự án Discord Bot mang trải nghiệm **Cày cuốc MMORPG** trọn vẹn lên Discord bằng **Native Slash Commands**.
> 
> Từ chọn Class, thám hiểm đánh yêu đương, khiêu chiến World Boss đến Chiếm Lãnh Địa Bang Hội, Đấu Trường Xếp Hạng, và Chợ Đen — tất cả đều có tại EchoWorld!

[![Discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white)](https://discord.js.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A518-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)

---

## 🤖 Về Dự Án

**EchoWorld (RPG Bot)** là kết quả của quá trình đại tu từ một bot đa dụng cũ (Giveaways, Casino...) trở thành một tựa game nhập vai chuyên sâu. 

### Key Highlights
- **Hệ Thống RPG Chuyên Sâu**: Cơ chế nhập vai cổ điển với 4 Class, hệ thống điểm kinh nghiệm, thăng cấp và Rebirth (Đầu thai) để tiếp tục đột phá sức mạnh.
- **Chiến Đấu & Yếu Tố Khung Cảnh**: Mỗi vùng đất (`Region`) mang đến những quái vật, lợi ích (Buff) và sự kiện ngẫu nhiên khác nhau. Tích hợp tương tác nguyên tố (Hỏa > Mộc > Nước > Hỏa) và Kỹ năng (Skills).
- **Bang Hội & Lãnh Địa**: Tính năng Bang Hội với Quỹ vàng, Cấp độ, và hệ thống cắm cờ Chiếm Đất nhận Buff độc quyền.
- **World Boss & Sự kiện toàn cầu**: Toàn server chung tay tiêu diệt Boss Khu Vực, hoặc đương đầu với Huyết Nguyệt (Blood Moon) do Admin giáng trần.
- **Kiểm soát lạm phát**: Chợ giao dịch (`/market`) và nâng cấp (Forge) đều được thiết kế khéo léo để rút tiền ra khỏi thị trường.

---

## 📑 Danh Sách Lệnh RPG (Slash Commands)

Tất cả các lệnh bắt đầu với `/`, đi kèm hình ảnh/gif, giao diện embed và button tương tác trực quan.

### Khởi Đầu Chiều Hướng
| Lệnh | Tính năng |
|------|-----------|
| `/start` | Tạo nhân vật và chọn 1 trong 4 Class: **Warrior, Mage, Archer, Assassin**! |
| `/help` | Xem danh sách tổng hợp tất cả các lệnh kèm mô tả chi tiết. |
| `/howtoplay` | Cẩm nang tân thủ, hướng dẫn cách chơi và các mẹo cơ bản. |
| `/profile` | Xem thông tin nhân vật, HP, Mana, ATK, DEF, Class, Rebirth và Stats. |

### Khám Phá & Chiến Đấu
| Lệnh | Tính năng |
|------|-----------|
| `/explore` | Thám hiểm vùng đất hiện tại. Đánh quái (có tỉ lệ gặp Quái Shiny, Elite) hoặc gặp Sự kiện để nhặt vật phẩm. |
| `/travel` | Di chuyển sang vùng đất mới (Tân Thủ Thôn, Rừng Già, Sa Mạc...) khi đủ cấp độ! |
| `/mine` | Đi đào khoáng sản (Iron, Gold, Magic Core...) để rèn trang bị. |
| `/fish` | Câu cá giải trí thư giãn, nhận nguyên liệu hoặc thực phẩm. |

### Trang Bị & Kỹ Năng
| Lệnh | Tính năng |
|------|-----------|
| `/inventory` | Xem túi đồ: Vật phẩm, Nguyên liệu, Rác... |
| `/equip` | Trang bị Vũ khí, Giáp, Trang sức để tăng vọt chỉ số ATK, DEF, Max HP. |
| `/forge` | Cường hóa trang bị (+1 đến +15) bằng Vàng và quặng. Cẩn thận rớt cấp khi rèn thất bại! |
| `/dismantle`| Phân tách đồ cũ lấy lại nguyên liệu. |
| `/skill` | Mua và trang bị tối đa 3 kỹ năng Kích hoạt/Bị động (Tỉ lệ Crit, Hồi Máu, Phản sát thương). |
| `/pet` | Quản lý thú cưng, cho ăn và tiến hóa. (Đang mở rộng) |

### Lối Chơi Multiplayer & Xã Hội
| Lệnh | Tính năng |
|------|-----------|
| `/arena` | **Chế độ PvP Ranked**. Khiêu chiến người chơi khác, nhận Elo và leo hạng từ ĐỒNG (Bronze) lên KIM CƯƠNG (Diamond). |
| `/boss` | Khi thanh máu của World Boss xuất hiện, dùng lệnh này để hợp sức cùng cả Server chiến đấu. Ai gây Dame cao sẽ chễm chệ trên Bảng Xếp Hạng Nhận Thưởng! |
| `/guild` | Bao gồm các Subcommands: `create`, `info`, `join`, `leave`, `donate`. Lập bang, kêu gọi anh em. |
| `/guild claim`| **Lãnh Địa Chiến:** Phủ cờ Bang của bạn lên Region để toàn bang được x2 lợi ích (EXP, Drop Rate)! |
| `/market` | Đăng bán (Sell), Mua (Buy) và Tìm kiếm (List) vật phẩm trên Chợ Đen. Áp dụng 10% Thuế giao dịch chống lạm phát. |

### Quản Lý Tính Năng Đặc Biệt
| Lệnh | Tính năng |
|------|-----------|
| `/quest` | Hoàn thành bộ Nhiệm Vụ Hàng Ngày (Đánh 10 quái, Đào 5 khoáng...) để nhận rương báu. |
| `/daily` | Nhận quà báo danh hằng ngày. |
| `/shop` | Mua hòm gacha hoặc vật phẩm thiết yếu từ NPC. |
| `/rebirth` | Tính năng Cày Thuê: Đạt cấp độ tối đa, Reset về Lv1 để đổi lấy Cấp Rebirth (+10% mọi chỉ số vĩnh viễn)! |

---

## 🛠️ Quyền Quản Trị Server (Admin)

| Lệnh | Tính năng |
|------|-----------|
| `/admin event` | Bật/Tắt các sự kiện Toàn Server. VD: `blood_moon` (Quái trâu hơn nhưng Vàng x1.5), `enlightenment` (+50% EXP rớt)! |
| `/givegold` | Build-in Owner. Cấp vàng cho người chơi phục vụ Test hoặc Event mồm. |

---

## 🚀 Cài Đặt và Biến Server của Bạn thành Thế Giới Game

### Yêu Cầu Hệ Thống

- [Node.js](https://nodejs.org/) **v18.0.0**+
- Một Database PostgreSQL (Được cấu hình thông qua gói thư viện nội bộ hoặc môi trường).

### Hướng Dẫn Nhanh

1. **Clone mã nguồn**
   ```bash
   git clone https://github.com/your-username/bot-discord.git
   cd bot-discord
   ```

2. **Cài đặt thư viện**
   ```bash
   npm install
   ```

3. **Thiết lập biến môi trường**
   Tạo file `.env` ở thư mục gốc:
   ```env
   DISCORD_TOKEN=your_bot_token_here
   OWNER_ID=your_discord_user_id
   DB_HOST=localhost
   DB_USER=postgres
   ... (các config database khác)
   ```

4. **Đăng ký Slash Commands & Chạy Bot**
   ```bash
   npm run deploy  # Nếu có script deploy command riêng
   npm start
   ```

---

## 📁 Cấu Trúc Dự Án Hiện Tại

```text
RPG-bot/
├── src/
│   ├── index.js              # Entry point của Bot
│   ├── database/             # Connect với PostgreSQL, Schema tables (players, inventory, world_states)
│   ├── events/               # interactionCreate.js (Xử lý Core Combat Loop và Nút bấm)
│   ├── commands/             # Các Slash Commands được chia thư mục (Rpg, Admin, Owner...)
│   └── utils/                # Các thư viện Logic (rpgData.js, combatLogic.js, itemsData.js, rpgLogic.js)
├── .env           
└── package.json
```

---

*“Thế giới EchoWorld đang chờ bạn khai phá!”*
