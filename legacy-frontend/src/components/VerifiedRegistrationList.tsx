import { DEFAULT_REGISTRATION_NUMBER } from "@/types/types";
import { useFieldArray, useFormContext } from "react-hook-form";
import RegistrationInput from "./RegistrationInput";
import StyledListContainer from "./StyledListContainer";
import { VerifiedFieldWrapper } from "./VerifiedFieldComponents";
import VerifiedListRow from "./VerifiedListRow";

/**
 * Props for the VerifiedRegistrationList component.
 *
 * @property {string} label - The label to display for the list.
 * @property {string} path - The path to fetch the verified registrations from.
 * @property {string} [className] - Optional additional class names for styling.
 * @property {boolean} [loading] - Optional flag to indicate if the list is loading.
 */
interface VerifiedRegistrationListProps {
  label: string;
  path: string;
  className?: string;
  loading?: boolean;
}

/**
 * Component for rendering a list of verified registrations.
 *
 * @param {VerifiedRegistrationListProps} props - The properties for the component.
 * @param {string} props.label - The label for the list.
 * @param {string} props.path - The path for the form context.
 * @param {string} [props.className=""] - Optional additional class name for styling.
 * @param {boolean} [props.loading=false] - Flag indicating if the component is in a loading state.
 * @returns {JSX.Element} The rendered component.
 */
const VerifiedRegistrationList: React.FC<VerifiedRegistrationListProps> = ({
  label,
  path,
  className = "",
  loading = false,
}) => {
  const valuesPath = `${path}.values`;
  const { control, trigger } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: valuesPath,
  });

  const validateFields = async (callback: (valid: boolean) => void) => {
    const validationResults = await Promise.all(
      fields.map((_, index) =>
        Promise.all([
          trigger(`${valuesPath}.${index}.identifier`),
          trigger(`${valuesPath}.${index}.type`),
        ]),
      ),
    );
    const allValid = validationResults.every((result) =>
      result.every((isValid) => isValid),
    );
    callback(allValid);
  };

  return (
    <VerifiedFieldWrapper
      label={label}
      path={path}
      className={className}
      loading={loading}
      validate={validateFields}
      renderField={({ setIsFocused, control, verified }) => (
        <StyledListContainer
          path={path}
          verified={verified}
          onAppend={() => append(DEFAULT_REGISTRATION_NUMBER)}
        >
          {fields.map((fieldItem, index) => (
            <VerifiedListRow
              key={fieldItem.id}
              verified={verified}
              hideDelete={fields.length === 1}
              onDelete={() => remove(index)}
              isLastItem={index === fields.length - 1}
            >
              <RegistrationInput
                name={`${valuesPath}.${index}`}
                control={control}
                disabled={verified}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                verified={verified}
              />
            </VerifiedListRow>
          ))}
        </StyledListContainer>
      )}
    />
  );
};

export default VerifiedRegistrationList;
