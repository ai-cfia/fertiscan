"use client";
import useAlertStore from "@/stores/alertStore";
import axios, { AxiosError } from "axios";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import LoginModal from "./LoginModal";
import SignUpModal from "./SignUpModal";

/**
 * Props for the RouteGuard component.
 *
 * @interface RouteGuardProps
 * @extends {React.HTMLAttributes<HTMLDivElement>}
 *
 * @property {React.ReactNode} children - The child components to be rendered within the RouteGuard.
 */
interface RouteGuardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * RouteGuard component that handles user authentication and authorization.
 * It displays either a login or signup modal based on the authentication state.
 *
 * @component
 * @param {RouteGuardProps} props - The properties passed to the RouteGuard component.
 * @param {React.ReactNode} props.children - The child components to render if the user is authenticated.
 * @param {object} divProps - Additional properties to be spread onto the root div element.
 * @returns {JSX.Element} The rendered RouteGuard component.
 *
 *
 * @function
 * @name RouteGuard
 *
 * @description
 * The RouteGuard component manages user authentication state and displays either a login or signup modal
 * based on whether the user is authenticated. It uses cookies to store the authentication token and
 * provides functions for handling login and signup requests.
 *
 * @property {boolean} isAuth - State indicating whether the user is authenticated.
 * @property {boolean} isSignup - State indicating whether the signup modal should be displayed.
 * @property {function} handleLogin - Function to handle user login.
 * @property {function} handleSignup - Function to handle user signup.
 * @property {function} toggleMode - Function to toggle between login and signup modes.
 * @property {function} useEffect - Hook to set the authentication state based on the presence of a token in cookies.
 */
const RouteGuard = ({ children, ...divProps }: RouteGuardProps) => {
  const { t } = useTranslation("authentication");
  const [isAuth, setAuth] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const { showAlert } = useAlertStore();

  const handleLogin = async (username: string, password: string) => {
    try {
      const res = await axios.post(
        "/api-next/login",
        { username: username },
        {
          headers: {
            Authorization: "Basic " + btoa(username + ":" + password),
          },
        },
      );
      if (res.status >= 200 && res.status < 300) {
        Cookies.set("token", btoa(username), { sameSite: "Strict" });
        setAuth(true);
        return "";
      }
      return t("errors.unknown");
    } catch (err) {
      if (err instanceof AxiosError) {
        if (err.status == 401) {
          return t("errors.unauthorized");
        }
        if (err.status == 404) {
          showAlert(t("errors.notFound"), "error");
          return t("errors.notFound");
        }
      }
      return t("errors.unknown");
    }
  };

  const handleSignup = async (
    username: string,
    password: string,
    confirm: string,
  ) => {
    if (password != confirm) {
      return t("errors.passwordMatch");
    }
    try {
      const res = await axios.post(
        "/api-next/signup",
        { username: username },
        {
          headers: {
            Authorization: "Basic " + btoa(username + ":" + password),
          },
        },
      );
      if (res.status >= 200 && res.status < 300) {
        Cookies.set("token", btoa(username), { sameSite: "Strict" });
        setAuth(true);
        return "";
      }
      return t("errors.unknown");
    } catch (err) {
      if (err instanceof AxiosError) {
        if (err.response) {
          if (err.response.status == 404) {
            showAlert(t("errors.notFound"), "error");
            return t("errors.notFound");
          }
          if (err.response.status == 409) {
            return t("errors.usernameTaken");
          }
        }
      }
      return t("errors.unknown");
    }
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
  };

  useEffect(() => {
    setAuth(!!Cookies.get("token"));
  }, []);

  return (
    <div data-testid={"route-guard-root"} {...divProps}>
      <>
        {isSignup ? (
          <SignUpModal
            isOpen={!isAuth}
            signup={handleSignup}
            onChangeMode={toggleMode}
          />
        ) : (
          <LoginModal
            isOpen={!isAuth}
            login={handleLogin}
            onChangeMode={toggleMode}
          />
        )}
      </>
      {children}
    </div>
  );
};

export default RouteGuard;
