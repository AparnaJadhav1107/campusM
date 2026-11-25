import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LayoutGrid } from "lucide-react";
import { api } from "../services/api.js";
import { useAuthStore, useUIStore } from "../store/index.js";

function Shell({ children, title, sub }) {
  return (
    <div className="h-[100dvh] overflow-y-auto grid place-items-center p-4 bg-appbg">
      <div className="card w-full max-w-[380px] pop-in">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-8 h-8 rounded-lg bg-primary text-white grid place-items-center">
            <LayoutGrid size={15} />
          </span>
          <b className="text-[13px]">Smart Campus</b>
        </div>
        <h1 className="text-[20px] font-bold">{title}</h1>
        <p className="text-muted mb-4 mt-0.5">{sub}</p>
        {children}
      </div>
    </div>
  );
}

export function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const toast = useUIStore((s) => s.showToast);

  const go = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password) return toast("Please enter your email and password", "error");
    try {
      const data = await api("/auth/login", { method: "POST", body: JSON.stringify(form) });
      login(data.user, data.token);
      toast(`Welcome back, ${data.user.name}`, "success");
      navigate("/");
    } catch (x) {
      toast(x.message, "error");
    }
  };

  return (
    <Shell title="Welcome back" sub="Sign in with the account you registered, or the admin account created with npm run seed.">
      <form onSubmit={go} className="space-y-2.5">
        <input
          className="input"
          placeholder="Email"
          value={form.email}
          onChange={(x) => setForm({ ...form, email: x.target.value })}
        />
        <input
          type="password"
          className="input"
          placeholder="Password"
          value={form.password}
          onChange={(x) => setForm({ ...form, password: x.target.value })}
        />
        <button className="btn-primary w-full">Login</button>
      </form>
      <p className="text-muted mt-4">
        New student?{" "}
        <Link className="text-primary font-semibold" to="/register">
          Register
        </Link>
      </p>
    </Shell>
  );
}

export function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const toast = useUIStore((s) => s.showToast);

  const go = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password)
      return toast("Please fill in your name, email and password", "error");
    try {
      const data = await api("/auth/register", { method: "POST", body: JSON.stringify(form) });
      login(data.user, data.token);
      toast("Account created — welcome to Smart Campus", "success");
      navigate("/");
    } catch (x) {
      toast(x.message, "error");
    }
  };

  return (
    <Shell title="Student registration" sub="Create your student account. Passwords are hashed with bcrypt on the server.">
      <form onSubmit={go} className="space-y-2.5">
        <input
          className="input"
          placeholder="Full name"
          value={form.name}
          onChange={(x) => setForm({ ...form, name: x.target.value })}
        />
        <input
          className="input"
          placeholder="Email"
          value={form.email}
          onChange={(x) => setForm({ ...form, email: x.target.value })}
        />
        <input
          type="password"
          className="input"
          placeholder="Password"
          value={form.password}
          onChange={(x) => setForm({ ...form, password: x.target.value })}
        />
        <button className="btn-primary w-full">Register</button>
      </form>
      <p className="text-muted mt-4">
        Already registered?{" "}
        <Link className="text-primary font-semibold" to="/login">
          Login
        </Link>
      </p>
    </Shell>
  );
}
