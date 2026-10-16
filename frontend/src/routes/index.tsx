import { Route, Routes } from "react-router";

import LoginPage from "@/components/login-form";

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="login" element={<LoginPage />} />
            <Route path="/" element={<LoginPage />} />
        </Routes>
    );
}
