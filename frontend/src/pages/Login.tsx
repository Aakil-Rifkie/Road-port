import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import type { PublicUser } from "../types/user";
import API from "../api/axios";

type FormErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
};

interface Props {
  onLogin: (user: PublicUser) => void;
}

export default function Login({ onLogin }: Props) {
  const navigate = useNavigate();
  const [page, setPage] = useState<"login" | "register">("login");

  const [loginEmail, setLoginEmail] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [loginErrors, setLoginErrors] = useState<FormErrors>({});

  const [regName, setRegName] = useState<string>("");
  const [regEmail, setRegEmail] = useState<string>("");
  const [regPassword, setRegPassword] = useState<string>("");
  const [regConfirm, setRegConfirm] = useState<string>("");
  const [regErrors, setRegErrors] = useState<FormErrors>({});

  const isValidEmail = (v: string): boolean =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const validateLogin = (): FormErrors => {
    const errs: FormErrors = {};
    if (!loginEmail) errs.email = "Email is required.";
    else if (!isValidEmail(loginEmail)) errs.email = "Enter a valid email address.";
    if (!loginPassword) errs.password = "Password is required.";
    return errs;
  };

  const validateRegister = (): FormErrors => {
    const errs: FormErrors = {};
    if (!regName) errs.name = "Name is required.";
    if (!regEmail) errs.email = "Email is required.";
    else if (!isValidEmail(regEmail)) errs.email = "Enter a valid email address.";
    if (!regPassword) errs.password = "Password is required.";
    else if (regPassword.length < 8) errs.password = "At least 8 characters.";
    else if (!/[A-Z]/.test(regPassword)) errs.password = "Needs an uppercase letter.";
    else if (!/[0-9]/.test(regPassword)) errs.password = "Needs a number.";
    if (!regConfirm) errs.confirm = "Please confirm your password.";
    else if (regConfirm !== regPassword) errs.confirm = "Passwords do not match.";
    return errs;
  };

  const handleLogin = async () => {
    const errs = validateLogin();
    setLoginErrors(errs);
    if (Object.keys(errs).length === 0) {
      try {
        const response = await API.post<PublicUser>(
          "/users/login",
          { email: loginEmail, password: loginPassword },
          { withCredentials: true }
        );
        const userData = response.data;
        localStorage.setItem("user", JSON.stringify(userData));
        onLogin(userData);
        navigate(userData.role === "admin" ? "/admin" : "/dashboard");
      } catch (error: any) {
        setLoginErrors({ email: error.response?.data?.message || "Login failed." });
      }
    }
  };

  const handleRegister = async () => {
    const errs = validateRegister();
    setRegErrors(errs);
    if (Object.keys(errs).length === 0) {
      try {
        const response = await API.post<PublicUser>(
          "/users",
          { fullname: regName, email: regEmail, password: regPassword, confirmPass: regConfirm },
          { withCredentials: true }
        );
        const userData = response.data;
        localStorage.setItem("user", JSON.stringify(userData));
        setPage("login");
        setRegName(""); setRegEmail(""); setRegPassword(""); setRegConfirm("");
      } catch (error: any) {
        setRegErrors({ email: error.response?.data?.message || "Registration failed." });
      }
    }
  };

  const switchToRegister = () => { setLoginErrors({}); setPage("register"); };
  const switchToLogin = () => { setRegErrors({}); setPage("login"); };

  const FieldError = ({ msg }: { msg?: string }) => (
    <p className="text-red-400 text-[10px] mt-0.5 h-3.5 leading-none font-bold uppercase tracking-wider">
      {msg ?? ""}
    </p>
  );

  const inputClass = (err?: string) =>
    `w-full border-b-2 px-0 py-2 text-sm bg-transparent outline-none transition-all
    placeholder:text-gray-300 font-mono
    ${err ? "border-red-400" : "border-gray-200 focus:border-black"}`;

  return (
    <div className="min-h-screen bg-yellow-300 flex items-center justify-center p-4 font-mono">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[520px]">

        {/* Left panel — hidden on mobile */}
        <div className="hidden md:flex bg-gray-50 border-r border-gray-100 md:w-2/5 flex-col p-8">
          <div className="w-2 h-2 rounded-full bg-yellow-400 mb-auto" />
          <div className="flex flex-col items-center justify-center flex-1 gap-6 py-8">
            <img src={logo} alt="RoadPort" className="w-20 h-20 object-contain" />
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-900 text-center leading-relaxed">
              Work with us to<br />save the roads
            </h2>
          </div>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">
            Colombo Road Network
          </p>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex flex-col justify-center px-8 py-10 md:px-12">

          {/* Mobile logo */}
          <div className="flex md:hidden items-center gap-3 mb-8">
            <img src={logo} alt="RoadPort" className="w-8 h-8 object-contain" />
            <span className="text-xs font-black uppercase tracking-widest text-gray-900">RoadPort</span>
          </div>

          <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900 mb-1">
            {page === "login" ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-[11px] text-gray-400 uppercase tracking-widest mb-8">
            {page === "login" ? "Sign in to continue" : "Join the network"}
          </p>

          {page === "login" ? (
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => { setLoginEmail(e.target.value); setLoginErrors((p) => ({ ...p, email: "" })); }}
                  className={inputClass(loginErrors.email)}
                  placeholder="your@email.com"
                />
                <FieldError msg={loginErrors.email} />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => { setLoginPassword(e.target.value); setLoginErrors((p) => ({ ...p, password: "" })); }}
                  className={inputClass(loginErrors.password)}
                  placeholder="••••••••"
                />
                <FieldError msg={loginErrors.password} />
                <div className="text-right mt-1">
                  <a href="#" className="text-[10px] text-gray-400 hover:text-gray-700 transition-colors uppercase tracking-widest">
                    Forgot password?
                  </a>
                </div>
              </div>

              <button
                onClick={handleLogin}
                className="w-full bg-yellow-400 hover:bg-black hover:text-white text-black font-black py-3.5 rounded-2xl transition-all uppercase text-xs tracking-widest mt-2"
              >
                Sign In
              </button>

              <p className="text-center text-[11px] text-gray-400 pt-1">
                No account?{" "}
                <button onClick={switchToRegister} className="text-black font-black hover:text-yellow-500 transition-colors underline underline-offset-2">
                  Register here
                </button>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Full Name</label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => { setRegName(e.target.value); setRegErrors((p) => ({ ...p, name: "" })); }}
                  className={inputClass(regErrors.name)}
                  placeholder="John Doe"
                />
                <FieldError msg={regErrors.name} />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => { setRegEmail(e.target.value); setRegErrors((p) => ({ ...p, email: "" })); }}
                  className={inputClass(regErrors.email)}
                  placeholder="your@email.com"
                />
                <FieldError msg={regErrors.email} />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Password</label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => { setRegPassword(e.target.value); setRegErrors((p) => ({ ...p, password: "" })); }}
                  className={inputClass(regErrors.password)}
                  placeholder="••••••••"
                />
                <FieldError msg={regErrors.password} />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Confirm Password</label>
                <input
                  type="password"
                  value={regConfirm}
                  onChange={(e) => { setRegConfirm(e.target.value); setRegErrors((p) => ({ ...p, confirm: "" })); }}
                  className={inputClass(regErrors.confirm)}
                  placeholder="••••••••"
                />
                <FieldError msg={regErrors.confirm} />
              </div>

              <button
                onClick={handleRegister}
                className="w-full bg-yellow-400 hover:bg-black hover:text-white text-black font-black py-3.5 rounded-2xl transition-all uppercase text-xs tracking-widest mt-2"
              >
                Create Account
              </button>

              <p className="text-center text-[11px] text-gray-400 pt-1">
                Already registered?{" "}
                <button onClick={switchToLogin} className="text-black font-black hover:text-yellow-500 transition-colors underline underline-offset-2">
                  Sign in
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}