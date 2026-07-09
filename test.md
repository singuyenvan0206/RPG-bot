# KỊCH BẢN THUYẾT TRÌNH DỰ ÁN MTBA (Movie Ticket Booking App)

---

## Nội dung 1: Lời mở đầu (Hook & Khởi động)

**Kính chào Hội đồng Giám khảo/Quý Thầy Cô và các bạn sinh viên/khán giả đang có mặt trong buổi bảo vệ/thuyết trình ngày hôm nay.**

*Kính thưa quý vị,*
Chắc hẳn ở đây, hầu hết chúng ta đều đã từng ít nhất một lần đặt vé xem phim qua các ứng dụng như CGV, Lotte hay Galaxy. Và không ít lần chúng ta gặp phải những trải nghiệm "cười ra nước mắt": Đang thanh toán thì app bị văng, chuyển khoản xong tiền bị trừ nhưng vé thì không thấy đâu, hay khi ra quầy mua vé trực tiếp thì nhân viên phải xoay vội cái màn hình hoặc in tạm một tờ giấy có mã QR mờ tịt để chúng ta quét thanh toán.

Những "điểm nghẽn" (pain-points) nhỏ đó không chỉ gây khó chịu cho khách hàng mà còn làm tăng chi phí vận hành và chăm sóc khách hàng cho các rạp phim.

Từ chính những trăn trở về trải nghiệm thực tế đó, nhóm chúng em đã nghiên cứu và phát triển dự án **MTBA - Movie Ticket Booking App**.

---

## Nội dung 2: Mục tiêu & Phạm vi Dự án (Project Scope)

### 2.1. Mô tả ngắn gọn dự án

**MTBA - Movie Ticket Booking App** là một nền tảng trực tuyến toàn diện được thiết kế nhằm phục vụ nhu cầu đặt vé của khách hàng và tối ưu hóa quy trình quản lý rạp chiếu phim.

**Hệ thống này làm gì?**

* **Đối với Khách hàng**: Cho phép duyệt phim đang chiếu/sắp chiếu, xem thông tin chi tiết (trailer, diễn viên), chọn ghế trống trên sơ đồ trực quan và thanh toán qua VietQR. Sau khi đặt thành công, hệ thống tự động gửi email xác nhận kèm mã QR vé.
* **Đối với Nhân viên tại quầy (POS)**: Hỗ trợ đặt vé trực tiếp cho khách và đồng bộ hiển thị màn hình phụ POS2 một chiều — khách hàng tự đối chiếu thông tin, không gây lỗi lặp điều hướng vô hạn.
* **Đối với Quản trị viên (Admin)**: Cung cấp Dashboard thống kê doanh thu, quản lý phim, rạp chiếu, lịch chiếu (có kiểm tra trùng giờ), giá vé, tin tức và tài khoản người dùng.

**Hệ thống giải quyết các vấn đề thực tế nào?**

| Pain Point | Giải pháp của MTBA |
|---|---|
| Xếp hàng chờ mua vé | Đặt vé trực tuyến 24/7 từ bất kỳ thiết bị nào |
| Không thấy vị trí ghế khi mua trực tiếp | Sơ đồ ghế trực quan real-time (Standard / VIP / Sweetbox) |
| Chuyển khoản sai, xác nhận thủ công chậm | Webhook SePay + Active Polling, tự động đối soát tức thì |
| Màn hình POS nhân viên quay lưng về phía khách | Passive Display POS2 hiển thị đồng bộ hóa đơn và mã QR |
| Bỏ lỡ khuyến mãi, sự kiện | Trang chủ slideshow tổng hợp Festival, News, Promotion |

### 2.2. Phạm vi dự án & Vai trò thành viên

Đây là một **Dự án Nhóm (Group Project)** được phát triển theo mô hình **Agile/Scrum** với **4 thành viên**, chia thành **4 Sprints** trong vòng 8 tuần.

| Thành viên | Vai trò chính | Nhiệm vụ chi tiết |
| :--- | :--- | :--- |
| **Thành viên A** | Scrum Master & Backend Developer | Điều phối Sprint, thiết kế kiến trúc NestJS. Triển khai API đặt vé, thanh toán, tích hợp SePay Webhook & Active Polling. Hệ thống xử lý lỗi tập trung, bảo mật Bcrypt + Pepper. |
| **Thành viên B** | Frontend Developer | Thiết kế UI/UX bằng Next.js + Tailwind CSS v4. Luồng đặt vé online, giao diện POS. Cơ chế đồng bộ một chiều Passive Display POS2. Tích hợp & xử lý lỗi API từ Backend. |
| **Thành viên C** | Database Designer & Backend Developer | Thiết kế CSDL qua Prisma ORM. API quản trị (phim, rạp, lịch chiếu, giá vé). Thuật toán kiểm tra trùng lịch chiếu (Overlap Check). Quản lý Prisma Migrations. |
| **Thành viên D** | Product Owner & QA | Quản lý Product Backlog, viết User Stories. Thiết kế Test Cases. Viết Unit Test bằng Jest (Đăng ký/Đăng nhập, Đặt vé, Thanh toán). Theo dõi tiến độ trên Trello. |

**Cách quản lý tiến độ:**
* **Sprint Planning**: Đầu mỗi Sprint, nhóm họp để xác định User Stories sẽ hoàn thành trong 2 tuần.
* **Daily Standup**: Cập nhật nhanh tiến độ hằng ngày — làm gì hôm qua, làm gì hôm nay, vướng mắc gì.
* **Sprint Review & Retrospective**: Cuối Sprint, demo tính năng và rút kinh nghiệm để cải thiện Sprint tiếp theo.

---

## Nội dung 3: Thiết kế Hệ thống & Phân tích Dữ liệu (System Design & DB)

### 3.1. Biểu đồ Use Case

Dưới đây là sơ đồ phân cấp chức năng của hệ thống MTBA theo từng tác nhân (Guest, Customer, Staff, Admin):

```mermaid
graph TD
    %% Actors
    Guest[Khách vãng lai]
    Customer[Khách hàng đã đăng nhập]
    Staff[Nhân viên quầy POS]
    Admin[Quản trị viên]

    %% Use Cases Guest
    subgraph UC_Guest [Nhóm Khách Vãng Lai]
        UC1(Đăng ký / Đăng nhập)
        UC2(Xem phim đang chiếu / sắp chiếu)
        UC3(Xem chi tiết phim & trailer)
        UC4(Tra cứu lịch chiếu & giá vé)
    end

    %% Use Cases Customer
    subgraph UC_Customer [Nhóm Khách Hàng]
        UC5(Quản lý tài khoản cá nhân)
        UC6(Đặt vé: Chọn lịch chiếu & ghế)
        UC7(Thanh toán trực tuyến VietQR)
        UC8(Nhận email xác nhận vé)
        UC9(Xem lịch sử đặt vé & mã QR)
    end

    %% Use Cases Staff
    subgraph UC_Staff [Nhóm Nhân Viên POS]
        UC10(Đặt vé trực tiếp tại quầy)
        UC11(Đồng bộ màn hình phụ POS2 cho khách)
    end

    %% Use Cases Admin
    subgraph UC_Admin [Nhóm Quản Trị Viên]
        UC12(Thống kê doanh thu & Dashboard)
        UC13(Quản lý phim, rạp, phòng chiếu & ghế)
        UC14(Quản lý lịch chiếu - Kiểm tra trùng giờ)
        UC15(Quản lý người dùng & phân quyền)
        UC16(Quản lý giá vé, tin tức & sự kiện)
    end

    Guest --> UC1
    Guest --> UC2
    Guest --> UC3
    Guest --> UC4

    Customer --> UC5
    Customer --> UC6
    Customer --> UC7
    Customer --> UC8
    Customer --> UC9

    Staff --> UC10
    Staff --> UC11

    Admin --> UC12
    Admin --> UC13
    Admin --> UC14
    Admin --> UC15
    Admin --> UC16
```

**Sơ đồ Use Case chi tiết — Vai trò Admin (bao gồm nghiệp vụ include):**

```mermaid
graph TD
    Admin[Quản trị viên] --> UC20(Đăng nhập hệ thống Admin)
    Admin --> UC21(Quản lý Phim & Thể loại)
    Admin --> UC22(Quản lý Lịch chiếu - Showtime)
    UC22 -->|include| UC23(Kiểm tra trùng lịch - Overlap Check)
    Admin --> UC23_1(Quản lý Giá vé - Ticket Prices)
    Admin --> UC24(Quản lý Phòng chiếu & Sơ đồ ghế)
    Admin --> UC25(Quản lý Rạp chiếu - Theaters)
    Admin --> UC26(Quản lý Người dùng & Phân quyền)
    Admin --> UC27(Xem Dashboard & Biểu đồ thống kê)
    Admin --> UC28(Quản lý Tin tức, Sự kiện & Khuyến mãi)
```

---

### 3.2. Mô hình Thực thể Kết hợp (ERD)

Sơ đồ ERD biểu diễn mối quan hệ giữa các bảng trọng tâm, được định nghĩa trong [schema.prisma](file:///c:/Users/Simsimi/OneDrive/Máy tính/MTBA/code/backend/prisma/schema.prisma):

```mermaid
erDiagram
    user {
        Int id PK
        String first_name
        String last_name
        String email UK
        String password
        String phone UK
        user_status status
        DateTime created_at
    }
    role {
        Int id PK
        role_role_name role_name UK
    }
    userrole {
        Int user_id FK
        Int role_id FK
    }
    theater {
        Int id PK
        String name
        String location
        String phone
    }
    roomtype {
        Int id PK
        String name UK
        String description
    }
    screen {
        Int id PK
        String name
        Int seat_capacity
        Int theater_id FK
        Int roomtype_id FK
    }
    seat {
        Int id PK
        Int screen_id FK
        String seat_number
        Boolean is_booked
        seat_type type
    }
    movie {
        Int id PK
        String title
        String descriptions
        Int duration
        DateTime release_date
        String age_limit
        String trailer
    }
    genre {
        Int id PK
        String genre_name
    }
    moviegenre {
        Int movie_id FK
        Int genre_id FK
    }
    movieroomtype {
        Int movie_id FK
        Int roomtype_id FK
    }
    showtime {
        Int id PK
        Int screen_id FK
        Int movie_id FK
        DateTime start_time
        DateTime end_time
    }
    ticketprice {
        Int id PK
        ticketprice_type_seat type_seat
        Int roomtype_id FK
        Float price
        Boolean day_type
        DateTime start_time
        DateTime end_time
    }
    booking {
        Int id PK
        Int user_id FK
        Int showtime_id FK
        Int total_seat
        Float total_price_movie
        DateTime created_at
    }
    bookingseat {
        Int id PK
        Int booking_id FK
        Int seat_id FK
        Int quantity
    }
    payment {
        Int id PK
        Int booking_id FK
        payment_payment_method payment_method
        payment_payment_status payment_status
        Float amount
        String transaction_id
        DateTime payment_time
    }
    festival {
        Int id PK
        String title
        DateTime start_time
        DateTime end_time
    }
    news {
        Int id PK
        String title
        String content
        Int festival_id FK
    }

    user ||--o{ userrole : "has roles"
    role ||--o{ userrole : "assigned to"
    user ||--o{ booking : "places"
    theater ||--o{ screen : "has"
    roomtype ||--o{ screen : "defines format"
    screen ||--o{ seat : "contains"
    screen ||--o{ showtime : "hosts"
    movie ||--o{ showtime : "scheduled in"
    movie ||--o{ moviegenre : "has"
    genre ||--o{ moviegenre : "belongs to"
    movie ||--o{ movieroomtype : "supports"
    roomtype ||--o{ movieroomtype : "belongs to"
    roomtype ||--o{ ticketprice : "applies to"
    showtime ||--o{ booking : "receives"
    booking ||--o{ bookingseat : "contains seats"
    seat ||--o{ bookingseat : "selected in"
    booking ||--o{ payment : "has"
    festival ||--o{ news : "contains"
```

### 3.2.1. Luồng dữ liệu đặt vé chi tiết qua các thực thể (Booking Data Flow)

*Kính thưa Hội đồng, để làm rõ cách các bảng dữ liệu phối hợp xử lý trong quá trình khách hàng thực hiện một giao dịch đặt vé, dữ liệu sẽ đi qua các thực thể trong ERD theo luồng như sau:*

1. **Khởi tạo ngữ cảnh (Movie → Showtime → Seat):**
   * Hệ thống truy vấn phim (`movie`) và phòng chiếu (`screen`) để xác định các suất chiếu cụ thể (`showtime`).
   * Khi khách hàng xem sơ đồ phòng chiếu, hệ thống tải danh sách các ghế (`seat`) thuộc phòng (`screen_id`) của suất chiếu đó để hiển thị trạng thái trống/đã được giữ.

2. **Xác định giá vé (Ticket Price):**
   * Dựa trên loại ghế khách chọn (`seat.type`: Standard, VIP, Sweetbox) kết hợp cấu hình phòng (`roomtype_id`) và khung giờ suất chiếu (`showtime.start_time`), hệ thống truy vấn bảng `ticketprice` tương ứng để lấy ra giá vé chính xác cho từng ghế.

3. **Tạo giao dịch đặt vé (User → Booking → Booking Seat):**
   * Sau khi kiểm tra hợp lệ (không vượt quá 8 ghế), một bản ghi mới được ghi nhận vào bảng `booking` liên kết với tài khoản khách hàng (`user_id`) và suất chiếu (`showtime_id`).
   * Đồng thời, danh sách các ghế được chọn sẽ được lưu vào bảng trung gian `bookingseat` (liên kết `booking_id` với các `seat_id` tương ứng). Lúc này, trạng thái của các ghế liên quan tạm thời được khóa ở mức ứng dụng (soft-lock).

4. **Xử lý thanh toán (Booking → Payment):**
   * Một bản ghi thanh toán được tạo trong bảng `payment` liên kết với `booking_id` vừa tạo, mang trạng thái mặc định ban đầu là `PENDING` (chờ thanh toán).
   * Khi nhận được tín hiệu Webhook/Active Polling từ cổng SePay xác nhận chuyển khoản thành công với nội dung chứa mã đơn vé và số tiền khớp nhau:
     * Trạng thái `payment.payment_status` chuyển thành `COMPLETED`.
     * Ghế ngồi trong bảng `seat` chính thức được chuyển sang trạng thái đã bán (`is_booked = true`).
     * Đơn hàng hoàn tất và email vé QR được kích hoạt gửi tới người dùng.

5. **Kịch bản đặc thù 1: Xử lý vé quá hạn & Trùng ghế khi thanh toán trễ (Expired Booking / Seat Overlap)**
   * Nếu khách hàng chuyển khoản trễ khi bộ đếm giữ ghế đã về 0, bản ghi `booking` đã bị chuyển sang trạng thái quá hạn.
   * Khi Webhook của SePay kích hoạt, hệ thống sẽ thực hiện một lệnh truy vấn đối soát: kiểm tra xem các `seat_id` trong `bookingseat` thuộc đơn này đã bị một `booking` thành công (`payment_status = COMPLETED`) khác mua mất chưa.
   * **Trường hợp chưa bị trùng:** Hệ thống cập nhật trạng thái `payment.payment_status = COMPLETED`, đổi `is_booked = true` cho các ghế đó, cứu đơn thành công.
   * **Trường hợp đã bị trùng:** Hệ thống đánh dấu giao dịch thanh toán thất bại (`payment_status = FAILED`), giữ nguyên trạng thái ghế của người đặt sau và kích hoạt quy trình hoàn tiền (Refund).

6. **Kịch bản đặc thù 2: Đặt vé trực tiếp tại quầy của Nhân viên (POS Staff Booking)**
   * Nhân viên POS đăng nhập bằng tài khoản thuộc nhóm `user` liên kết với `userrole` là `ROLE_STAFF`.
   * Luồng tạo đơn `booking` và `bookingseat` diễn ra tương tự khách hàng trực tuyến.
   * Khác biệt ở phương thức thanh toán: Bản ghi `payment.payment_method` được thiết lập là `CASH` (tiền mặt) hoặc `TRANSFER` (chuyển khoản quầy). Trạng thái đơn được chuyển ngay sang `COMPLETED` mà không cần đợi Webhook từ SePay nếu nhân viên xác nhận đã nhận đủ tiền mặt.

7. **Kịch bản đặc thù 3: Admin quản lý và kiểm tra trùng lịch chiếu (Admin Showtime Collision)**
   * Admin thao tác thêm/sửa suất chiếu trong bảng `showtime`.
   * Trước khi lưu bản ghi vào MySQL, hệ thống truy vấn bảng `showtime` để đối chiếu: Tìm các suất chiếu có cùng `screen_id` mà khoảng thời gian (`start_time`, `end_time`) bị chồng chéo với suất chiếu mới (`new_start_time < existing_end_time` và `new_end_time > existing_start_time`).
   * Nếu phát hiện trùng lặp, hệ thống chặn không ghi dữ liệu và ném ra lỗi `OVERLAP`.

---

**Giải thích các nhóm bảng trọng tâm:**

| Nhóm | Các bảng | Vai trò |
|---|---|---|
| **Người dùng & Phân quyền** | `user`, `role`, `userrole` | Quản lý tài khoản và phân quyền 3 tầng (Admin/Staff/User) |
| **Rạp & Phòng chiếu** | `theater`, `screen`, `roomtype`, `seat` | Cấu trúc vật lý của rạp, loại phòng, sơ đồ ghế |
| **Phim & Thể loại** | `movie`, `genre`, `moviegenre`, `movieroomtype` | Thông tin phim, gán thể loại và loại phòng phù hợp |
| **Đặt vé & Thanh toán** | `showtime`, `booking`, `bookingseat`, `payment`, `ticketprice` | Luồng nghiệp vụ đặt vé, giá cả, và xử lý giao dịch |
| **Marketing** | `festival`, `news`, `promotion` | Quản lý tin tức, sự kiện chiếu phim và khuyến mãi |

---

### 3.3. Sơ đồ Kiến trúc & Triển khai (Architecture & Deployment Model)

*Kính thưa Hội đồng, để hiện thực hóa các nghiệp vụ phức tạp của dự án MTBA, chúng em đã thiết kế hệ thống theo mô hình kiến trúc phân tầng rõ ràng, đảm bảo tính dễ bảo trì, bảo mật cao và khả năng mở rộng linh hoạt.*

#### 1. Sơ đồ Kiến trúc Logic 3 Lớp (3-Tier Logical Architecture)

*Đầu tiên, đây là sơ đồ kiến trúc 3 lớp (3-Tier Architecture) phân chia rõ ràng các phân vùng nhiệm vụ của hệ thống:*

```mermaid
graph TB
    subgraph Client [Tầng Giao Diện - Presentation Layer]
        NextJS[Next.js 16 Client App Router]
        Tailwind[Tailwind CSS v4]
        POS2[Màn hình phụ POS2 - Passive Display]
    end

    subgraph Server [Tầng Xử Lý Logic - Business Logic Layer]
        NestJS[NestJS 11 Web Framework]
        Auth[Auth Service - JWT, bcrypt + pepper]
        Booking[Booking Service - Seat Limit Check, Showtime Overlap Check]
        Prisma[Prisma ORM Client]
    end

    subgraph Storage [Tầng Dữ Liệu - Database Layer]
        MySQL[(MySQL Database)]
    end

    subgraph External [Hệ Thống Bên Ngoài - External Services]
        SePay[Cổng VietQR - SePay Webhook / Active Polling]
        Mailer[Mail Service - SMTP / SendGrid]
    end

    %% Connections
    NextJS -->|REST APIs / JSON| NestJS
    NestJS -->|WebSockets / HTTP Polling| POS2
    NestJS -->|Prisma Queries| MySQL
    NestJS -->|Webhook callback / REST API| SePay
    NestJS -->|Sends Email Notifications| Mailer
```

**Giải thích nhanh 3 tầng chức năng:**
* **Tầng Giao Diện**: Next.js 16 đảm nhận render phía máy chủ (SSR) cho các trang public để tối ưu SEO, còn React 19 Client Components quản lý trạng thái động (chọn ghế, giữ chỗ). Màn hình POS2 đồng bộ một chiều từ Server để đảm bảo an toàn giao dịch tại quầy.
* **Tầng Xử Lý Logic**: NestJS 11 chịu trách nhiệm kiểm tra nghiệp vụ (không trùng lịch, chặn phe vé), mã hóa mật khẩu bảo mật cao (Salt & Pepper + Bcrypt), và tương tác DB thông qua Prisma ORM.
* **Tầng Dữ Liệu**: MySQL 8.x đảm bảo tính nhất quán ACID tuyệt đối, loại bỏ rủi ro trùng lặp ghế.

---

#### 2. Các Mô hình Triển khai Hệ thống (Deployment Models)

*Để đáp ứng linh hoạt từ nhu cầu thử nghiệm thực tế với chi phí tối ưu cho đến môi trường vận hành chuyên nghiệp của doanh nghiệp lớn, hệ thống MTBA sẵn sàng cho 2 mô hình triển khai:*

##### A. Mô hình đề xuất trên AWS (Enterprise Production Model)

*Đối với môi trường sản xuất thực tế quy mô lớn, chúng em đề xuất mô hình triển khai bảo mật cao trên hạ tầng điện toán đám mây Amazon Web Services (AWS) tận dụng VPC và Multi-AZ:*

```mermaid
graph TB
    %% Client & Routing
    Client[Khách hàng / Nhân viên POS / POS2] -->|HTTPS Requests| Route53[AWS Route 53 - DNS]
    Route53 -->|Forward Traffic| ALB[Application Load Balancer]

    subgraph VPC ["Amazon VPC (Virtual Private Cloud)"]
        subgraph Public_Subnet ["Public Subnet (Mạng Công Cộng - Nhận Traffic)"]
            ALB
            Bastion[Bastion Host - SSH Gateway]
        end
        
        subgraph Private_Subnet ["Private Subnet (Mạng Nội Bộ Bảo Mật - Chứa Logic & DB)"]
            %% EC2 Frontend
            subgraph EC2_Frontend ["EC2 Instance: Frontend (Presentation Layer)"]
                NginxFE["Nginx (Reverse Proxy & SSL)"]
                NextJS_Prod["Next.js 16+ App (Port 3000)"]
                NginxFE -->|Local Proxy| NextJS_Prod
            end

            %% EC2 Backend
            subgraph EC2_Backend ["EC2 Instance: Backend (Business Logic Layer)"]
                NginxBE["Nginx (Reverse Proxy)"]
                NestJS_Prod["NestJS 11+ App (Port 3001)"]
                Prisma_Prod["Prisma ORM Client"]
                
                NginxBE -->|Local Proxy| NestJS_Prod
                NestJS_Prod --- Prisma_Prod
            end

            %% Database Layer
            RDS[("Amazon RDS - MySQL 8.x Database (Multi-AZ)")]
        end
    end

    subgraph ExternalServices ["Hạ tầng & Dịch vụ bên ngoài"]
        SePay_Prod["SePay VietQR (Webhook + Active Polling)"]
        Mailer_Prod["SMTP Mail Service"]
    end

    %% Routing to instances
    ALB -->|HTTPS Port 443 -> Port 80/443| NginxFE
    ALB -->|HTTPS Port 8000 -> Port 80/443| NginxBE
    
    %% Communication between layers
    NextJS_Prod -->|"REST API (fetch) qua Public Domain"| ALB
    Prisma_Prod -->|Prisma Client TLS Connection| RDS
    SePay_Prod -->|"Webhook POST /payments-webhook"| ALB
    NestJS_Prod -->|"Gửi email xác nhận vé"| Mailer_Prod
```

**Phân tích chi tiết mô hình AWS:**
* **Bảo mật mạng (Amazon VPC)**: Toàn bộ máy chủ EC2 chạy mã nguồn ứng dụng và Amazon RDS MySQL Database đều được cô lập hoàn toàn trong **Private Subnet**, không gán IP public. Lưu lượng từ Internet chỉ đi qua Nginx thông qua **Application Load Balancer (ALB)** đặt tại **Public Subnet**.
* **Độ tin cậy & Sẵn sàng cao (High Availability)**: Sử dụng **Amazon RDS Multi-AZ** tự động nhân bản dữ liệu thời gian thực sang vùng độc lập vật lý khác để tự động failover lập tức khi xảy ra sự cố phần cứng.
* **Quản lý cấu hình**: Biến môi trường nhạy cảm (JWT Secret, API Key, Pepper) được bảo vệ bằng AWS Secrets Manager/SSM Parameter Store, được tải động khi chạy tiến trình.

##### B. Mô hình triển khai thực tế trên VPS (Actual VPS Deployment)

*Để phục vụ chạy thử nghiệm, báo cáo đồ án và tối ưu hóa chi phí vận hành ở mức thấp nhất, chúng em đã đóng gói và triển khai thực tế toàn bộ hệ thống trên một máy chủ ảo **VPS Ubuntu** độc lập sử dụng bộ công cụ **PM2** và **Nginx**:*

```mermaid
graph TD
    Client[Khách hàng / Nhân viên POS / POS2] -->|Cổng 80/443 HTTP/HTTPS| NginxBE["Nginx (Reverse Proxy & SSL termination)"]
    
    subgraph VPS [Máy chủ ảo VPS - Ubuntu OS]
        NginxBE -->|Proxy chuyển tiếp /| NextJS["Next.js Frontend (Port 3000)"]
        NginxBE -->|Proxy chuyển tiếp /api/| NestJS["NestJS Backend (Port 3001)"]
        
        subgraph PM2 ["PM2 (Process Manager)"]
            NextJS
            NestJS
        end
    end

    subgraph ExternalServices_VPS ["Hạ tầng & Dịch vụ ngoài"]
        NestJS -->|Kết nối Prisma Client| TiDB[("TiDB Cloud MySQL")]
        NestJS -->|Gửi Mail OTP/Vé| SMTP["SMTP Server (Gmail)"]
        SePay["Cổng SePay VietQR"] -->|Webhook callback| NginxBE
    end
```

**Phân tích chi tiết mô hình VPS thực tế:**
* **Nginx (Reverse Proxy & SSL)**: Tiếp nhận lưu lượng trên cổng 80/443, tự động phân giải chứng chỉ SSL (HTTPS Let's Encrypt) thông qua Certbot. Nginx điều hướng request trang chủ `/` sang Next.js (port 3000) và các API `/api/` trực tiếp đến NestJS (port 3001) sau khi đã viết lại (rewrite) URL.
* **PM2 Process Manager**: Giúp duy trì các tiến trình Node.js chạy ngầm liên tục dưới dạng daemon, tự động khởi động lại lập tức (autorestart) khi code bị crash hoặc khi VPS bị reboot.
* **TiDB Cloud Database**: Cơ sở dữ liệu MySQL Serverless phân tán trên đám mây, giúp giảm tải tài nguyên CPU/RAM cho VPS Ubuntu của chúng em nhưng vẫn đảm bảo tính tin cậy ACID cao.

---


### 3.4. Công nghệ sử dụng

#### 💡 Nguyên tắc lựa chọn: Framework thay vì Thư viện tự do

* **Next.js 16+ (App Router)**: Framework React tối ưu hóa SEO và tốc độ tải trang ban đầu (SSR + RSC) tốt hơn hẳn React Client-side Rendering truyền thống.
* **NestJS 11+**: Ép buộc cấu trúc modular (SOLID, Dependency Injection), tránh tình trạng code hỗn loạn khi dự án mở rộng quy mô.
* **Prisma ORM**: Đóng vai trò Single Source of Truth cho cơ sở dữ liệu qua file `schema.prisma`, tự động phát hiện lỗi type-safety từ lúc compile.
* **MySQL 8.x**: Hệ quản trị CSDL quan hệ tin cậy, tuân thủ ACID giúp loại bỏ hoàn toàn khả năng bị trùng lặp giao dịch/ghế ngồi.

**Bảng tổng hợp công nghệ:**

| Tầng | Công nghệ | Phiên bản |
|---|---|---|
| Frontend | Next.js + React | 16+ / 19 |
| Styling | Tailwind CSS | v4 |
| Backend | NestJS + TypeScript | 11+ |
| ORM | Prisma Client | Latest |
| Database | MySQL | 8.x |
| Auth | JWT + bcryptjs | — |
| Payment | SePay VietQR (Webhook + Polling) | — |
| Email | SMTP / Nodemailer | — |
| Testing | Jest | — |
| Package Mgmt | npm workspaces (Monorepo) | — |

---

## Nội dung 4: Phân tích So sánh & Tính ứng dụng thực tế

*Tuy nhiên, nếu chỉ dừng lại ở việc đáp ứng các chức năng này thì MTBA sẽ không có gì khác biệt so với hàng tá ứng dụng ngoài kia. Điểm làm nên giá trị cốt lõi nằm ở khả năng giải quyết trực tiếp các vấn đề mà đối thủ chưa làm tốt.*

### Vấn đề 1: Trải nghiệm thanh toán tại quầy (Passive Display Sync)
* **Thực trạng:** Ở CGV/Lotte, màn hình phụ chủ yếu chiếu quảng cáo. Nhân viên phải in bill nháp có mã QR hoặc dùng máy POS rời.
* **Giải pháp của MTBA:** **Đồng bộ hoá thời gian thực một chiều**. Màn hình phụ cập nhật lập tức theo tay Staff bấm, tự động render mã VietQR.
* **Giá trị thực tế:** Rút ngắn ít nhất 15-20 giây cho mỗi giao dịch tại quầy.

### Vấn đề 2: Nút thắt thanh toán Online (SePay VietQR vs Cổng trung gian)
* **Thực trạng:** Dùng VNPay/MoMo khách phải qua chuỗi redirect: App → Xác nhận → App rạp. Rất dễ rớt mạng.
* **Giải pháp của MTBA:** Tích hợp trực tiếp **SePay VietQR** — khách dùng *bất kỳ* app ngân hàng nào để quét mã, không bị chuyển hướng (no redirect).
* **Giá trị thực tế:** Giảm hẳn tỷ lệ bỏ dở đơn hàng (Drop-off rate).

### Vấn đề 3: Bài toán "Tiền đến nhưng Ghế đã mất" (Expired Bookings)
* **Thực trạng:** Khách chuyển tiền khi bộ đếm giữ ghế đã về 0 → "bị trừ tiền nhưng không có vé".
* **Giải pháp của MTBA:** **Logic tự động cứu đơn trên Webhook**: Tiền về trễ → quét lại ghế → nếu ghế còn: chốt đơn; nếu ghế mất: báo lỗi cần hoàn tiền.
* **Giá trị thực tế:** Ghi điểm tuyệt đối về Chăm sóc Khách hàng, tiết kiệm chi phí nhân sự xử lý sự cố.

### Vấn đề 4: Chống phe vé đầu cơ (Anti-scalping)
* **Thực trạng:** "Phe vé" dùng bot ôm hàng loạt ghế VIP.
* **Giải pháp của MTBA:** Rule cứng Backend: **Giới hạn tối đa 8 vé / 1 giao dịch**.
* **Giá trị thực tế:** Chặn bot mua vé. Khách đoàn (muốn mua 20-30 vé) được linh hoạt chuyển đến quầy POS để Staff hỗ trợ.

---

## Nội dung 5: Kiến trúc Kỹ thuật Chuyên sâu (Technical Deep Dive)

*Kính thưa Hội đồng, sau khi đã trình bày bài toán thực tế, em xin phép đi sâu vào phần mà chúng em tự hào nhất — kiến trúc kỹ thuật phía sau.*

### 5.1. Luồng Đặt Vé và Thanh Toán (Happy Path)

1. **Chọn phim & suất chiếu** → Hệ thống hiển thị sơ đồ ghế real-time.
2. **Chọn ghế** → Backend tạm giữ ghế (soft-lock), bắt đầu đếm ngược.
3. **Xác nhận hóa đơn** → Backend tạo bản ghi `Booking` trạng thái `PENDING`, sinh mã VietQR với nội dung chuyển khoản chứa `bookingId`.
4. **Khách quét mã QR** → SePay nhận tiền, bắn Webhook đến `/payments-webhook`.
5. **Webhook xử lý** → Backend trích xuất `bookingId`, so khớp số tiền, cập nhật trạng thái `PAID`, gửi email vé QR cho khách.

> **Điểm đặc biệt:** Song song với Webhook, hệ thống chạy **Active Polling** định kỳ gọi API SePay — làm "lưới an toàn" khi Webhook bị trễ.

### 5.2. Cơ chế Passive Display Sync (Đồng bộ màn hình POS)

* **Vấn đề:** Nếu cả hai thiết bị (Staff và màn hình khách) cùng đồng bộ pathname hai chiều → vòng lặp điều hướng vô hạn (endless routing ping-pong).
* **Giải pháp:** Đồng bộ **một chiều có kiểm soát**:
  * Staff thao tác → `pushState(currentPath)` → ghi lên server.
  * Màn hình khách → polling lấy pathname từ server → `router.replace()`.
  * Màn hình khách **tuyệt đối không** ghi ngược pathname lên server.
  * Truyền `currentPath` tường minh khi gọi `pushState` → loại bỏ race condition.

### 5.3. Bảo mật Mật khẩu (Salt & Pepper + bcrypt)

```
Mật khẩu gốc  +  PASSWORD_PEPPER (biến môi trường)
                        ↓
              bcrypt.hash(password + pepper)
                        ↓
              Lưu vào Database (hash)
```

Pepper được lấy từ `process.env.PASSWORD_PEPPER` — **ngay cả khi Database bị lộ hoàn toàn**, kẻ tấn công vẫn không thể crack mật khẩu vì thiếu Pepper.

---

## Nội dung 6: Demo Trực tiếp (Live Demo)

*Kính thưa Hội đồng, em xin phép thực hiện demo trực tiếp hệ thống.*

> **Lưu ý:** Mở sẵn 3 tab — (1) Trang khách hàng, (2) Trang POS Staff, (3) Màn hình Passive Display — trên 2 thiết bị hoặc 2 cửa sổ trình duyệt khác nhau.

### Demo 1: Luồng Đặt vé Online (User Journey)
1. ▶ Mở trang chủ → Cuộn fullpage scroll-snap để duyệt phim đang chiếu.
2. ▶ Chọn phim → Xem trailer và thông tin chi tiết.
3. ▶ Chọn suất chiếu → Chọn ghế (VIP + Standard) → Tối đa 8 ghế.
4. ▶ Xác nhận đơn → Hệ thống sinh mã VietQR.
5. ▶ Dùng điện thoại quét mã QR → Chuyển khoản → Màn hình tự động cập nhật thành `PAID`.
6. ▶ Vào mục "Vé của tôi" → Hiển thị mã QR vé để check-in.

### Demo 2: Luồng POS tại Quầy (Staff + Passive Display)
1. ▶ Staff đăng nhập trang POS → Giao diện fullpage scroll-snap xuất hiện.
2. ▶ Mở màn hình khách (Passive Display) trên thiết bị thứ 2 → **Tự động kết nối và hiển thị đồng bộ**.
3. ▶ Staff vuốt (scroll) chọn phim → Màn hình khách cập nhật theo tức thì.
4. ▶ Staff chọn ghế cho khách → Màn hình khách hiển thị vị trí ghế đã chọn.
5. ▶ Staff xác nhận → Màn hình khách hiển thị mã QR VietQR → Khách tự quét.
6. ▶ Tiền về → Màn hình khách tự chuyển sang "Thanh toán thành công".

### Demo 3: Tính năng Admin Dashboard
1. ▶ Đăng nhập Admin → Xem Dashboard biểu đồ doanh thu theo ngày/tháng.
2. ▶ Thêm lịch chiếu mới → Cố tình nhập giờ trùng → Hệ thống **từ chối và hiển thị cảnh báo trùng lịch**.
3. ▶ Quản lý giá vé → Cập nhật giá theo loại ghế và thời điểm chiếu.

---

## Nội dung 7: Kết luận & Hướng Phát triển Tương lai

*Kính thưa Hội đồng, để tổng kết lại toàn bộ những gì chúng em đã trình bày:*

### 7.1. Những gì MTBA đã đạt được

| Tiêu chí | Kết quả |
|---|---|
| Kiến trúc | Monorepo hiện đại (Next.js 16+ / NestJS 11+), tách biệt rõ ràng, dễ mở rộng |
| Tính năng cốt lõi | Đặt vé online, POS tại quầy, Passive Display, thanh toán VietQR tự động |
| Bảo mật | JWT + Salt & Pepper + bcrypt, phân quyền 3 tầng (Admin/Staff/User) |
| Trải nghiệm | Giao diện Fullpage Scroll-snap, Custom Dialog, không dùng `alert()` thô |
| Chống đầu cơ | Giới hạn cứng 8 vé/giao dịch tại tầng Backend |
| Xử lý rủi ro | Logic cứu đơn quá hạn, kiểm tra trùng lịch chiếu, xử lý Idempotency Webhook |

### 7.2. Hướng Phát triển Tương lai

1. **Push Notification**: Nhắc nhở khách 30 phút trước suất chiếu qua email/app.
2. **Loyalty Points**: Tích điểm theo số vé đã mua, đổi điểm lấy vé miễn phí.
3. **AI Recommendation**: Dùng lịch sử xem phim để gợi ý phim phù hợp.
4. **CI/CD & Cloud**: Đóng gói Docker, deploy trên Railway/Vercel/AWS với pipeline tự động.
5. **Mobile App**: Phát triển app iOS/Android bằng React Native, tái sử dụng toàn bộ Backend API.
6. **Hoàn tiền tự động**: Tự động hoàn tiền khi xảy ra xung đột ghế trong kịch bản thanh toán trễ.

---

*Lời kết:*

**MTBA** không chỉ là một đồ án tốt nghiệp. Đó là minh chứng cho thấy với kiến trúc đúng đắn, công nghệ phù hợp và tư duy giải quyết vấn đề thực tế, sinh viên hoàn toàn có thể xây dựng một sản phẩm có giá trị thương mại thực sự, sẵn sàng cạnh tranh với các giải pháp hiện có trên thị trường.

**Chúng em xin chân thành cảm ơn Hội đồng Giám khảo và Quý Thầy Cô đã lắng nghe. Nhóm chúng em xin kính mời Hội đồng đặt câu hỏi.**

---

## Nội dung 8: Phần Hỏi & Đáp — Q&A (Dự đoán câu hỏi)

### ❓ Câu hỏi 1: "Tại sao không dùng WebSocket cho Passive Display thay vì polling?"

**Trả lời gợi ý:**
> WebSocket là lựa chọn lý tưởng về mặt lý thuyết. Tuy nhiên, trong phạm vi đồ án, chúng em ưu tiên tính đơn giản và ổn định của Long-polling để tránh phụ thuộc thêm vào hạ tầng WebSocket server riêng. Nếu phát triển thêm, chúng em sẽ chuyển sang `Socket.IO` hoặc `SSE (Server-Sent Events)` để tối ưu băng thông.

### ❓ Câu hỏi 2: "Làm sao đảm bảo tính nhất quán dữ liệu khi 2 người cùng chọn ghế trong cùng 1 thời điểm?"

**Trả lời gợi ý:**
> Chúng em xử lý bằng cơ chế **Soft-lock tại tầng Database**. Khi một người chọn ghế, Backend cập nhật trạng thái ghế thành `HELD` với timestamp. Người thứ hai query sẽ thấy ghế đó là `HELD` và không thể chọn. Sau khi hết thời gian giữ ghế mà không thanh toán, trạng thái tự động trở về `AVAILABLE`.

### ❓ Câu hỏi 3: "Hệ thống xử lý thế nào nếu Webhook SePay bị gọi 2 lần cho cùng 1 giao dịch (duplicate event)?"

**Trả lời gợi ý:**
> Chúng em xử lý bằng **Idempotency** — trước khi cập nhật trạng thái Booking, Service kiểm tra xem `payment` đã có record với `transaction_id` tương ứng chưa. Nếu đã tồn tại, Webhook trả về thành công mà không thực hiện thay đổi nào, tránh ghi dữ liệu trùng lặp.

### ❓ Câu hỏi 4: "Các API có được viết Unit Test đầy đủ không?"

**Trả lời gợi ý:**
> Chúng em đã viết Unit Test với Jest cho các nghiệp vụ quan trọng nhất: xác thực (đăng ký/đăng nhập), đặt vé (vượt giới hạn 8 ghế, đặt ghế trùng), kiểm tra trùng lịch chiếu (overlap), và Webhook thanh toán. Có thể chạy ngay bằng lệnh `npm run test -w code/backend`.

### ❓ Câu hỏi 5: "Nếu sau này cần thay thế SePay bằng cổng thanh toán khác thì sao?"

**Trả lời gợi ý:**
> Chúng em đã cô lập toàn bộ logic tích hợp SePay trong `PaymentsService` riêng biệt. Nếu cần đổi cổng thanh toán, chỉ cần viết lại lớp Service đó mà không ảnh hưởng đến module đặt vé hay các module khác — đây chính là lợi ích của kiến trúc **Dependency Injection** mà NestJS cung cấp.

### ❓ Câu hỏi 6: "Tại sao nhóm chọn Scrum/Agile mà không dùng quy trình thác nước (Waterfall)?"

**Trả lời gợi ý:**
> Dự án đặt vé có nhiều nghiệp vụ phức tạp liên quan đến nhau (đặt vé → thanh toán → webhook → email). Nếu dùng Waterfall, chúng em phải hoàn thành toàn bộ phân tích trước khi lập trình — rất dễ phát sinh sai sót muộn. Với Scrum, mỗi Sprint 2 tuần cho ra một tính năng hoàn chỉnh có thể demo và nhận phản hồi ngay, giúp điều chỉnh kịp thời trước khi đi quá xa.

### ❓ Câu hỏi 7: "Tại sao nhóm chọn PM2 kết hợp Nginx thay vì chạy Docker trực tiếp trên VPS cho đồ án này?"

**Trả lời gợi ý:**
> Chạy trực tiếp qua PM2 và proxy qua Nginx là phương án tối ưu hóa tài nguyên phần cứng cho các gói VPS có cấu hình vừa và nhỏ (thường chỉ 1-2GB RAM). Phương pháp này giúp loại bộ overhead tài nguyên từ Docker runtime, giúp việc build ứng dụng Next.js trực tiếp trên VPS diễn ra nhanh chóng, mượt mà và tránh bị lỗi tràn bộ nhớ ảo (Swap Out-of-Memory). Ngoài ra, PM2 cung cấp khả năng tự khởi động lại tiến trình tức thì và tự khởi chạy cùng OS (systemd integration) cực kỳ ổn định.

