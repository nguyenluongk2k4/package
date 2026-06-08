"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import AdminLayout from "./AdminLayout";
import { useFirebaseAuth } from "../sac-co-do/FirebaseAuthProvider";

export default function Dashboard() {
  const { db } = useFirebaseAuth();
  const [stats, setStats] = useState({});

  useEffect(() => {
    if (!db) return;

    async function loadStats() {
      const names = ["stations", "products", "users", "arCharacters"];
      const result = {};
      await Promise.all(
        names.map(async (name) => {
          const snapshot = await getDocs(collection(db, name));
          result[name] = snapshot.size;
        })
      );
      setStats(result);
    }

    loadStats();
  }, [db]);

  const dashboardStats = [
    { label: "Địa danh", value: stats.stations ?? "-", badge: "ACTIVE", icon: "/assets/admin/dashboard/ic-dia-danh-dashboard-da-co-bg.svg" },
    { label: "Sản phẩm", value: stats.products ?? "-", badge: "STOCK", icon: "/assets/admin/dashboard/ic-san-pham-dashboard-da-co-bg.svg" },
    { label: "Người dùng", value: stats.users ?? "-", badge: "GROWTH", icon: "/assets/admin/dashboard/ic-ngươi-dung-dashboard-da-co-bg.svg" },
    { label: "Nhân vật AR", value: stats.arCharacters ?? "-", badge: "3D LIVE", icon: "/assets/admin/dashboard/ic-nhan-vat-ar-dashboard-da-co-bg.svg" },
  ];

  return (
    <AdminLayout resource="dashboard">
      <div className="admin-dashboard-page">
        <header className="admin-dashboard-heading">
          <h1>Dashboard</h1>
          <p>Quản trị dữ liệu đang dùng cho public app. Hệ thống quản lý di sản, sản phẩm du lịch và trải nghiệm thực tế ảo tăng cường.</p>
        </header>

        <section className="admin-dashboard-stat-grid" aria-label="Tổng quan dữ liệu">
          {dashboardStats.map((item) => (
            <article className="admin-dashboard-stat-card" key={item.label}>
              <div className="admin-dashboard-stat-top">
                <img src={item.icon} alt="" />
                <span>{item.badge}</span>
              </div>
              <div>
                <p>{item.label}</p>
                <strong>{item.value}</strong>
              </div>
            </article>
          ))}
        </section>

        <section className="admin-dashboard-main-grid">
          <article className="admin-dashboard-feature-card">
            <img src="/assets/dia-danh/co-do-hoa-lu/CĐHL 1.jpg" alt="Cố đô Hoa Lư" />
            <div>
              <span>Tiêu điểm di sản</span>
              <h2>Cố Đô Hoa Lư - Phục dựng thực tế ảo</h2>
              <Link href="/admin/ar-characters">Xem chi tiết AR</Link>
            </div>
          </article>

          <aside className="admin-dashboard-activity-card">
            <header>
              <h2>Hoạt động gần đây</h2>
              <span aria-hidden="true">↺</span>
            </header>
            <div className="admin-activity-list">
              <article>
                <span className="orange" />
                <div>
                  <strong>Cập nhật Asset 3D</strong>
                  <p>Lê Văn An vừa cập nhật model 'Long Sàng' cho Đền Vua Đinh.</p>
                  <small>12 phút trước</small>
                </div>
              </article>
              <article>
                <span />
                <div>
                  <strong>Tạo địa danh mới</strong>
                  <p>Hệ thống vừa thêm 'Chùa Bái Đính' vào danh mục Map.</p>
                  <small>2 giờ trước</small>
                </div>
              </article>
              <article>
                <span />
                <div>
                  <strong>Báo cáo người dùng</strong>
                  <p>Số lượng đăng ký mới tăng 15% trong 24h qua.</p>
                  <small>Hôm qua</small>
                </div>
              </article>
            </div>
            <button type="button">Xem tất cả lịch sử</button>
          </aside>
        </section>
      </div>
    </AdminLayout>
  );
}
