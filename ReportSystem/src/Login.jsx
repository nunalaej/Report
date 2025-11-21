import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  // Auto redirect if already logged in
  useEffect(() => {
    try {
      const raw = localStorage.getItem("currentUser");
      if (!raw) return;
      const user = JSON.parse(raw);

      if (user?.kind === "admin") {
        navigate("/Admin", { replace: true }); // should render Admin/App.jsx
      } else if (user?.kind === "staff") {
        navigate("/Staff", { replace: true }); // should render Staff/App_staff.jsx
      } else if (user?.kind === "user") {
        navigate("/create", { replace: true });
      }
    } catch {}
  }, [navigate]);

  const [mode, setMode] = useState("otp"); // "otp" | "adminStaff"
  const [light, setLight] = useState(false);

  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("");

  const showMsg = (type, text) => {
    setMsgType(type);
    setMsg(text);
  };

  // OTP state
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const timerRef = useRef(null);

  // Admin/Staff creds
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);

  const normEmail = () => (email || "").trim().toLowerCase();

  const sendOtp = async () => {
    const em = normEmail();
    if (!em) return showMsg("error", "Enter email first.");

    setSending(true);
    showMsg("info", "Sending code...");

    try {
      const res = await fetch("http://localhost:3000/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em }),
      });
      const data = await res.json();

      if (data.success) {
        setOtpSent(true);
        showMsg("success", "Code sent.");
        setResendIn(30);

        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setResendIn((t) => {
            if (t <= 1) {
              clearInterval(timerRef.current);
              return 0;
            }
            return t - 1;
          });
        }, 1000);
      } else {
        showMsg("error", "Failed to send code.");
      }
    } catch {
      showMsg("error", "Network error while sending code.");
    } finally {
      setSending(false);
    }
  };

  const verifyOtp = async (val) => {
    const em = normEmail();
    const code = String((val ?? otp ?? "").replace(/\D/g, ""));
    if (code.length !== 6) return showMsg("error", "Enter 6 digits.");

    setVerifying(true);
    try {
      const res = await fetch("http://localhost:3000/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em, code }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem(
          "currentUser",
          JSON.stringify({ kind: "user", email: em })
        );
        const dest = from && from !== "/" ? from : "/create";
        navigate(dest, { replace: true });
      } else {
        showMsg("error", "Invalid or expired code.");
      }
    } catch {
      showMsg("error", "Network error while verifying code.");
    } finally {
      setVerifying(false);
    }
  };

  // Auto verify when 6 digits entered
  useEffect(() => {
    if (otpSent && otp.length === 6 && !verifying) verifyOtp(otp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp, otpSent]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const loginAdminOrStaff = async () => {
    if (!adminUser.trim() || !adminPass.trim())
      return showMsg("error", "Enter credentials.");

    setAdminLoading(true);
    try {
      // Admin account
      if (adminUser === "admin" && adminPass === "admin") {
        localStorage.setItem(
          "currentUser",
          JSON.stringify({ kind: "admin", username: "admin" })
        );
        navigate("/Admin", { replace: true });
      }
      // Staff account
      else if (
        adminUser === "staff@dlsud.edu.ph" &&
        adminPass === "staff123"
      ) {
        localStorage.setItem(
          "currentUser",
          JSON.stringify({
            kind: "staff",
            email: "staff@dlsud.edu.ph",
          })
        );
        navigate("/Staff", { replace: true });
      } else {
        showMsg("error", "Invalid admin or staff credentials.");
      }
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <div className={`create-scope ${light ? "create-scope--light" : ""}`}>
      <div
        className="create-scope__layout"
        style={{ gridTemplateColumns: "1fr" }}
      >
        <main className="create-scope__main" style={{ width: "100%" }}>
          <section
            className="create-scope__panel login-card"
            style={{ maxWidth: 680, width: "100%" }}
          >
            <header className="create-scope__panel-head login-card-head">
              <h2 className="create-scope__panel-title">Login</h2>

              <label className="create-scope__switch">
                <input
                  type="checkbox"
                  checked={light}
                  onChange={() => setLight((v) => !v)}
                  aria-label="Toggle light mode"
                />
                <span className="create-scope__slider" />
                <span className="create-scope__switch-label">Light</span>
              </label>
            </header>

            {/* Morphing tabs */}
            <div className="login-tabs-morph">
              <button
                type="button"
                className={`morphButton ${mode === "otp" ? "expanded" : ""}`}
                onClick={() => {
                  setMode("otp");
                  setMsg("");
                }}
                aria-pressed={mode === "otp"}
                aria-label="Email OTP login"
              >
                <span className="icon" aria-hidden="true">
                  📧
                </span>
                <span className="buttonLabel">Email OTP</span>
              </button>

              <button
                type="button"
                className={`morphButton ${
                  mode === "adminStaff" ? "expanded" : ""
                }`}
                onClick={() => {
                  setMode("adminStaff");
                  setMsg("");
                }}
                aria-pressed={mode === "adminStaff"}
                aria-label="Admin or staff login"
              >
                <span className="icon" aria-hidden="true">
                  <svg
                    width="34"
                    height="34"
                    className="admin-svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      opacity="0.18"
                      d="M12 2 4 5v6c0 6 4 10 8 11 4-1 8-5 8-11V5l-8-3Z"
                    />
                    <path d="M12 12a2.5 2.5 0 1 0-2.5-2.5A2.5 2.5 0 0 0 12 12Zm0 1c-2.5 0-4.5 1.25-4.5 3v1H16.5v-1c0-1.75-2-3-4.5-3Z" />
                  </svg>
                </span>
                <span className="buttonLabel">Admin / Staff</span>
              </button>
            </div>

            <div className="create-scope__panel-body">
              {msg && (
                <div
                  className={`create-scope__message ${
                    msgType ? "is-" + msgType : ""
                  }`}
                >
                  {msg}
                </div>
              )}

              {mode === "otp" ? (
                <form
                  className="create-scope__form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    otpSent ? verifyOtp() : sendOtp();
                  }}
                >
                  <div className="create-scope__group">
                    <label>Email</label>
                    <input
                      type="email"
                      placeholder="name@dlsud.edu.ph"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  {!otpSent ? (
                    <button
                      type="button"
                      className="create-scope__btn create-scope__btn--primary"
                      onClick={sendOtp}
                      disabled={sending}
                    >
                      {sending ? "Sending…" : "Send verification code"}
                    </button>
                  ) : (
                    <>
                      <div className="create-scope__group">
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="Enter 6 digit code"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          maxLength={6}
                        />
                        <div className="create-scope__hint">
                          {resendIn > 0
                            ? `You can resend in ${resendIn}s`
                            : "You can resend a new code."}
                        </div>
                      </div>

                      <div className="create-scope__otp-row">
                        <button
                          type="submit"
                          className="create-scope__btn create-scope__btn--primary create-scope__w-full"
                          disabled={verifying}
                        >
                          {verifying ? "Verifying…" : "Verify & Login"}
                        </button>

                        <button
                          type="button"
                          className="create-scope__btn create-scope__btn--ghost"
                          onClick={sendOtp}
                          disabled={resendIn > 0}
                          aria-disabled={resendIn > 0}
                          title={
                            resendIn > 0 ? `Wait ${resendIn}s` : "Resend code"
                          }
                        >
                          Resend
                        </button>
                      </div>
                    </>
                  )}
                </form>
              ) : (
                <form
                  className="create-scope__form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    loginAdminOrStaff();
                  }}
                >
                  <div className="create-scope__group">
                    <label>Admin or Staff Username</label>
                    <input
                      type="text"
                      placeholder='admin or staff@dlsud.edu.ph'
                      value={adminUser}
                      onChange={(e) => setAdminUser(e.target.value)}
                    />
                  </div>

                  <div className="create-scope__group">
                    <label>Password</label>
                    <input
                      type="password"
                      placeholder='admin or staff123'
                      value={adminPass}
                      onChange={(e) => setAdminPass(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="create-scope__btn create-scope__btn--primary"
                    disabled={adminLoading}
                  >
                    {adminLoading ? "Signing in…" : "Login as Admin or Staff"}
                  </button>
                </form>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
