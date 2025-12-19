import { DEFAULT_QUANTITY } from "@/types/types";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import QuantityInput from "./QuantityInput";
import StyledListContainer from "./StyledListContainer";
import { VerifiedFieldWrapper } from "./VerifiedFieldComponents";
import VerifiedListRow from "./VerifiedListRow";

/**
 * Props for the VerifiedQuantityList component.
 *
 * @interface VerifiedQuantityListProps
 *
 * @property {string} label - The label to display for the quantity list.
 * @property {string} path - The path to fetch or post data related to the quantity list.
 * @property {string[]} unitOptions - An array of unit options available for selection.
 * @property {string} [className] - Optional CSS class name for custom styling.
 * @property {boolean} [loading] - Optional flag to indicate if the component is in a loading state.
 */
interface VerifiedQuantityListProps {
  label: string;
  path: string;
  unitOptions: string[];
  className?: string;
  loading?: boolean;
}

/**
 * Component that renders a list of verified quantities with validation and dynamic addition/removal of items.
 *
 * @param {VerifiedQuantityListProps} props - The properties for the VerifiedQuantityList component.
 * @param {string} props.label - The label for the list.
 * @param {string} props.path - The path for the form field.
 * @param {Array} props.unitOptions - The options for the unit dropdown.
 * @param {string} [props.className=""] - Additional class names for styling.
 * @param {boolean} [props.loading=false] - Flag indicating if the component is in a loading state.
 * @returns {JSX.Element} The rendered VerifiedQuantityList component.
 */
const VerifiedQuantityList: React.FC<VerifiedQuantityListProps> = ({
  label,
  path,
  unitOptions,
  className = "",
  loading = false,
}) => {
  const { control, trigger } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `${path}.quantities`,
  });
  const quantitiesPath = `${path}.quantities`;
  const quantities = useWatch({
    control,
    name: quantitiesPath,
  });

  // Validate that the unit is not duplicated in the list.
  const validateFields = async (callback: (valid: boolean) => void) => {
    const validationResults = await Promise.all(
      fields.map((_, index) =>
        Promise.all([
          trigger(`${quantitiesPath}.${index}.unit`),
          trigger(`${quantitiesPath}.${index}.value`),
        ]),
      ),
    );
    const allValid = validationResults.every((result) =>
      result.every((isValid) => isValid),
    );
    callback(allValid);
  };

  // Custom validation rule to check for duplicate units in the list.
  const validateDuplicateUnit = (value: string) => {
    const isDuplicate =
      quantities.filter((item: { unit: string }) => item.unit === value)
        .length > 1;
    return !isDuplicate || "errors.duplicateUnit";
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
          onAppend={() => append(DEFAULT_QUANTITY)}
        >
          {fields.map((fieldItem, index) => (
            <VerifiedListRow
              key={fieldItem.id}
              verified={verified}
              hideDelete={fields.length === 1}
              onDelete={() => remove(index)}
              isLastItem={index === fields.length - 1}
            >
              <QuantityInput
                name={`${quantitiesPath}.${index}`}
                control={control}
                unitOptions={unitOptions}
                disabled={verified}
                unitRules={{ validate: validateDuplicateUnit }}
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

export default VerifiedQuantityList;
