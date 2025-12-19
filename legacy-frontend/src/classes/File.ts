import { filetypeinfo } from "magic-bytes.js";

export enum FileType {
  PDF = "pdf",
  PNG = "png",
  JPG = "jpg",
}

/**
 * Represents a user.
 */
export interface User {
  username: string;
}

/**
 * Represents information about a file.
 */
export interface FileInfo {
  path: string;
  user: User;
  uploadDate: Date;
  type: FileType;
  name: string;
}

/**
 * Represents an uploaded file with metadata.
 */
class FileUploaded {
  private info: FileInfo;
  private file: File;

  /**
   * Creates an instance of FileUploaded.
   * @param user - The user who uploaded the file.
   * @param path - The path where the file is stored.
   * @param file - The actual file object.
   */
  constructor(user: User, path: string, file: File) {
    this.file = file;
    this.info = {
      path,
      user,
      uploadDate: new Date(),
      type: this.getFileType(file),
      name: file.name,
    };
  }

  /**
   * Gets the file information.
   * @returns The file information.
   */
  getInfo(): FileInfo {
    return this.info;
  }

  /**
   * Gets the file object.
   * @returns The file object.
   */
  getFile(): File {
    return this.file;
  }

  /**
   * Updates the path where the file is stored.
   * @param newPath - The new path.
   */
  updatePath(newPath: string) {
    this.info.path = newPath;
  }

  /**
   * Detects the file type based on its content type.
   * @param path - The path to the file.
   * @returns A promise resolving to the file type or an object with type and images if it's a PDF.
   */
  static async detectType(
    path: string,
  ): Promise<FileType | { type: FileType.PDF; images: FileUploaded[] }> {
    const response = await fetch(path);
    const contentType = response.headers.get("Content-Type") || "";

    const mimeMap: Record<string, FileType> = {
      "image/png": FileType.PNG,
      "image/jpeg": FileType.JPG,
      "application/pdf": FileType.PDF,
    };

    if (contentType in mimeMap) {
      if (mimeMap[contentType] === FileType.PDF) {
        return { type: FileType.PDF, images: [] };
      }
      return mimeMap[contentType];
    }

    throw new Error(`Unsupported file type: ${contentType}`);
  }

  /**
   * Determines the file type from the File object.
   * @param file - The file object.
   * @returns The determined FileType.
   */
  private getFileType(file: File): FileType {
    const mimeMap: Record<string, FileType> = {
      "image/png": FileType.PNG,
      "image/jpeg": FileType.JPG,
      "application/pdf": FileType.PDF,
    };

    if (file.type in mimeMap) {
      return mimeMap[file.type];
    }

    throw new Error(`Unsupported file type: ${file.type}`);
  }
}

export default FileUploaded;

export async function processFetchedBlob(
  blob: Blob,
  name: string,
): Promise<File> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const fileTypes = filetypeinfo(bytes);

  const { extension = "bin", mime = "application/octet-stream" } =
    fileTypes[0] || {};
  return new File([blob], `${name}.${extension}`, { type: mime });
}
