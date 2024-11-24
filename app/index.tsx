import Login from "~/pages/login/Login";
import React from "react";
import authService from "~/services/auth.service";
export default function App() {
   authService.login('khainam', 'Nam@12102003')
   return <Login />
}