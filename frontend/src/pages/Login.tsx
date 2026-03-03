import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "../assets/logo.png";
import type { PublicUser } from "../types/user";

type FormErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
};

export default function Login() {
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
    else if (!isValidEmail(loginEmail))
      errs.email = "Enter a valid email address.";
    if (!loginPassword) errs.password = "Password is required.";
    return errs;
  };

  const validateRegister = (): FormErrors => {
    const errs: FormErrors = {};
    if (!regName) errs.name = "Name is required";
    if (!regEmail) errs.email = "Email is required.";
    else if (!isValidEmail(regEmail))
      errs.email = "Enter a valid email address.";
    if (!regPassword) errs.password = "Password is required.";
    else if (regPassword.length < 8)
      errs.password = "Password must be at least 8 characters.";
    else if (!/[A-Z]/.test(regPassword))
      errs.password = "Password must contain at least one uppercase letter.";
    else if (!/[0-9]/.test(regPassword))
      errs.password = "Password must contain at least one number.";
    if (!regConfirm) errs.confirm = "Please confirm your password.";
    else if (regConfirm !== regPassword)
      errs.confirm = "Passwords do not match.";
    return errs;
  };

  const handleLogin = async () => {
    const errs = validateLogin();
    setLoginErrors(errs);

    if (Object.keys(errs).length === 0) {
      try {
        const response = await axios.post<PublicUser>(
          "http://localhost:3000/api/users/login",
          { email: loginEmail, password: loginPassword },
          { withCredentials: true },
        );
        const userData = response.data;
        localStorage.setItem("user", JSON.stringify(userData));
        navigate(userData.role === "admin" ? "/admin" : "/dashboard");
      } catch (error: any) {
        const message = error.response?.data?.message || "Login failed";
        setLoginErrors({ email: message });
      } 
    }
  };

  const handleRegister = async () => {
    const errs = validateRegister();
    setRegErrors(errs);

    if (Object.keys(errs).length === 0) {

      try {
        const response = await axios.post<PublicUser>(
          "http://localhost:3000/api/users",
          {
            fullname: regName,
            email: regEmail,
            password: regPassword,
            confirmPass: regConfirm,
          },
          { withCredentials: true },
        );

        const userData = response.data;
        localStorage.setItem("user", JSON.stringify(userData));

        setPage("login");
        setRegName("");
        setRegEmail("");
        setRegPassword("");
        setRegConfirm("");

      } catch (error: any) {
        const message = error.response?.data?.message || "Registration failed";
        setRegErrors({ email: message });
      }
    }
  };

  const switchToRegister = () => {
    setLoginErrors({});
    setPage("register");
  };

  const switchToLogin = () => {
    setRegErrors({});
    setPage("login");
  };

  const LeftPanel = ({ onBack }: { onBack: () => void }) => (
    <div className="bg-gray-100 flex flex-col p-8 md:w-2/5 w-full rounded-3xl m-2 min-w-0">
      <button
        onClick={onBack}
        className="text-black hover:opacity-60 transition-opacity w-fit mb-8"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
      </button>
      <div className="flex flex-col items-center justify-center flex-1 gap-6">
        <h2 className="text-lg font-extrabold text-black leading-snug tracking-tight text-center">
          Work with us to save the roads
        </h2>
        <img
          src={logo}
          alt="RoadPort Logo"
          className="w-28 h-28 object-contain"
        />
      </div>
    </div>
  );

  const FieldError = ({ msg }: { msg?: string }) => (
    <p className="text-red-400 text-xs mt-1 h-4">{msg ?? ""}</p>
  );

  return (
    <div className="min-h-screen bg-yellow-200 flex items-center justify-center p-6 font-mono">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row min-h-[480px]">
        {page === "login" ? (
          <>
            <LeftPanel onBack={() => {}} />

            <div className="flex flex-col justify-center px-12 py-12 md:w-3/5 w-full">
              <h1 className="text-4xl font-bold text-yellow-400 mb-8 text-center tracking-wide">
                Login
              </h1>

              <div className="space-y-4">
                <div>
                  <label className="block text-lg text-yellow-400 font-semibold mb-1 tracking-wide">
                    Email
                  </label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      setLoginErrors((p) => ({ ...p, email: "" }));
                    }}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-gray-50 ${loginErrors.email ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-yellow-300"}`}
                  />
                  <FieldError msg={loginErrors.email} />
                </div>

                <div>
                  <label className="block text-lg text-yellow-400 font-semibold mb-1 tracking-wide">
                    Password
                  </label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      setLoginErrors((p) => ({ ...p, password: "" }));
                    }}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-gray-50 ${loginErrors.password ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-yellow-300"}`}
                  />
                  <FieldError msg={loginErrors.password} />
                  <div className="text-right mt-1">
                    <a
                      href="#"
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      Forgot password?
                    </a>
                  </div>
                </div>

                <div className="pt-2 flex justify-center">
                  <button
                    onClick={handleLogin}
                    className="border border-gray-400 text-gray-700 rounded-full px-10 py-2 text-sm font-semibold hover:bg-yellow-100 hover:border-yellow-400 transition-all duration-200"
                  >
                    Login
                  </button>
                </div>

                <p className="text-center text-xs text-gray-500 pt-1">
                  Not registered?{" "}
                  <button
                    onClick={switchToRegister}
                    className="text-yellow-400 font-semibold hover:underline"
                  >
                    Sign up here
                  </button>
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            <LeftPanel onBack={switchToLogin} />

            <div className="flex flex-col justify-center px-12 py-12 md:w-3/5 w-full">
              <h1 className="text-4xl font-bold text-yellow-400 mb-8 text-center tracking-wide">
                Register
              </h1>

              <div className="space-y-4">
                <div>
                  <label className="block text-lg text-yellow-400 font-semibold mb-1 tracking-wide">
                    Name
                  </label>
                  <input
                    type="name"
                    value={regName}
                    onChange={(e) => {
                      setRegName(e.target.value);
                      setRegErrors((p) => ({ ...p, name: "" }));
                    }}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-gray-50 ${regErrors.name ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-yellow-300"}`}
                  />
                  <FieldError msg={regErrors.name} />
                </div>

                <div>
                  <label className="block text-lg text-yellow-400 font-semibold mb-1 tracking-wide">
                    Email
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => {
                      setRegEmail(e.target.value);
                      setRegErrors((p) => ({ ...p, email: "" }));
                    }}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-gray-50 ${regErrors.email ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-yellow-300"}`}
                  />
                  <FieldError msg={regErrors.email} />
                </div>

                <div>
                  <label className="block text-lg text-yellow-400 font-semibold mb-1 tracking-wide">
                    Password
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => {
                      setRegPassword(e.target.value);
                      setRegErrors((p) => ({ ...p, password: "" }));
                    }}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-gray-50 ${regErrors.password ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-yellow-300"}`}
                  />
                  <FieldError msg={regErrors.password} />
                </div>

                <div>
                  <label className="block text-lg text-yellow-400 font-semibold mb-1 tracking-wide">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={regConfirm}
                    onChange={(e) => {
                      setRegConfirm(e.target.value);
                      setRegErrors((p) => ({ ...p, confirm: "" }));
                    }}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-gray-50 ${regErrors.confirm ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-yellow-300"}`}
                  />
                  <FieldError msg={regErrors.confirm} />
                </div>

                <div className="pt-2 flex justify-center">
                  <button
                    onClick={handleRegister}
                    className="border border-gray-400 text-gray-700 rounded-full px-10 py-2 text-sm font-semibold hover:bg-yellow-100 hover:border-yellow-400 transition-all duration-200"
                  >
                    Create Account
                  </button>
                </div>

                <p className="text-center text-xs text-gray-500 pt-1">
                  Already registered?{" "}
                  <button
                    onClick={switchToLogin}
                    className="text-yellow-400 font-semibold hover:underline"
                  >
                    Log in here
                  </button>
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
