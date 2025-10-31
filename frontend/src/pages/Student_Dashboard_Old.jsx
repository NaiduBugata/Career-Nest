// import React from "react";
// import "../styles/student_dashboard.css";
// import { 
//   FaHome, FaUser, FaBriefcase, FaPaperPlane, FaBookmark, 
//   FaBell, FaCalendarAlt, FaHeadset, FaSignOutAlt 
// } from "react-icons/fa";

// export default function StudentDashboard() {
//   return (
//     <div className="dashboard-container flex min-h-screen bg-gray-100">

//       {/* Sidebar */}
//       <aside className="sidebar w-64 bg-indigo-900 text-white p-6">
//         <h2 className="text-2xl font-bold mb-6">Career Nest</h2>
//         <nav className="flex flex-col space-y-3">
//           <a href="#" className="flex items-center gap-3 p-2 rounded bg-indigo-700">
//             <FaHome /> Dashboard
//           </a>
//           <a href="#" className="flex items-center gap-3 p-2 rounded hover:bg-indigo-700">
//             <FaUser /> My Profile
//           </a>
//           <a href="#" className="flex items-center gap-3 p-2 rounded hover:bg-indigo-700">
//             <FaBriefcase /> Job Listings
//           </a>
//           <a href="#" className="flex items-center gap-3 p-2 rounded hover:bg-indigo-700">
//             <FaPaperPlane /> My Applications
//           </a>
//           <a href="#" className="flex items-center gap-3 p-2 rounded hover:bg-indigo-700">
//             <FaBookmark /> Saved Jobs
//           </a>
//           <a href="#" className="flex items-center gap-3 p-2 rounded hover:bg-indigo-700">
//             <FaBell /> Notifications
//           </a>
//           <a href="#" className="flex items-center gap-3 p-2 rounded hover:bg-indigo-700">
//             <FaCalendarAlt /> Events
//           </a>
//           <a href="#" className="flex items-center gap-3 p-2 rounded hover:bg-indigo-700">
//             <FaHeadset /> Help & Support
//           </a>
//           <a href="#" className="flex items-center gap-3 p-2 rounded hover:bg-red-600 mt-4">
//             <FaSignOutAlt /> Logout
//           </a>
//         </nav>
//       </aside>

//       {/* Main Content */}
//       <div className="main flex-1 p-8">

//         {/* Topbar */}
//         <header className="topbar flex justify-between items-center mb-8">
//           <h1 className="text-xl font-semibold">Welcome back, Priya 👋</h1>
//           <div className="top-actions flex items-center gap-4">
//             <FaBell className="text-lg cursor-pointer" />
//             <img 
//               src="https://i.pravatar.cc/40?img=1" 
//               alt="avatar" 
//               className="w-10 h-10 rounded-full"
//             />
//           </div>
//         </header>

//         {/* Stats */}
//         <section className="stats grid grid-cols-3 gap-6 mb-10">
//           <div className="stat-card bg-white p-6 rounded-xl shadow text-center">
//             <h3 className="text-2xl font-bold">8</h3>
//             <p className="text-gray-600">Jobs Applied</p>
//           </div>
//           <div className="stat-card bg-white p-6 rounded-xl shadow text-center">
//             <h3 className="text-2xl font-bold">5</h3>
//             <p className="text-gray-600">Jobs Saved</p>
//           </div>
//           <div className="stat-card bg-white p-6 rounded-xl shadow text-center">
//             <h3 className="text-2xl font-bold">75%</h3>
//             <p className="text-gray-600">Profile Complete</p>
//           </div>
//         </section>

//         {/* Recent Applications */}
//         <section className="applications mb-10">
//           <h2 className="text-lg font-semibold mb-4">Recent Applications</h2>
//           <table className="w-full bg-white rounded-lg shadow overflow-hidden">
//             <thead className="bg-gray-200 text-left">
//               <tr>
//                 <th className="p-3">Job Title</th>
//                 <th className="p-3">Company</th>
//                 <th className="p-3">Status</th>
//               </tr>
//             </thead>
//             <tbody>
//               <tr className="border-b">
//                 <td className="p-3">Frontend Developer</td>
//                 <td className="p-3">TechCorp</td>
//                 <td className="p-3"><span className="text-yellow-600">Pending</span></td>
//               </tr>
//               <tr className="border-b">
//                 <td className="p-3">UI/UX Designer</td>
//                 <td className="p-3">Designify</td>
//                 <td className="p-3"><span className="text-green-600">Shortlisted</span></td>
//               </tr>
//               <tr>
//                 <td className="p-3">Backend Developer</td>
//                 <td className="p-3">CodeWorks</td>
//                 <td className="p-3"><span className="text-red-600">Rejected</span></td>
//               </tr>
//             </tbody>
//           </table>
//         </section>

//         {/* Events Section */}
//         <section className="events mb-10">
//           <h2 className="text-lg font-semibold mb-4">Upcoming Events</h2>
//           <div className="grid grid-cols-2 gap-6">
//             <div className="event-card bg-white p-6 rounded-xl shadow">
//               <h3 className="text-md font-bold">Hackathon 2025</h3>
//               <p className="text-gray-600">Date: Aug 30, 2025</p>
//               <p className="text-gray-600">Host: CodeWorks</p>
//               <button className="register-btn mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
//                 Register
//               </button>
//             </div>
//             <div className="event-card bg-white p-6 rounded-xl shadow">
//               <h3 className="text-md font-bold">AI Workshop</h3>
//               <p className="text-gray-600">Date: Sep 05, 2025</p>
//               <p className="text-gray-600">Host: DataCorp</p>
//               <button className="register-btn mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
//                 Register
//               </button>
//             </div>
//           </div>
//         </section>

//         {/* My Events */}
//         <section className="my-events">
//           <h2 className="text-lg font-semibold mb-4">My Events</h2>
//           <ul className="list-disc list-inside space-y-2">
//             <li>Resume Workshop – Registered ✅</li>
//             <li>Hackathon 2025 – Created (as Host)</li>
//           </ul>
//         </section>

//       </div>
//     </div>
//   );
// }

import React from "react";
import "../styles/student_dashboard.css";
import { 
  FaHome, FaUser, FaBriefcase, FaPaperPlane, FaBookmark, 
  FaBell, FaCalendarAlt, FaHeadset, FaSignOutAlt 
} from "react-icons/fa";

export default function StudentDashboard() {
  return (
    <div className="dashboard-container">

      {/* Sidebar */}
      <aside className="sidebar">
        <h2>Career Nest</h2>
        <nav>
          <a href="#" className="active"><FaHome /> Dashboard</a>
          <a href="#"><FaUser /> My Profile</a>
          <a href="#"><FaBriefcase /> Job Listings</a>
          <a href="#"><FaPaperPlane /> My Applications</a>
          <a href="#"><FaBookmark /> Saved Jobs</a>
          <a href="#"><FaBell /> Notifications</a>
          <a href="#"><FaCalendarAlt /> Events</a>
          <a href="#"><FaHeadset /> Help & Support</a>
          <a href="/Landing" className="logout"><FaSignOutAlt /> Logout</a>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="main">

        {/* Topbar */}
        <header className="topbar">
          <h1>Welcome back, Priya 👋</h1>
          <div className="top-actions">
            <FaBell />
            <img 
              src="https://i.pravatar.cc/40?img=1" 
              alt="avatar" 
              className="avatar"
            />
          </div>
        </header>

        {/* Stats */}
        <section className="stats">
          <div className="stat-card">
            <h3>8</h3>
            <p>Jobs Applied</p>
          </div>
          <div className="stat-card">
            <h3>5</h3>
            <p>Jobs Saved</p>
          </div>
          <div className="stat-card">
            <h3>75%</h3>
            <p>Profile Complete</p>
          </div>
        </section>

        {/* Recent Applications */}
        <section className="applications">
          <h2>Recent Applications</h2>
          <table>
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Company</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Frontend Developer</td>
                <td>TechCorp</td>
                <td><span className="status pending">Pending</span></td>
              </tr>
              <tr>
                <td>UI/UX Designer</td>
                <td>Designify</td>
                <td><span className="status shortlisted">Shortlisted</span></td>
              </tr>
              <tr>
                <td>Backend Developer</td>
                <td>CodeWorks</td>
                <td><span className="status rejected">Rejected</span></td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Events Section */}
        <section className="events">
          <h2>Upcoming Events</h2>
          <div className="event-cards">
            <div className="event-card">
              <h3>Hackathon 2025</h3>
              <p>Date: Aug 30, 2025</p>
              <p>Host: CodeWorks</p>
              <button className="register-btn">Register</button>
            </div>
            <div className="event-card">
              <h3>AI Workshop</h3>
              <p>Date: Sep 05, 2025</p>
              <p>Host: DataCorp</p>
              <button className="register-btn">Register</button>
            </div>
          </div>
        </section>

        {/* My Events */}
        <section className="my-events">
          <h2>My Events</h2>
          <ul>
            <li>Resume Workshop – Registered ✅</li>
            <li>Hackathon 2025 – Created (as Host)</li>
          </ul>
        </section>

      </div>
    </div>
  );
}
