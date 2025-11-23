// import React, { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import api from "../services/api";

// export default function VerifyEmail() {
//   const { token } = useParams();
//   const navigate = useNavigate();
//   const [status, setStatus] = useState("Verifying...");

//   useEffect(() => {
//     const verifyEmail = async () => {
//       try {
//         const res = await api.get(`/auth/verify/${token}`);
//         setStatus(res.data.message || "Email verified successfully!");
//         setTimeout(() => navigate("/login"), 2000);
//       } catch (err) {
//         setStatus(err.response?.data?.message || "Invalid or expired link");
//       }
//     };
//     verifyEmail();
//   }, [token, navigate]);

//   return (
//     <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
//       <div className="bg-white p-6 rounded-xl shadow-md text-center max-w-md w-full">
//         <h2 className="text-2xl font-bold text-blue-600 mb-3">Email Verification</h2>
//         <p className="text-gray-600">{status}</p>
//       </div>
//     </div>
//   );
// }
