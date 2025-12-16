import { DEFAULT_BILINGUAL_FIELD, VerifiedField } from "@/types/types";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import DeleteIcon from "@mui/icons-material/Delete";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import RemoveDoneIcon from "@mui/icons-material/RemoveDone";
import {
  Box,
  Button,
  Divider,
  IconButton,
  SvgIcon,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import {
  Controller,
  useFieldArray,
  useFormContext,
  useWatch,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import QuantityInput from "./QuantityInput";
import StyledSkeleton from "./StyledSkeleton";
import StyledTextField from "./StyledTextField";

/**
 * Props for the VerifiedBilingualTable component.
 *
 * @interface VerifiedBilingualTableProps
 * @property {string} path - The path to the data source.
 * @property {boolean} [valueColumn] - Optional flag to indicate if the value column should be displayed.
 * @property {string[]} [unitOptions] - Optional array of unit options to be displayed.
 * @property {boolean} [loading] - Optional flag to indicate if the table is in a loading state.
 * @property {boolean} isFocus - Flag to indicate if the table is in focus.
 */
interface VerifiedBilingualTableProps {
  path: string;
  valueColumn?: boolean;
  unitOptions?: string[];
  loading?: boolean;
  isFocus: boolean;
}

/**
 * Component for rendering a verified bilingual table with English and French inputs,
 * optional value column, and actions to verify/unverify and delete rows.
 *
 * @param {VerifiedBilingualTableProps} props - The properties for the component.
 * @param {string} props.path - The path for the form field array.
 * @param {boolean} [props.valueColumn=false] - Flag to show or hide the value column.
 * @param {Array} props.unitOptions - Options for the unit selection in the value column.
 * @param {boolean} [props.loading=false] - Flag to show loading state.
 * @param {boolean} props.isFocus - Flag to set focus on the first English input.
 * @returns {JSX.Element} The rendered component.
 *
 */
const VerifiedBilingualTable = ({
  path,
  valueColumn = false,
  unitOptions,
  loading = false,
  isFocus,
}: VerifiedBilingualTableProps) => {
  const { t } = useTranslation("labelDataValidator");
  const { control, setValue, trigger } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: path,
  });
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [deleteIconFocusIndex, setDeleteIconFocusIndex] = useState<number | null>(null);
  const [verifyIconFocusIndex, setVerifyIconFocusIndex] = useState<number | null>(null);
  const [isFocused, setIsFocused] = useState<string | null>(null);
  const firstEnglishInputRef = useRef<HTMLInputElement | null>(null);
  const data = useWatch({ control, name: path });
  const isVerified = (index: number) => Boolean(data?.[index]?.verified);

  // Function to handle verifying a row
  const handleVerify = async (index: number, value: boolean) => {
    const isValid = await trigger(`${path}.${index}.value`);
    if (isValid) {
      setValue(`${path}.${index}.verified`, value);
    }
  };

  // Function to toggle verify status of a row
  const toggleVerify = async (index: number) => {
    await handleVerify(index, !data?.[index]?.verified);
  };

  // Function to verify all rows
  const setAllVerified = async (value: boolean) => {
    await Promise.all(fields.map((_, index) => handleVerify(index, value)));
  };

  // Set focus on the first English input when the table is in focus
  useEffect(() => {
    if (isFocus && firstEnglishInputRef.current) {
      firstEnglishInputRef.current.focus();
    }
  }, [isFocus]);

  return (
    <Box>
      <TableContainer data-testid={`table-container-${path}`}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell
                className={`select-none ${isVerified(0) ? "!border-b-green-500 !border-b-2" : ""} min-w-48`}
                data-testid={`table-header-english-${path}`}
              >
                <Typography variant="subtitle1" fontWeight="bold">
                  {t("verifiedBilingualTable.english")}
                </Typography>
              </TableCell>
              <TableCell
                className={`select-none ${isVerified(0) ? "!border-b-green-500 !border-b-2" : ""} min-w-48`}
                data-testid={`table-header-french-${path}`}
              >
                <Typography variant="subtitle1" fontWeight="bold">
                  {t("verifiedBilingualTable.french")}
                </Typography>
              </TableCell>
              {valueColumn && (
                <TableCell
                  className={`select-none ${isVerified(0) ? "!border-b-green-500 !border-b-2" : ""} min-w-48`}
                  data-testid={`table-header-value-${path}`}
                >
                  <Typography variant="subtitle1" fontWeight="bold">
                    {t("verifiedBilingualTable.value")}
                  </Typography>
                </TableCell>
              )}
              <TableCell
                data-testid={`table-header-actions-${path}`}
                className={`${isVerified(0) ? "!border-b-green-500 !border-b-2" : ""}`}
              >
                <Typography
                  className="text-center"
                  variant="subtitle1"
                  fontWeight="bold"
                >
                  {t("verifiedBilingualTable.actions")}
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>

          {/* Table Body */}
          <TableBody>
            {fields.map((field, index) =>
              loading ? (
                <TableRow
                  key={`skeleton-${index}`}
                  data-testid={`skeleton-row-${path}-${index}`}
                >
                  <TableCell>
                    <StyledSkeleton />
                  </TableCell>
                  <TableCell>
                    <StyledSkeleton />
                  </TableCell>
                  {valueColumn && (
                    <TableCell>
                      <StyledSkeleton />
                    </TableCell>
                  )}
                  <TableCell>
                    <StyledSkeleton />
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow
                  className={`${isVerified(index) ? "!border-x-green-500 !border-x-2 bg-gray-300 " : ""}
                  ${isVerified(index + 1) && isVerified(index) ? "!border-b-2 border-b-gray-300" : ""}
                  ${!isVerified(index + 1) && isVerified(index) ? "!border-b-green-500 !border-2" : ""}
                  ${isVerified(index) && !isVerified(index - 1) ? "!border-t-green-500 !border-t-2" : ""}`}
                  style={{
                    borderTopStyle:
                      (isVerified(index) && index === 0) ||
                      (isVerified(index - 1) && !isVerified(index)) ||
                      (isVerified(index) && !isVerified(index - 1))
                        ? undefined
                        : "hidden",
                  }}
                  key={field.id}
                  data-testid={`table-row-${path}-${index}`}
                >
                  <TableCell
                    data-testid={`input-english-cell-${path}-${index}`}
                  >
                    <Controller
                      name={`${path}.${index}.en`}
                      control={control}
                      render={({ field }) => (
                        <StyledTextField
                          {...field}
                          placeholder={t(
                            "verifiedBilingualTable.placeholders.english",
                          )}
                          disabled={isVerified(index)}
                          aria-label={t(
                            "verifiedBilingualTable.accessibility.englishInput",
                            { row: index + 1 },
                          )}
                          aria-disabled={isVerified(index)}
                          data-testid={`input-english-${path}-${index}`}
                          multiline
                          inputRef={index === 0 ? firstEnglishInputRef : null}
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell
                    data-testid={`input-english-cell-${path}-${index}`}
                  >
                    <Controller
                      name={`${path}.${index}.fr`}
                      control={control}
                      render={({ field }) => (
                        <StyledTextField
                          {...field}
                          placeholder={t(
                            "verifiedBilingualTable.placeholders.french",
                          )}
                          disabled={isVerified(index)}
                          aria-label={t(
                            "verifiedBilingualTable.accessibility.frenchInput",
                            { row: index + 1 },
                          )}
                          aria-disabled={isVerified(index)}
                          data-testid={`input-french-${path}-${index}`}
                          multiline
                        />
                      )}
                    />
                  </TableCell>
                  {valueColumn && (
                    <TableCell
                      data-testid={`input-english-cell-${path}-${index}`}
                    >
                      <QuantityInput
                        name={`${path}.${index}`}
                        control={control}
                        unitOptions={unitOptions ?? []}
                        disabled={isVerified(index)}
                        verified={isVerified(index)}
                      />
                    </TableCell>
                  )}
                  <TableCell
                    data-testid={`input-english-cell-${path}-${index}`}
                  >
                    <Box className="flex justify-center gap-2">
                      <Tooltip
                        title={t("verifiedBilingualTable.delete")}
                        enterDelay={1000}
                      >
                        <IconButton
                          onClick={() => remove(index)}
                          disabled={isVerified(index) || fields.length <= 1}
                          aria-label={t(
                            "verifiedBilingualTable.accessibility.deleteButton",
                          )}
                          onFocus={() => setDeleteIconFocusIndex(index)}
                          onBlur={() => setDeleteIconFocusIndex(null)}
                          data-testid={`delete-row-btn-${path}-${index}`}
                        >
                          <DeleteIcon aria-hidden="true" className={`${deleteIconFocusIndex === index ? "text-fertiscan-blue font-bold" : ""} `}/>
                        </IconButton>
                      </Tooltip>
                      <Divider
                        orientation="vertical"
                        flexItem
                        sx={{
                          bgcolor: isVerified(index) ? "#00C55E" : "inherit",
                        }}
                      />
                      <Controller
                        name={`${path}.${index}.verified`}
                        control={control}
                        render={({ field: { value } }) => (
                          <Tooltip
                            title={t(
                              value
                                ? "verifiedBilingualTable.unverify"
                                : "verifiedBilingualTable.verify",
                            )}
                            enterDelay={1000}
                          >
                            <span>
                              <IconButton
                                onClick={() => toggleVerify(index)}
                                aria-label={t(
                                  value
                                    ? "verifiedBilingualTable.accessibility.unverifyButton"
                                    : "verifiedBilingualTable.accessibility.verifyButton",
                                )}
                                data-testid={`verify-row-btn-${path}-${index}`}
                                onMouseEnter={() => setHoverIndex(index)}
                                onMouseLeave={() => setHoverIndex(null)}
                                onFocus={() => setVerifyIconFocusIndex(index)}
                                onBlur={() => setVerifyIconFocusIndex(null)}
                              >
                                {hoverIndex === index && isVerified(index) ? (
                                  <SvgIcon aria-hidden>
                                    <image
                                      href="/img/unverifyIcon.svg"
                                      height="24"
                                      width="24"
                                    />
                                  </SvgIcon>
                                ) : (
                                  <CheckIcon
                                  className={`${value ? "text-green-500" : "" }${ verifyIconFocusIndex === index ? "text-fertiscan-blue font-bold" : ""
                                  } `}
                                    aria-hidden
                                  />
                                )}
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                      />
                    </Box>
                  </TableCell>
                </TableRow>
              ),
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Buttons to add rows and bulk verify/unverify */}
      <Box className="flex justify-end gap-2 mt-4">
        {/* Add Row Button */}
        <Button
          className={`${isFocused === "add" ? "!border-fertiscan-blue" : ""}`}
          onClick={() => append(DEFAULT_BILINGUAL_FIELD)}
          variant="outlined"
          color="secondary"
          startIcon={<AddIcon aria-hidden="true" />}
          aria-label={t("verifiedBilingualTable.accessibility.addRowButton")}
          data-testid={`add-row-btn-${path}`}
          onFocus={() => setIsFocused("add")}
          onBlur={() => setIsFocused(null)}
        >
          {t("verifiedBilingualTable.addRow")}
        </Button>

        {/* Mark all as Verified Button */}
        <Tooltip
          title={t("verifiedBilingualTable.verifyAll")}
          enterDelay={1000}
        >
          <Button
            className={`${isFocused === "verifyAll" ? "!border-fertiscan-blue" : ""}`}
            onClick={() => setAllVerified(true)}
            variant="outlined"
            color="secondary"
            disabled={data.every((row: VerifiedField) => row.verified)}
            aria-label={t(
              "verifiedBilingualTable.accessibility.verifyAllButton",
            )}
            data-testid={`verify-all-btn-${path}`}
            onFocus={() => setIsFocused("verifyAll")}
            onBlur={() => setIsFocused(null)}
          >
            <DoneAllIcon aria-hidden="true" />
          </Button>
        </Tooltip>

        {/* Mark all as Unverified Button */}
        <Tooltip
          title={t("verifiedBilingualTable.unverifyAll")}
          enterDelay={1000}
        >
          <Button
            className={`${isFocused === "unverifyAll" ? "!border-fertiscan-blue border-2" : ""}`}
            onClick={() => setAllVerified(false)}
            variant="outlined"
            color="secondary"
            disabled={data.every((row: VerifiedField) => !row.verified)}
            aria-label={t(
              "verifiedBilingualTable.accessibility.unverifyAllButton",
            )}
            data-testid={`unverify-all-btn-${path}`}
            onFocus={() => setIsFocused("unverifyAll")}
            onBlur={() => setIsFocused(null)}
          >
            <RemoveDoneIcon aria-hidden="true" />
          </Button>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default VerifiedBilingualTable;
