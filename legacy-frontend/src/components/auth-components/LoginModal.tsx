import { Modal, Typography } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import LoadingButton from "../LoadingButton";
import AuthBox from "./AuthBox";
import ErrorMessage from "./ErrorMessage";
import Form from "./Form";
import Password from "./Password";
import Title from "./Title";
import ToggleSign from "./ToggleSign";
import Username from "./Username";

/**
 * Props for the LoginModal component.
 *
 * @interface LoginProps
 * @property {boolean} isOpen - Indicates whether the login modal is open.
 * @property {(username: string, password: string) => Promise<string>} login - Function to handle the login process, returns a promise that resolves to a string.
 * @property {() => void} onChangeMode - Function to handle the change of mode (e.g., switching to a signup modal).
 */
interface LoginProps {
  isOpen: boolean;
  login: (username: string, password: string) => Promise<string>;
  onChangeMode: () => void;
}

/**
 * LoginModal component handles the user login process.
 *
 * @component
 * @param {LoginProps} props - The properties for the LoginModal component.
 * @param {boolean} props.isOpen - Determines if the modal is open.
 * @param {Function} props.login - Function to handle the login process.
 * @param {Function} props.onChangeMode - Function to handle changing the authentication mode.
 * @returns {JSX.Element} The rendered LoginModal component.
 */
const LoginModal = ({ isOpen, login, onChangeMode }: LoginProps) => {
  const { t } = useTranslation("authentication");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Handles the form submission for the login process.
  const handleSubmit = () => {
    setLoading(true);
    login(username, password).then((message) => {
      console.log(message);
      setErrorMessage(message);
      setLoading(false);
    });
  };

  return (
    <Modal
      open={isOpen}
      data-testid="modal"
      disableAutoFocus
      disableEnforceFocus
    >
      <AuthBox>
        <Title>{t("login.title")}</Title>
        <Form>
          <Username value={username} setValue={setUsername} />
          <Password value={password} setValue={setPassword} />
          <ErrorMessage>{errorMessage}</ErrorMessage>
          <LoadingButton
            onClick={handleSubmit}
            disabled={username === "" || password === ""}
            loading={loading}
            text={t("login.title")}
            className="!pointer-events-auto !bg-white"
            data-testid="modal-submit"
          />
        </Form>
        <Typography
          data-testid="modal-change"
          id="toggleSign"
          className="!mt-4 !mb-4 text-center text-white"
        >
          {t("login.switchText")}
          <ToggleSign onChangeMode={onChangeMode}>
            {t("login.switchLink")}
          </ToggleSign>
        </Typography>
      </AuthBox>
    </Modal>
  );
};

export default LoginModal;
