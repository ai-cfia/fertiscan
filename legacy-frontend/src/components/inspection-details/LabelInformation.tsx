import { LabelData } from "@/types/types";
import CheckIcon from "@mui/icons-material/Check";
import {
  Box,
  BoxProps,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  TypographyProps,
} from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { QuantityChips } from "../QuantityChips";
import { RegistrationChips } from "../RegistrationChips";
import BilingualTable from "./BilingualTable";

/**
 * Props for the LabelInformation component.
 *
 * @interface LabelInformationProps
 * @property {LabelData | null} labelData - The data associated with the label. Can be null if no data is available.
 * @property {(text: string) => void} [setNotes] - Optional callback function to set notes text.
 * @property {boolean} disableNotes - Flag to indicate whether the notes section should be disabled.
 */
interface LabelInformationProps {
  labelData: LabelData | null;
  setNotes?: (text: string) => void;
  disableNotes: boolean;
}

/**
 * Component to display detailed information about a label.
 *
 * @component
 * @param {LabelInformationProps} props - The properties for the LabelInformation component.
 * @param {Object} props.labelData - The data object containing all the information about the label.
 * @param {Function} props.setNotes - Function to set the notes for the label.
 * @param {boolean} props.disableNotes - Flag to disable the notes input field.
 * @returns {JSX.Element | null} The rendered LabelInformation component or null if no labelData is provided.
 */
const LabelInformation: React.FC<LabelInformationProps> = ({
  labelData,
  setNotes,
  disableNotes,
}) => {
  const { t } = useTranslation("confirmationPage");

  // Return nothing if labelData is not available
  if (!labelData) return null;

  return (
    <Box className="flex flex-col gap-4">
      {/* Base Information */}
      <Section
        title={t("baseInformation.sectionTitle")}
        testId="base-information-section"
      >
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow className="bg-gray-100">
                {[
                  "name",
                  "registrationNumbers",
                  "lotNumber",
                  "npk",
                  "weight",
                  "density",
                  "volume",
                ].map((key) => (
                  <TableCell key={key} className="">
                    <Typography className="!font-bold">
                      {t(`baseInformation.tableHeaders.${key}`)}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>{labelData.baseInformation.name.value}</TableCell>
                <TableCell>
                  <RegistrationChips
                    registrations={
                      labelData?.baseInformation.registrationNumbers.values
                    }
                  />
                </TableCell>
                <TableCell>
                  {labelData.baseInformation.lotNumber.value}
                </TableCell>
                <TableCell>{labelData.baseInformation.npk.value}</TableCell>
                <TableCell>
                  <QuantityChips
                    quantities={labelData.baseInformation.weight.quantities}
                  />
                </TableCell>
                <TableCell>
                  <QuantityChips
                    quantities={labelData.baseInformation.density.quantities}
                  />
                </TableCell>
                <TableCell>
                  <QuantityChips
                    quantities={labelData.baseInformation.volume.quantities}
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Section>

      {/* Organizations */}
      <Section
        title={t("organizations.sectionTitle")}
        testId="organizations-section"
      >
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow className="bg-gray-100">
                {["mainContact", "name", "address", "website", "phoneNumber"].map(
                  (key) => (
                    <TableCell key={key} className="">
                      <Typography className="!font-bold">
                        {t(`organizations.tableHeaders.${key}`)}
                      </Typography>
                    </TableCell>
                  ),
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {labelData.organizations.map((org, index) => (
                <TableRow key={index}>
                  <TableCell>{org.mainContact && <CheckIcon />}</TableCell>
                  <TableCell>{org.name.value}</TableCell>
                  <TableCell>{org.address.value}</TableCell>
                  <TableCell>
                    <Link
                      href={`http://${org.website.value}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {org.website.value}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`tel:${org.phoneNumber.value}`}>
                      {org.phoneNumber.value}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Section>

      {/* Cautions */}
      <Section title={t("cautions.sectionTitle")} testId="cautions-section">
        <BilingualTable data={labelData.cautions ?? []} />
      </Section>

      {/* Instructions */}
      <Section
        title={t("instructions.sectionTitle")}
        testId="instructions-section"
      >
        <BilingualTable data={labelData.instructions ?? []} />
      </Section>

      {/* Guaranteed Analysis */}
      <Section
        title={t("guaranteedAnalysis.sectionTitle")}
        testId="guaranteed-analysis-section"
      >
        <SubSection
          title={t("guaranteedAnalysis.title")}
          testId="guaranteed-analysis-title-section"
        >
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow className="bg-gray-100">
                  {["english", "french", "isMinimal"].map((key) => (
                    <TableCell key={key}>
                      <Typography className="!font-bold">
                        {t(`guaranteedAnalysis.tableHeaders.${key}`)}
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>
                    {labelData.guaranteedAnalysis.titleEn.value}
                  </TableCell>
                  <TableCell>
                    {labelData.guaranteedAnalysis.titleFr.value}
                  </TableCell>
                  <TableCell>
                    {labelData.guaranteedAnalysis.isMinimal.value
                      ? t("yes")
                      : t("no")}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </SubSection>

        {/* Guaranteed analysis */}
        <SubSection
          title={t("guaranteedAnalysis.nutrients")}
          testId="guaranteed-analysis-nutrients-section"
        >
          <BilingualTable data={labelData.guaranteedAnalysis.nutrients ?? []} />
        </SubSection>
      </Section>

      {/* Ingredients */}
      <Section
        title={t("ingredients.sectionTitle")}
        testId="ingredients-section"
      >
        {!labelData.ingredients.recordKeeping.value ? (
          <Section
            titleProps={{ variant: "body1", className: "mb-2" }}
            title={t("ingredients.nutrients")}
          >
            <BilingualTable data={labelData.ingredients.nutrients ?? []} />
          </Section>
        ) : (
          <Typography className="!font-bold">
            {t("ingredients.recordKeeping")}
          </Typography>
        )}
      </Section>

      {/* Notes */}
      <Section title={t("notes.sectionTitle")} testId="notes-section">
        <TextField
          multiline
          rows={3}
          variant="outlined"
          fullWidth
          placeholder={t("notes.placeholder")}
          value={labelData.comment}
          onChange={(e) => (setNotes ? setNotes(e.target.value) : null)}
          disabled={disableNotes}
          data-testid="notes-textbox"
        />
      </Section>
    </Box>
  );
};

export default LabelInformation;

/**
 * Props for the Section and SubSection component.
 *
 * @interface SectionProps
 * @property {string} title - The title of the component.
 * @property {React.ReactNode} children - The content to be displayed within the component.
 * @property {string} [testId] - Optional test ID for the component, useful for testing purposes.
 * @property {BoxProps} [boxProps] - Optional properties to be passed to the Box component.
 * @property {TypographyProps} [titleProps] - Optional properties to be passed to the Typography component for the title.
 */
interface SectionProps {
  title: string;
  children: React.ReactNode;
  testId?: string;
  boxProps?: BoxProps;
  titleProps?: TypographyProps;
}

/**
 * A functional component that renders a section with a title and children content.
 *
 * @component
 * @param {SectionProps} props - The properties for the Section component.
 * @param {string} props.title - The title to be displayed in the section.
 * @param {React.ReactNode} props.children - The content to be displayed within the section.
 * @param {string} [props.testId] - The test ID for the section, used for testing purposes.
 * @param {BoxProps} [props.boxProps] - Additional properties to be passed to the Box component.
 * @param {TypographyProps} [props.titleProps] - Additional properties to be passed to the Typography component.
 * @returns {JSX.Element} The rendered section component.
 */
const Section: React.FC<SectionProps> = ({
  title,
  children,
  testId,
  boxProps,
  titleProps: typographyProps,
}) => (
  <Box data-testid={testId} {...boxProps}>
    <Typography
      variant="h6"
      gutterBottom
      {...typographyProps}
      className={`text-left !font-bold ${typographyProps?.className}`}
    >
      {title}
    </Typography>
    {children}
  </Box>
);

/**
 * A functional component that renders a subsection within a section.
 *
 * @component
 * @param {SectionProps} props - The properties for the SubSection component.
 * @param {string} props.title - The title to be displayed in the subsection.
 * @param {React.ReactNode} props.children - The content to be displayed within the subsection.
 * @param {string} [props.testId] - The test ID for the subSection, used for testing purposes.
 * @param {BoxProps} [props.boxProps] - Additional properties to be passed to the Box component.
 * @param {TypographyProps} [props.titleProps] - Additional properties to be passed to the Typography component.
 * @returns {JSX.Element} The rendered subsection component.
 */
const SubSection: React.FC<SectionProps> = ({
  title,
  children,
  testId,
  boxProps,
  titleProps,
}) => (
  <Section
    title={title}
    testId={testId}
    boxProps={{ ...boxProps, className: `mb-4 ${boxProps?.className}` }}
    titleProps={{
      variant: "body1",
      ...titleProps,
    }}
  >
    {children}
  </Section>
);
