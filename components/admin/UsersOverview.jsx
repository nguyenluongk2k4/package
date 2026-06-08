"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import AdminLayout from "./AdminLayout";
import { useFirebaseAuth } from "../sac-co-do/FirebaseAuthProvider";

export default function UsersOverview() {
  const { db } = useFirebaseAuth();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [details, setDetails] = useState({});

  useEffect(() => {
    if (!db) return;

    getDocs(collection(db, "users")).then((snapshot) => {
      setUsers(snapshot.docs.map((userDoc) => ({ id: userDoc.id, ...userDoc.data() })));
    });
  }, [db]);

  async function inspectUser(userRow) {
    setSelectedUser(userRow);
    const groups = ["cart", "journeyProgress", "photoboothPhotos", "arExperiences"];
    const nextDetails = {};
    await Promise.all(
      groups.map(async (group) => {
        const snapshot = await getDocs(collection(db, "users", userRow.id, group));
        nextDetails[group] = snapshot.docs.map((itemDoc) => ({ id: itemDoc.id, ...itemDoc.data() }));
      })
    );
    setDetails(nextDetails);
  }

  return (
    <AdminLayout resource="users">
      <header className="admin-heading">
        <span>Read only</span>
        <h1>User overview</h1>
        <p>Xem profile, cart, hành trình, photobooth và AR sessions theo từng user.</p>
      </header>
      <div className="admin-manager-grid">
        <div className="admin-table">
          {users.map((userRow) => (
            <article className={selectedUser?.id === userRow.id ? "active" : ""} key={userRow.id}>
              <button type="button" onClick={() => inspectUser(userRow)}>
                <strong>{userRow.displayName || userRow.email || userRow.id}</strong>
                <span>{userRow.email || userRow.id}</span>
              </button>
            </article>
          ))}
        </div>
        <section className="admin-editor">
          <h2>{selectedUser ? selectedUser.email || selectedUser.id : "Chọn user"}</h2>
          {Object.entries(details).map(([group, rows]) => (
            <div className="admin-json-block" key={group}>
              <strong>{group}</strong>
              <pre>{JSON.stringify(rows, null, 2)}</pre>
            </div>
          ))}
        </section>
      </div>
    </AdminLayout>
  );
}
