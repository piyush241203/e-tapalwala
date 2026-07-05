"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";
import api from "@/lib/api";
import { useAuthStore, Role } from "@/store/auth.store";
import { getErrorMessage } from "@/lib/utils";
import logoImage from "../../assests/logo.jpg";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password required"),
});

type LoginForm = z.infer<typeof loginSchema>;
type TabType = "city-admin" | "operator";

const tabConfig: Record<
  TabType,
  {
    label: string;
    portalLabel: string;
    description: string;
    apiRole: string;
  }
> = {
  "city-admin": {
    label: "City Admin",
    portalLabel: "CITY ADMIN PORTAL",
    description: "City Administration Portal",
    apiRole: "CITY_ADMIN",
  },
  operator: {
    label: "Operator",
    portalLabel: "OPERATOR PORTAL",
    description: "Field Operations Portal",
    apiRole: "OPERATOR",
  },
};

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>("city-admin");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const tab = tabConfig[activeTab];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const handleTabChange = (t: TabType) => {
    setActiveTab(t);
    reset();
    setShowPassword(false);
  };

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', data);
      const { user, accessToken, refreshToken } = res.data;

      // Validate the response has the expected role for the selected tab
      const isTabCityAdmin = activeTab === 'city-admin' && (user.role === 'CITY_ADMIN' || user.role === 'Admin');
      const isTabOperator = activeTab === 'operator' && ['OPERATOR', 'Clerk', 'Superintendent', 'Officer'].includes(user.role);

      if (!isTabCityAdmin && !isTabOperator) {
        toast.error(`This account is not a ${tabConfig[activeTab].label}. Please use the correct portal.`);
        setIsLoading(false);
        return;
      }

      setAuth(user, accessToken, refreshToken);
      toast.success(`Welcome back, ${user.fullName}!`);

      if (user.role === 'PLATFORM_ADMIN') {
        router.push('/super-admin/dashboard');
      } else if (isTabCityAdmin && user.citySlug) {
        router.push(`/${user.citySlug}/dashboard`);
      } else if (isTabOperator && user.citySlug) {
        router.push(`/${user.citySlug}/operator/dashboard`);
      } else {
        // citySlug is null — city is likely misconfigured on the backend
        toast.error('Your account is not assigned to a city yet. Please contact your administrator.');
        setIsLoading(false);
      }
      // Note: intentionally NOT setting isLoading(false) on success
      // so the button spinner stays active during the router transition
    } catch (err) {
      toast.error(getErrorMessage(err));
      setIsLoading(false);
    }
  };

  return (
    <div className="login-root">
      {/* ── LEFT PANEL ── */}
      <div className="login-left">
        {/* Mascot card */}
        <div className="mascot-card">
          <Image
            src={logoImage}
            alt="eTapalwala mascot"
            width={180}
            height={180}
            className="mascot-img"
            priority
          />
        </div>

        <p className="powered-by">POWERED BY VITTHU CONNECT</p>

        <h2 className="left-headline">
          Powering government
          <br />
          communication
        </h2>

        <p className="left-sub">
          A secure WhatsApp Business platform for government and enterprise
          organisations across India.
        </p>

        <div className="feature-pills">
          <span className="pill">Multi-Tenant</span>
          <span className="pill">Enterprise Ready</span>
          <span className="pill">WhatsApp API</span>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="login-right">
        <div className="login-form-wrapper">
          {/* Portal selector */}
          <p className="select-portal-label">Select portal</p>
          <div className="tab-bar">
            {(["city-admin", "operator"] as TabType[]).map((t) => (
              <button
                key={t}
                id={`tab-${t}`}
                onClick={() => handleTabChange(t)}
                className={`tab-btn${activeTab === t ? " tab-btn--active" : ""}`}
              >
                {tabConfig[t].label}
              </button>
            ))}
          </div>

          {/* Portal badge */}
          <p className="portal-badge">{tab.portalLabel}</p>

          {/* Heading */}
          <h1 className="sign-in-heading">Sign in to your account</h1>
          <p className="sign-in-sub">{tab.description}</p>

          {/* Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="login-form"
            noValidate
          >
            {/* Email */}
            <div className="field-group">
              <label className="field-label" htmlFor="email">
                Email address
              </label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={16} />
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="field-input"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="field-error">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="field-group">
              <label className="field-label" htmlFor="password">
                Password
              </label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={16} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="field-input"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="eye-btn"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <p className="field-error">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              id={`btn-signin-${activeTab}`}
              className="signin-btn"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
