/* eslint-disable react/display-name */
/* eslint-disable react-hooks/rules-of-hooks */
import FileUploaded from "@/classes/File";
import useUploadedFilesStore from "@/stores/fileStore";
import useLabelDataStore from "@/stores/labelDataStore";
import { VERIFIED_LABEL_DATA } from "@/utils/client/constants";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useTranslation } from "react-i18next";
import { Response } from "whatwg-fetch";
import HomePage from "../page";

const mockedRouterPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      route: "/",
      pathname: "",
      query: "",
      asPath: "",
      push: mockedRouterPush,
    };
  },
}));

jest.mock("react-i18next", () => ({
  useTranslation: jest.fn().mockReturnValue({
    t: (key: string) => key,
  }),
}));
const { t } = useTranslation("homePage");

global.URL.createObjectURL = jest
  .fn()
  .mockImplementation(() => "blob:example/image.png");
global.fetch = jest.fn((path: string | URL | Request) => {
  if (
    typeof path === "string" &&
    (path.endsWith(".png") || path.endsWith(".jpeg"))
  ) {
    return Promise.resolve(
      new Response("", {
        status: 200,
        headers: new Headers({
          "Content-Type": path.endsWith(".png") ? "image/png" : "image/jpeg",
        }),
      }),
    );
  } else if (typeof path === "string" && path.endsWith(".pdf")) {
    return Promise.resolve(
      new Response("", {
        status: 200,
        headers: new Headers({ "Content-Type": "application/pdf" }),
      }),
    );
  }
  return Promise.resolve(
    new Response(JSON.stringify({ error: "Unsupported file type" }), {
      status: 400,
      headers: new Headers({ "Content-Type": "application/json" }),
    }),
  );
});

describe("HomePage Component", () => {
  afterEach(() => {
    const store = useUploadedFilesStore;
    store.getState().clearUploadedFiles();
  });

  it("should allow file uploads and display the uploaded files", async () => {
    render(<HomePage />);

    // Mock file
    const file = new File(["hello"], "hello.png", { type: "image/png" });

    // Find the file input element and upload the file
    const input = screen.getByTestId("browse-file-button");
    userEvent.upload(input, file);

    // Check that the file was uploaded and appears in the list.
    const fileElement = await screen.findByTestId("file-element-hello.png");
    expect(fileElement).toBeInTheDocument();

    const fileName = await screen.findByTestId("file-name");
    expect(fileName).toHaveTextContent("hello.png");

    fireEvent.mouseEnter(fileElement);

    await waitFor(() => {
      // Find and click the delete button
      const deleteButton = screen.getByTestId("delete-hello.png");
      fireEvent.click(deleteButton);
    });

    // Check that the file was removed
    expect(
      screen.queryByTestId("file-element-hello.png"),
    ).not.toBeInTheDocument();
  });

  it("should allow file uploads via drag and drop", async () => {
    render(<HomePage />);

    // Mock file
    const file = new File(["hello"], "hello.png", { type: "image/png" });

    // Create a dataTransfer object
    interface DataTransferItem {
      kind: string;
      type: string;
      getAsFile: () => File;
      webkitGetAsEntry: () => {
        isFile: boolean;
        file: (callback: (file: File) => void) => void;
      };
    }

    interface DataTransfer {
      items: DataTransferItem[];
      files: File[];
    }

    const dataTransfer: DataTransfer = {
      items: [
        {
          kind: "file",
          type: file.type,
          getAsFile: () => file,
          webkitGetAsEntry: () => ({
            isFile: true,
            file: (callback) => {
              callback(file);
            },
          }),
        },
      ],
      files: [file],
    };

    // Find the dropzone and simulate the drop event
    const dropzone = await screen.getByTestId("dropzone");

    fireEvent.drop(dropzone, {
      dataTransfer: dataTransfer,
    });

    // Check that the file was uploaded and appears in the list.
    const fileElement = await screen.findByTestId("file-element-hello.png");
    expect(fileElement).toBeInTheDocument();

    const fileName = await screen.findByTestId("file-name");
    expect(fileName).toHaveTextContent("hello.png");

    fireEvent.mouseEnter(fileElement);

    await waitFor(() => {
      // Find and click the delete button
      const deleteButton = screen.getByTestId("delete-hello.png");
      fireEvent.click(deleteButton);
    });

    // Check that the file was removed
    expect(
      screen.queryByTestId("file-element-hello.png"),
    ).not.toBeInTheDocument();
  });

  it("should allow file upload via input and keep hover effect until delete button is clicked", async () => {
    render(<HomePage />);

    // Mock file
    const file = new File(["hello"], "hello.png", { type: "image/png" });

    // Find the file input element and upload the file
    const input = screen.getByTestId("browse-file-button");
    userEvent.upload(input, file);

    // Check that the file was uploaded and appears in the list.
    const fileElement = await screen.findByTestId("file-element-hello.png");
    expect(fileElement).toBeInTheDocument();

    const fileName = await screen.findByTestId("file-name");
    expect(fileName).toHaveTextContent("hello.png");

    fireEvent.mouseEnter(fileElement);

    await waitFor(() => {
      // Find and click the delete button
      const deleteButton = screen.getByTestId("delete-hello.png");
      fireEvent.click(deleteButton);
    });

    // Check that the file was removed
    expect(
      screen.queryByTestId("file-element-hello.png"),
    ).not.toBeInTheDocument();
  });

  it("The button submit should be visible when a file is uploaded", async () => {
    render(<HomePage />);

    // Mock file
    const file = new File(["hello"], "hello.png", { type: "image/png" });

    // Find the file input element and upload the file
    const input = screen.getByTestId("browse-file-button");
    userEvent.upload(input, file);

    // Check that the file was uploaded and appears in the list.
    const fileElement = await screen.findByTestId("file-element-hello.png");
    expect(fileElement).toBeInTheDocument();

    const fileName = await screen.findByTestId("file-name");
    expect(fileName).toHaveTextContent("hello.png");

    // Check that the submit button is visible
    expect(screen.getByTestId("submit-button")).toBeInTheDocument();
  });

  it("The file count should be displayed when a file is uploaded", async () => {
    render(<HomePage />);

    // Mock file
    const file = new File(["hello"], "hello.png", { type: "image/png" });

    // Find the file input element and upload the file
    const input = screen.getByTestId("browse-file-button");
    userEvent.upload(input, file);

    // Check that the file was uploaded and appears in the list.
    const fileElement = await screen.findByTestId("file-element-hello.png");
    expect(fileElement).toBeInTheDocument();

    const fileName = await screen.findByTestId("file-name");
    expect(fileName).toHaveTextContent("hello.png");

    // Check that the file count is displayed
    expect(
      screen.getByText(t("fileList.uploadedfiles") + " (1)"),
    ).toBeInTheDocument();
  });

  it("The file count should be updated when multiple files are uploaded", async () => {
    render(<HomePage />);

    // Mock file
    const file = new File(["hello"], "hello.png", { type: "image/png" });
    const file2 = new File(["hello2"], "hello2.png", { type: "image/png" });

    // Find the file input element and upload the file
    const input = screen.getByTestId("browse-file-button");
    userEvent.upload(input, [file, file2]);

    // Check that the file was uploaded and appears in the list.
    const fileElement = await screen.findByTestId("file-element-hello.png");
    expect(fileElement).toBeInTheDocument();

    // Check that the file was uploaded and appears in the list.
    const fileElement2 = await screen.findByTestId("file-element-hello2.png");
    expect(fileElement2).toBeInTheDocument();

    // Check that the file count is displayed
    expect(
      screen.getByText(t("fileList.uploadedfiles") + " (2)"),
    ).toBeInTheDocument();
  });

  it("displays 'No files uploaded' when there are no files", () => {
    render(<HomePage />);

    expect(screen.getByText(t("fileList.noUploadedfiles"))).toBeInTheDocument();
  });

  it("The button submit should be deactivated when no file is uploaded", () => {
    render(<HomePage />);

    // Check that the submit button is disabled
    const submitButton = screen.getByTestId("submit-button");
    expect(submitButton).toBeDisabled();
  });

  it("The toolTip should showUp only when the button is disabled", () => {
    render(<HomePage />);

    // Check that the submit button is disabled
    const submitButton = screen.getByTestId("submit-button");
    expect(submitButton).toBeDisabled();

    // Check that the tooltip is visible
    const tooltip = screen.getByTestId("hint-submit-button-disabled");
    expect(tooltip).toBeInTheDocument();
  });

  it("navigates to label data validation page when the submit button is clicked", async () => {
    render(<HomePage />);

    const file = new File(["hello"], "hello.png", { type: "image/png" });

    const input = screen.getByTestId("browse-file-button");
    userEvent.upload(input, file);

    const fileElement = await screen.findByTestId("file-element-hello.png");
    expect(fileElement).toBeInTheDocument();

    const submitButton = screen.getByTestId("submit-button");
    fireEvent.click(submitButton);

    expect(mockedRouterPush).toHaveBeenCalledWith("/label-data-validation");
  });

  it("should clear uploaded files and reset label data on mount", () => {
    useUploadedFilesStore.getState().addUploadedFile(
      new FileUploaded(
        { username: "testUser" },
        "/uploads/test1.png",
        new File(["dummy content"], "test1.png", {
          type: "image/png",
        }),
      ),
    );
    useLabelDataStore.getState().setLabelData(VERIFIED_LABEL_DATA);
    expect(useUploadedFilesStore.getState().uploadedFiles.length).toBe(1);
    expect(useLabelDataStore.getState().labelData).not.toBeNull();
    render(<HomePage />);
    expect(useUploadedFilesStore.getState().uploadedFiles.length).toBe(0);
    expect(useLabelDataStore.getState().labelData).toBe(null);
  });
});
