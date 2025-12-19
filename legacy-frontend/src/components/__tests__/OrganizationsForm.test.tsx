import {
  DEFAULT_BASE_INFORMATION,
  DEFAULT_LABEL_DATA,
  DEFAULT_ORGANIZATION,
  LabelData,
  Organization,
} from "@/types/types";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { act, useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import OrganizationsForm from "../OrganizationsForm";
import { useTranslation } from "react-i18next";

const Wrapper = ({
  initialData,
  onStateChange,
}: {
  initialData: LabelData;
  onStateChange?: (data: LabelData) => void;
}) => {
  const [labelData, setLabelData] = useState<LabelData>(initialData);
  const methods = useForm<LabelData>({
    defaultValues: labelData,
  });

  useEffect(() => {
    if (onStateChange) {
      onStateChange(labelData);
    }
  }, [labelData, onStateChange]);

  return (
    <FormProvider {...methods}>
      <OrganizationsForm labelData={labelData} setLabelData={setLabelData} />
    </FormProvider>
  );
};

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("OrganizationsForm Rendering", () => {
  it("should render the correct number of organizations", () => {
    render(
      <Wrapper
        initialData={{
          ...DEFAULT_LABEL_DATA,
          organizations: [DEFAULT_ORGANIZATION, DEFAULT_ORGANIZATION],
          baseInformation: DEFAULT_BASE_INFORMATION,
          cautions: [],
        }}
      />,
    );

    const organizationFields = screen.getAllByTestId(/organization-\d+/);
    expect(organizationFields).toHaveLength(2);
  });

  it("should render all inputs for each organization", () => {
    const { t } = useTranslation("labelDataValidator");
    render(<Wrapper initialData={DEFAULT_LABEL_DATA} />);
    expect(screen.getByPlaceholderText(t("organizations.fields.name.placeholder"))).toBeInTheDocument();
    expect(screen.getByPlaceholderText(t("organizations.fields.address.placeholder"))).toBeInTheDocument();
    expect(screen.getByPlaceholderText(t("organizations.fields.website.placeholder"))).toBeInTheDocument();
    expect(screen.getByPlaceholderText(t("organizations.fields.phone.placeholder"))).toBeInTheDocument();
  });

  it("should render the Add Organization button", () => {
      const { t } = useTranslation("labelDataValidator");
    render(
      <Wrapper
        initialData={{
          ...DEFAULT_LABEL_DATA,
          organizations: [],
        }}
      />,
    );

    const addButton = screen.getByTestId("add-org-btn");
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveTextContent(t("organizations.addOrganization"));
  });
});

describe("OrganizationsForm Functionality", () => {
  it("should add a new organization when Add Organization button is clicked", () => {
    render(
      <Wrapper
        initialData={{
          ...DEFAULT_LABEL_DATA,
          organizations: [],
        }}
      />,
    );

    expect(screen.queryAllByTestId(/organization-\d+/)).toHaveLength(0);
    const addButton = screen.getByTestId("add-org-btn");
    fireEvent.click(addButton);
    expect(screen.queryAllByTestId(/organization-\d+/)).toHaveLength(1);
  });

  it("should remove an organization when Remove button is clicked", () => {
    render(<Wrapper initialData={DEFAULT_LABEL_DATA} />);

    expect(screen.queryAllByTestId(/organization-\d+/)).toHaveLength(1);
    const removeButton = screen.getByTestId("remove-org-btn-0");
    fireEvent.click(removeButton);
    expect(screen.queryAllByTestId(/organization-\d+/)).toHaveLength(0);
  });

  it("should update watched organizations in state when a field is updated", async () => {
    const mockStateChange = jest.fn();

    render(
      <Wrapper
        initialData={DEFAULT_LABEL_DATA}
        onStateChange={mockStateChange}
      />,
    );

    const input = document.querySelector(
      'input[name="organizations.0.address.value"]',
    );
    expect(input).toBeInTheDocument();

    fireEvent.change(input!, { target: { value: "Updated Address" } });
    expect(input).toHaveValue("Updated Address");

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });
    expect(mockStateChange).toHaveBeenCalledWith(
      expect.objectContaining({
        organizations: [
          expect.objectContaining({
            address: expect.objectContaining({
              value: "Updated Address",
            }),
          }),
        ],
      }),
    );
  });

  it("should update the organization field verification when the Verified button is clicked", async () => {
    const mockStateChange = jest.fn();

    render(
      <Wrapper
        initialData={DEFAULT_LABEL_DATA}
        onStateChange={mockStateChange}
      />,
    );

    const verifyButton = screen.getByTestId(
      "toggle-verified-btn-organizations.0.address.verified",
    );
    expect(verifyButton).toBeInTheDocument();

    fireEvent.click(verifyButton);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });
    expect(mockStateChange).toHaveBeenCalledWith(
      expect.objectContaining({
        organizations: [
          expect.objectContaining({
            address: expect.objectContaining({
              verified: true,
            }),
          }),
        ],
      }),
    );
  });

  it("should mark all fields as Verified and update the data when Mark All Verified button is clicked", async () => {
    const mockStateChange = jest.fn();

    render(
      <Wrapper
        initialData={DEFAULT_LABEL_DATA}
        onStateChange={mockStateChange}
      />,
    );

    const verifyAllButton = screen.getByTestId("verify-all-btn-0");
    expect(verifyAllButton).toBeInTheDocument();

    fireEvent.click(verifyAllButton);
    expect(verifyAllButton).toBeDisabled();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });
    expect(mockStateChange).toHaveBeenCalledWith(
      expect.objectContaining({
        organizations: [
          expect.objectContaining({
            name: expect.objectContaining({
              verified: true,
            }),
            address: expect.objectContaining({
              verified: true,
            }),
            website: expect.objectContaining({
              verified: true,
            }),
            phoneNumber: expect.objectContaining({
              verified: true,
            }),
          }),
        ],
      }),
    );
  });

  it("should disable the Verify All button if all fields are already Verified", () => {
    const verifiedOrg: Organization = {
      name: {
        value: "",
        verified: true,
      },
      address: {
        value: "",
        verified: true,
      },
      website: {
        value: "",
        verified: true,
      },
      phoneNumber: {
        value: "",
        verified: true,
      },
      mainContact: false,
    };

    render(
      <Wrapper
        initialData={{
          ...DEFAULT_LABEL_DATA,
          organizations: [verifiedOrg],
        }}
      />,
    );

    const verifyAllButton = screen.getByTestId("verify-all-btn-0");
    expect(verifyAllButton).toBeDisabled();
  });

  it("should mark all fields as Unverified and update the data when Mark All Unverified button is clicked", async () => {
    const mockStateChange = jest.fn();

    const partiallyVerifiedOrg = {
      name: {
        value: "Test Name",
        verified: true,
      },
      address: {
        value: "123 Test St",
        verified: false,
      },
      website: {
        value: "https://test.com",
        verified: false,
      },
      phoneNumber: {
        value: "123-456-7890",
        verified: false,
      },
      mainContact: false,
    };

    render(
      <Wrapper
        initialData={{
          ...DEFAULT_LABEL_DATA,
          organizations: [partiallyVerifiedOrg],
        }}
        onStateChange={mockStateChange}
      />,
    );

    const unverifyAllButton = screen.getByTestId("unverify-all-btn-0");
    expect(unverifyAllButton).toBeInTheDocument();

    fireEvent.click(unverifyAllButton);
    expect(unverifyAllButton).toBeDisabled();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });
    expect(mockStateChange).toHaveBeenCalledWith(
      expect.objectContaining({
        organizations: [
          expect.objectContaining({
            name: expect.objectContaining({
              verified: false,
            }),
            address: expect.objectContaining({
              verified: false,
            }),
            website: expect.objectContaining({
              verified: false,
            }),
            phoneNumber: expect.objectContaining({
              verified: false,
            }),
          }),
        ],
      }),
    );
  });

  it("should disable the Mark All Unverified button if all fields are already Unverified", () => {
    const allUnverifiedOrg = {
      name: {
        value: "Test Name",
        verified: false,
      },
      address: {
        value: "123 Test St",
        verified: false,
      },
      website: {
        value: "https://test.com",
        verified: false,
      },
      phoneNumber: {
        value: "123-456-7890",
        verified: false,
      },
      mainContact: false,
    };

    render(
      <Wrapper
        initialData={{
          ...DEFAULT_LABEL_DATA,
          organizations: [allUnverifiedOrg],
        }}
      />,
    );

    const unverifyAllButton = screen.getByTestId("unverify-all-btn-0");
    expect(unverifyAllButton).toBeDisabled();
  });

  it("should update the main contact selection when radio button is clicked", async () => {
    render(
      <Wrapper
        initialData={{
          ...DEFAULT_LABEL_DATA,
          organizations: [DEFAULT_ORGANIZATION, DEFAULT_ORGANIZATION],
        }}
      />,
    );

    const firstRadio = screen
      .getByTestId("main-contact-radio-0")
      .querySelector("input");
    const secondRadio = screen
      .getByTestId("main-contact-radio-1")
      .querySelector("input");

    expect(firstRadio).not.toBeChecked();
    expect(secondRadio).not.toBeChecked();

    fireEvent.click(firstRadio!);
    await waitFor(() => expect(firstRadio).toBeChecked());
    expect(secondRadio).not.toBeChecked();

    fireEvent.click(secondRadio!);
    await waitFor(() => expect(secondRadio).toBeChecked());
    expect(firstRadio).not.toBeChecked();
  });
});

describe("OrganizationsForm Edge Cases", () => {
  it("should render correctly when no organizations are in labelData", () => {
  const { t } = useTranslation("labelDataValidator");
    render(
      <Wrapper
        initialData={{
          ...DEFAULT_LABEL_DATA,
          organizations: [],
        }}
      />,
    );

    const addButton = screen.getByTestId("add-org-btn");
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveTextContent(t("organizations.addOrganization"));

    const organizationFields = screen.queryAllByTestId(/organization-\d+/);
    expect(organizationFields).toHaveLength(0);
  });
});
