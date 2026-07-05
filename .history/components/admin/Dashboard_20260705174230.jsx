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

    let mounted = true;

    async function loadStats() {
      const names = ["stations", "products", "orders", "users", "arCharacters", "activationCodes"];
      const result = {};

      await Promise.all(
        names.map(async (name) => {
          const snapshot = await getDocs(collection(db, name));
          result[name] = snapshot.size;
        })
      );

      if (mounted) {
        setStats(result);
      }
    }

    loadStats();

    return () => {
      mounted = false;
    };
  }, [db]);

  const dashboardStats = [
    { label: "Dia danh", value: stats.stations ?? "-", badge: "ACTIVE", icon: "/assets/admin/dashboard/ic-dia-danh-dashboard-da-co-bg.svg" },
    { label: "San pham", value: stats.products ?? "-", badge: "STOCK", icon: "/assets/admin/dashboard/ic-san-pham-dashboard-da-co-bg.svg" },
    { label: "Don hang", value: stats.orders ?? "-", badge: "OPS", icon: "/assets/admin/dashboard/ic-san-pham-dashboard-da-co-bg.svg" },
    { label: "Nguoi dung", value: stats.users ?? "-", badge: "GROWTH", icon: "/assets/admin/dashboard/ic-san-pham-dashboard-da-co-bg.svg" },
    { label: "Nhan vat AR", value: stats.arCharacters ?? "-", badge: "3D LIVE", icon: "/assets/admin/dashboard/ic-nhan-vat-ar-dashboard-da-co-bg.svg" },
    { label: "Activation codes", value: stats.activationCodes ?? "-", badge: "ACCESS", icon: "/assets/admin/dashboard/ic-dia-danh-dashboard-da-co-bg.svg" },
  ];

  return (
    <AdminLayout resource="dashboard">
      <div className="admin-dashboard-page">
        <header className="admin-dashboard-heading">
          <h1>Dashboard</h1>
          <p>Trung tam van hanh cho public app, admin CMS va cac module journey, san pham, order, AR va activation.</p>
        </header>

        <section className="admin-dashboard-stat-grid" aria-label="Tong quan du lieu">
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
            <img src="/assets/anh-new/logo.png" alt="Sac Co Do" />
            <div>
              <span>Tieu diem di san</span>
              <h2>Co do Hoa Lu dang la diem nhan trong hanh trinh AR va check-in</h2>
              <Link href="/admin/ar-characters">Xem quan ly AR</Link>
            </div>
          </article>

          <aside className="admin-dashboard-activity-card">
            <header>
              <h2>Module uu tien</h2>
              <span aria-hidden="true">↺</span>
            </header>
            <div className="admin-activity-list">
              <article>
                <span className="orange" />
                <div>
                  <strong>User operations</strong>
                  <p>Theo doi passport, check-in, photobooth, AR sessions va moderation ngay trong admin users.</p>
                  <small>Module 1</small>
                </div>
              </article>
              <article>
                <span />
                <div>
                  <strong>Orders</strong>
                  <p>Module order da san sang cho list/detail, timeline, COD va SePay status handling.</p>
                  <small>Module 2</small>
                </div>
              </article>
              <article>
                <span />
                <div>
                  <strong>Activation + AR mapping</strong>
                  <p>Code kich hoat va station to AR character mapping dang duoc dieu hanh truc tiep tren Firebase.</p>
                  <small>Module 3 + 4</small>
                </div>
              </article>
            </div>
            <button type="button">Xem roadmap</button>
          </aside>
        </section>
      </div>
    </AdminLayout>
  );
}
