import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  Modal,
  Typography,
} from "@mui/material";
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
 * Props for the SignUpModal component.
 *
 * @interface SignUpProps
 * @property {boolean} isOpen - Indicates whether the sign-up modal is open.
 * @property {(username: string, password: string, confirm: string) => Promise<string>} signup - Function to handle the sign-up process.
 * @property {() => void} onChangeMode - Function to switch between different modes (e.g., sign-up and login).
 */
interface SignUpProps {
  isOpen: boolean;
  signup: (
    username: string,
    password: string,
    confirm: string,
  ) => Promise<string>;
  onChangeMode: () => void;
}

/**
 * SignUpModal component renders a modal for user sign-up.
 *
 * @param {SignUpProps} props - The properties for the SignUpModal component.
 * @param {boolean} props.isOpen - Determines if the modal is open.
 * @param {Function} props.signup - Function to handle the sign-up process.
 * @param {Function} props.onChangeMode - Function to switch between sign-up and login modes.
 * @returns {JSX.Element} The rendered SignUpModal component.
 */
const SignUpModal = ({ isOpen, signup, onChangeMode }: SignUpProps) => {
  const { t } = useTranslation("authentication");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [checkedReminder, setReminderChecked] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Handles the sign-up process.
  const handleSubmit = () => {
    setLoading(true);
    signup(username, password, confirmPassword).then((message) => {
      setErrorMessage(message);
      setLoading(false);
    });
  };

  return (
    <Modal
      open={isOpen}
      data-testid="modal"
      disableEnforceFocus
      disableAutoFocus
    >
      <AuthBox>
        <Title>{t("signup.title")}</Title>
        <Form>
          <Username value={username} setValue={setUsername} />
          <Password value={password} setValue={setPassword} />
          <Password
            id="confirm-password"
            dataTestId="modal-confirm-password"
            placeholder={t("signup.confirmPassword")}
            value={confirmPassword}
            setValue={setConfirmPassword}
          />

          <FormGroup className="!w-full">
            <FormControlLabel
              data-testid="modal-reminder"
              className="text-white"
              control={
                <Checkbox
                  className="!text-white"
                  disableRipple
                  value={checkedReminder}
                  onChange={() => setReminderChecked(!checkedReminder)}
                />
              }
              label={
                <Typography className="text-justify !text-xs">
                  {t("signup.dataPolicy")}
                  <br />
                  <u>{t("signup.dataReminder")}</u>
                </Typography>
              }
            />
          </FormGroup>

          <ErrorMessage>{errorMessage}</ErrorMessage>

          <LoadingButton
            onClick={handleSubmit}
            disabled={
              username === "" ||
              password === "" ||
              confirmPassword === "" ||
              !checkedReminder
            }
            loading={loading}
            text={t("signup.title")}
            data-testid="modal-submit"
            className="!pointer-events-auto !bg-white"
          />
        </Form>

        <Typography
          data-testid="modal-change"
          id="toggleSign"
          className="!mt-2 !mb-1 text-center text-white"
        >
          {t("signup.switchText")}
          <ToggleSign onChangeMode={onChangeMode}>
            {t("signup.switchLink")}
          </ToggleSign>
        </Typography>
      </AuthBox>
    </Modal>
  );
};

export default SignUpModal;
