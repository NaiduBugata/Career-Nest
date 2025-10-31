import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import AuthForm from "./pages/AuthForm";
import RoleSelection from "./pages/Role";
import StudentDashboard from "./pages/Student_Dashboard";
import OrganizationDashboard from "./pages/Organization_Dashboard";
import AdminDashboard from "./pages/Admin_Dashboard";
import OrganizationRegistration from "./pages/OrganizationRegistration";
import Courses from "./pages/Courses";
import About from "./pages/About";
import Help from "./pages/Help";

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing page as default */}
        <Route path="/" element={<Landing />} />

        {/* About and Help pages */}
        <Route path="/about" element={<About />} />
        <Route path="/help" element={<Help />} />

        {/* Role selection page */}
        <Route path="/Role" element={<RoleSelection />} />

        {/* Auth page for login/register */}
        <Route path="/AuthForm" element={<AuthForm />} />

        {/* Role-specific login pages */}
        <Route path="/admin-login" element={<AuthForm />} />
        <Route path="/organization-login" element={<AuthForm />} />
        <Route path="/student-login" element={<AuthForm />} />

        {/* Organization registration */}
        <Route path="/organization-register" element={<OrganizationRegistration />} />

        {/* Dashboards */}
        <Route path="/Student_Dashboard" element={<StudentDashboard />} />
        <Route path="/Organization_Dashboard" element={<OrganizationDashboard />} />
        <Route path="/Admin_Dashboard" element={<AdminDashboard />} />
        {/* Courses full-page view (used by Organization/Admin) */}
        <Route path="/courses" element={<Courses />} />
      </Routes>
    </Router>
  );
}

export default App;

// import React from "react";
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import Landing from "./pages/Landing";
// import AuthForm from "./pages/AuthForm";
// import RoleSelection from "./pages/Role"; // Import the new RoleSelection page

// function App() {
//   return (
//     <Router>
//       <Routes>
//         {/* Landing page as default */}
//         <Route path="/" element={<Landing />} />

//         {/* Role selection page */}
//         <Route path="/role" element={<RoleSelection />} />

//         {/* Auth page for login/register */}
//         <Route path="/AuthForm" element={<AuthForm />} />

//         <Route path="/Student_Dashboard" element={<AuthForm />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;

// // App.jsx
// // App.jsx
// import React, { useState } from "react";
// import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
// import RoleSelection from "./pages/Role";
// import AuthForm from "./pages/AuthForm";
// import Landing from "./pages/Landing";

// function App() {
//   const [selectedRole, setSelectedRole] = useState(null);

//   const handleRoleSelect = (role) => {
//     setSelectedRole(role);
//     console.log("Selected role:", role);
//   };

//   const handleBackToHome = () => {
//     setSelectedRole(null);
//   };

//   return (
//     <Router>
//       <div className="App">
//         <Routes>
//           {/* Landing page as default */}
//           <Route path="/" element={<Landing />} />
          
//           {/* Role selection page */}
//           <Route 
//             path="/Role" 
//             element={
//               <RoleSelection 
//                 onRoleSelect={handleRoleSelect} 
//                 onBack={handleBackToHome} 
//               />
//             } 
//           />
          
//           {/* Auth page - redirect to role selection if no role is selected */}
//           <Route 
//             path="/AuthForm" 
//             element={
//               selectedRole ? (
//                 <AuthForm selectedRole={selectedRole} />
//               ) : (
//                 <Navigate to="/Role" replace />
//               )
//             } 
//           />
          
//           {/* Redirect any unknown routes to landing page */}
//           <Route path="*" element={<Navigate to="/" replace />} />
//         </Routes>
//       </div>
//     </Router>
//   );
// }

// export default App;


// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import AuthForm from "./pages/AuthForm";
// import Student_Dashboard from "./pages/Student_Dashboard";
// // import FacultyDashboard from "./pages/FacultyDashboard";
// // import AdminDashboard from "./pages/AdminDashboard";

// function App() {
//   return (
//     <Router>
//       <Routes>
//         {/* Auth Page */}
//         <Route path="/" element={<AuthForm />} />

//         {/* Dashboards */}
//         <Route path="/Student_Dashboard" element={<Student_Dashboard />} />
//         <Route path="/faculty" element={<FacultyDashboard />} />
//         <Route path="/admin" element={<AdminDashboard />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;

//Testing Student_Dashboard
// import React from "react";

// export default function StudentDashboard() {
//   return <h1>✅ Student Dashboard is Working</h1>;
// }


