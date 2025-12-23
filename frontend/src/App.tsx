import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Edit from "./pages/Edit";
import NotFoundWithoutAuth from "./pages/NotFoundWithoutAuth";

const App = () => {
    return (<>
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/doc/edit/:docId" element={<Edit />} />
            <Route path="/:slug" element={<NotFoundWithoutAuth />} />
        </Routes>
    </>)
}

export default App;