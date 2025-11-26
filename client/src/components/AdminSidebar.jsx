// import React, { useState, useEffect } from "react"; // เพิ่ม useEffect
// import { NavLink, useLocation } from "react-router-dom"; // เพิ่ม useLocation
// import "./AdminSidebar.css";

// const AdminSidebar = ({ logout, user }) => {
//   const [isOpen, setIsOpen] = useState(true);
//   const [expandedMenu, setExpandedMenu] = useState(null); // เก็บ state ว่าเมนูไหนเปิดอยู่
//   const location = useLocation();

//   // Fallback data
//   const currentUser = user || {
//     name: "Jatu Dev",
//     role: "Software Engineer",
//     avatar:
//       "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
//   };

//   // Menu Configuration
//   const menuItems = [
//     { path: "/admin/dashboard", label: "Dashboard", icon: "grid_view" },
//     { path: "/admin/users", label: "พนักงานทั้งหมด", icon: "group" },

//     // --- ปรับปรุงส่วนเวลาเข้างาน ---
//     {
//       label: "เวลาเข้างาน",
//       icon: "schedule",
//       id: "attendance", // ต้องมี ID ไว้เช็คเปิด/ปิด
//       subItems: [
//         { path: "/admin/attendance/overview", label: "ภาพรวมเวลาเข้างาน" },
//         { path: "/admin/attendance/manage", label: "จัดการเวลาพนักงาน" },
//         { path: "/admin/attendance/shifts", label: "กะการเข้างาน" },
//       ],
//     },
//     // ----------------------------

//     { path: "/admin/reports", label: "รายงานสรุป", icon: "description" },
//     { path: "/admin/settings", label: "ตั้งค่าระบบ", icon: "settings" },
//   ];

//   // Logic: เช็คว่า URL ปัจจุบันตรงกับ Submenu ไหนไหม เพื่อ Auto Expand
//   useEffect(() => {
//     menuItems.forEach((item) => {
//       if (item.subItems) {
//         const isChildActive = item.subItems.some(
//           (sub) => sub.path === location.pathname
//         );
//         if (isChildActive) {
//           setExpandedMenu(item.id);
//         }
//       }
//     });
//   }, [location.pathname]);

//   // Handle Toggle Submenu
//   const handleMenuClick = (item) => {
//     if (!isOpen) {
//       setIsOpen(true); // ถ้า Sidebar ปิดอยู่ ให้เปิดออกก่อน
//       if (item.subItems) {
//         setTimeout(() => setExpandedMenu(item.id), 100); // รอ animation นิดนึงแล้วค่อยกาง
//       }
//     } else {
//       if (item.subItems) {
//         // Toggle: ถ้าเปิดอยู่แล้วให้ปิด ถ้าปิดอยู่ให้เปิด
//         setExpandedMenu(expandedMenu === item.id ? null : item.id);
//       }
//     }
//   };

//   return (
//     <aside className={`admin-sidebar ${isOpen ? "open" : "closed"}`}>
//       {/* 1. Header & Logo */}
//       <div className="sidebar-header">
//         {isOpen && (
//           <div className="brand-text">
//             Nite<span style={{ color: "#FFBD28" }}>.</span>Admin
//           </div>
//         )}
//         <button
//           className="toggle-btn"
//           onClick={() => setIsOpen(!isOpen)}
//           title={isOpen ? "ย่อเมนู" : "ขยายเมนู"}
//         >
//           <span className="material-symbols-outlined">
//             {isOpen ? "menu_open" : "menu"}
//           </span>
//         </button>
//       </div>

//       {/* 2. Menu Items */}
//       <ul className="menu-list">
//         {menuItems.map((item, index) => {
//           // เช็คว่าเป็นเมนูแบบมีลูก หรือ ลิงก์ธรรมดา
//           const hasSub = !!item.subItems;
//           const isExpanded = expandedMenu === item.id;

//           // เช็ค Active State สำหรับ Parent (ถ้าลูกตัวใดตัวหนึ่ง Active พ่อต้อง Active ด้วย)
//           const isParentActive =
//             hasSub &&
//             item.subItems.some((sub) => sub.path === location.pathname);

//           return (
//             <li className="menu-item" key={index}>
//               {hasSub ? (
//                 // --- กรณีเป็น Parent Menu (คลิกเพื่อยืดหด) ---
//                 <div
//                   className={`menu-link cursor-pointer ${
//                     isParentActive ? "active" : ""
//                   }`}
//                   onClick={() => handleMenuClick(item)}
//                   aria-expanded={isExpanded}
//                   style={{ cursor: "pointer" }}
//                 >
//                   <span
//                     className={`material-symbols-outlined menu-icon ${
//                       isParentActive ? "" : ""
//                     }`}
//                   >
//                     {item.icon}
//                   </span>
//                   <span className="menu-text">{item.label}</span>
//                   {/* ลูกศรชี้ลง */}
//                   <span className="material-symbols-outlined menu-arrow">
//                     expand_more
//                   </span>
//                 </div>
//               ) : (
//                 // --- กรณีเป็น Link ธรรมดา ---
//                 <NavLink
//                   to={item.path}
//                   className={({ isActive }) =>
//                     `menu-link ${isActive ? "active" : ""}`
//                   }
//                   title={!isOpen ? item.label : ""}
//                   onClick={() => setExpandedMenu(null)} // กดเมนูอื่น ให้หุบ sub
//                 >
//                   <span className="material-symbols-outlined menu-icon">
//                     {item.icon}
//                   </span>
//                   <span className="menu-text">{item.label}</span>
//                 </NavLink>
//               )}

//               {/* --- ส่วนแสดงผล Sub Items --- */}
//               {hasSub && isExpanded && isOpen && (
//                 <ul className="submenu-list fade-in">
//                   {item.subItems.map((sub, subIndex) => (
//                     <li key={subIndex} className="submenu-item">
//                       <NavLink
//                         to={sub.path}
//                         className={({ isActive }) =>
//                           `submenu-link ${isActive ? "active" : ""}`
//                         }
//                       >
//                         {sub.label}
//                       </NavLink>
//                     </li>
//                   ))}
//                 </ul>
//               )}
//             </li>
//           );
//         })}
//       </ul>

//       {/* 3. User Profile Section */}
//       <div className="user-wrapper">
//         <div className="user-card">
//           <div className="user-avatar-box">
//             <img
//               src={currentUser.avatar}
//               alt="User"
//               className="user-img"
//               onError={(e) => {
//                 e.target.src =
//                   "https://ui-avatars.com/api/?name=" +
//                   currentUser.name +
//                   "&background=1E2A45&color=fff";
//               }}
//             />
//             <span className="status-dot"></span>
//           </div>

//           <div className="user-details">
//             <span className="user-name">{currentUser.name}</span>
//             <span className="user-role">{currentUser.role}</span>
//           </div>

//           {isOpen && (
//             <button
//               onClick={logout}
//               className="logout-btn-mini"
//               title="ออกจากระบบ"
//             >
//               <span
//                 className="material-symbols-outlined"
//                 style={{ fontSize: "18px" }}
//               >
//                 logout
//               </span>
//             </button>
//           )}
//         </div>

//         {!isOpen && (
//           <button
//             onClick={logout}
//             className="logout-closed-btn mt-2"
//             title="ออกจากระบบ"
//           >
//             <span className="material-symbols-outlined">logout</span>
//           </button>
//         )}
//       </div>
//     </aside>
//   );
// };

// export default AdminSidebar;
import React, { useState, useEffect, useContext } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext"; // 1. Import AuthContext
import "./AdminSidebar.css";

// 2. ลบ props 'user' และ 'logout' ออก เพราะเราจะดึงจาก Context แทน
const AdminSidebar = () => {
  // 3. ดึง user และ logout มาจาก AuthContext โดยตรง
  const { user, logout } = useContext(AuthContext);

  const [isOpen, setIsOpen] = useState(true);
  const [expandedMenu, setExpandedMenu] = useState(null);
  const location = useLocation();

  // 4. ใช้ข้อมูลจาก user ที่ได้จาก Context (ถ้าไม่มีให้ใช้ Default)
  const currentUser = user || {
    name: "Admin User",
    role: "Administrator",
    avatar: null, // ให้ระบบไปใช้ตัวอักษรแรกของชื่อแทน หรือรูป Default
  };

  // Menu Configuration
  const menuItems = [
    { path: "/admin/dashboard", label: "Dashboard", icon: "grid_view" },
    { path: "/admin/users", label: "พนักงานทั้งหมด", icon: "group" },
    {
      label: "เวลาเข้างาน",
      icon: "schedule",
      id: "attendance",
      subItems: [
        { path: "/admin/attendance/overview", label: "ภาพรวมเวลาเข้างาน" },
        { path: "/admin/attendance/manage", label: "จัดการเวลาพนักงาน" },
        { path: "/admin/attendance/shifts", label: "กะการเข้างาน" },
      ],
    },
    { path: "/admin/reports", label: "รายงานสรุป", icon: "description" },
    { path: "/admin/settings", label: "ตั้งค่าระบบ", icon: "settings" },
  ];

  useEffect(() => {
    menuItems.forEach((item) => {
      if (item.subItems) {
        const isChildActive = item.subItems.some(
          (sub) => sub.path === location.pathname
        );
        if (isChildActive) {
          setExpandedMenu(item.id);
        }
      }
    });
  }, [location.pathname]);

  const handleMenuClick = (item) => {
    if (!isOpen) {
      setIsOpen(true);
      if (item.subItems) {
        setTimeout(() => setExpandedMenu(item.id), 100);
      }
    } else {
      if (item.subItems) {
        setExpandedMenu(expandedMenu === item.id ? null : item.id);
      }
    }
  };

  return (
    <aside className={`admin-sidebar ${isOpen ? "open" : "closed"}`}>
      {/* 1. Header & Logo */}
      <div className="sidebar-header">
        {isOpen && (
          <div className="brand-text fade-in">
            Nite<span style={{ color: "#FFBD28" }}>.</span>Admin
          </div>
        )}
        <button
          className="toggle-btn"
          onClick={() => setIsOpen(!isOpen)}
          title={isOpen ? "ย่อเมนู" : "ขยายเมนู"}
        >
          <span className="material-symbols-outlined">
            {isOpen ? "menu_open" : "menu"}
          </span>
        </button>
      </div>

      {/* 2. Menu Items */}
      <ul className="menu-list">
        {menuItems.map((item, index) => {
          const hasSub = !!item.subItems;
          const isExpanded = expandedMenu === item.id;
          const isParentActive =
            hasSub &&
            item.subItems.some((sub) => sub.path === location.pathname);

          return (
            <li className="menu-item" key={index}>
              {hasSub ? (
                <div
                  className={`menu-link cursor-pointer ${
                    isParentActive ? "active" : ""
                  }`}
                  onClick={() => handleMenuClick(item)}
                  aria-expanded={isExpanded}
                  style={{ cursor: "pointer" }}
                >
                  <span className={`material-symbols-outlined menu-icon`}>
                    {item.icon}
                  </span>
                  <span className="menu-text">{item.label}</span>
                  {isOpen && (
                    <span
                      className={`material-symbols-outlined menu-arrow ${
                        isExpanded ? "rotated" : ""
                      }`}
                    >
                      expand_more
                    </span>
                  )}
                </div>
              ) : (
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `menu-link ${isActive ? "active" : ""}`
                  }
                  title={!isOpen ? item.label : ""}
                  onClick={() => setExpandedMenu(null)}
                >
                  <span className="material-symbols-outlined menu-icon">
                    {item.icon}
                  </span>
                  <span className="menu-text">{item.label}</span>
                </NavLink>
              )}

              {hasSub && isExpanded && isOpen && (
                <ul className="submenu-list fade-in">
                  {item.subItems.map((sub, subIndex) => (
                    <li key={subIndex} className="submenu-item">
                      <NavLink
                        to={sub.path}
                        className={({ isActive }) =>
                          `submenu-link ${isActive ? "active" : ""}`
                        }
                      >
                        {sub.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      {/* 3. User Profile Section */}
      <div className="user-wrapper">
        <div className="user-card" title={currentUser.name}>
          <div className="user-avatar-box">
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt="User"
                className="user-img"
                onError={(e) => {
                  // ถ้าโหลดรูปไม่ได้ ให้ไปใช้ Avatar สร้างเองจากชื่อ
                  e.target.src = `https://ui-avatars.com/api/?name=${currentUser.name}&background=00089b&color=fff`;
                }}
              />
            ) : (
              // ถ้าไม่มี Avatar เลย ให้ใช้ตัวอักษรย่อ
              <div
                className="user-initial-avatar"
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#00089b",
                  color: "#fff",
                  fontWeight: "bold",
                  borderRadius: "50%",
                }}
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="status-dot"></span>
          </div>

          <div className="user-details">
            <span className="user-name">{currentUser.name}</span>
            <span className="user-role">{currentUser.role}</span>
          </div>

          {isOpen && (
            <button
              onClick={logout}
              className="logout-btn-mini"
              title="ออกจากระบบ"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "18px" }}
              >
                logout
              </span>
            </button>
          )}
        </div>

        {!isOpen && (
          <button
            onClick={logout}
            className="logout-closed-btn mt-2"
            title="ออกจากระบบ"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
        )}
      </div>
    </aside>
  );
};

export default AdminSidebar;
