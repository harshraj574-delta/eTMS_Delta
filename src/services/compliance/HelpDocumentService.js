import axios from "axios";
import { api } from "../axios/api";

// Switch between upload strategies:
//  "presigned" – backend issues a short-lived S3 (or compatible) presigned PUT URL;
//                frontend uploads directly to storage, then confirms with the backend.
//  "direct"    – multipart/form-data POST to your own backend API.
const UPLOAD_MODE = "presigned"; // change to "direct" if you don't use S3

class HelpDocumentService {
  // ── document list ──────────────────────────────────────────────────────────

  async GetHelpDocumentList() {
    const response = await api.post("/GetHelpDocumentList");
    return response.data;
  }

  // ── presigned URL flow (S3 / GCS / Azure Blob / MinIO) ────────────────────
  //
  // Expected backend contract for /GetPresignedUploadUrl:
  //   Request:  { docId, fileName, contentType }
  //   Response: { uploadUrl: string, fileKey: string }
  //
  // Expected backend contract for /ConfirmHelpDocumentUpload:
  //   Request:  { docId, fileName, fileKey, fileSize, uploadedBy }
  //   Response: { success: boolean }

  async getPresignedUrl({ docId, fileName, contentType }) {
    const response = await api.post("/GetPresignedUploadUrl", {
      docId,
      fileName,
      contentType,
    });
    return response.data; // { uploadUrl, fileKey }
  }

  async _putToStorage(uploadUrl, file, onProgress) {
    return axios.put(uploadUrl, file, {
      headers: { "Content-Type": file.type || "application/octet-stream" },
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) {
          onProgress(Math.round((evt.loaded * 100) / evt.total));
        }
      },
    });
  }

  async confirmUpload({ docId, fileName, fileKey, fileSize, uploadedBy }) {
    const response = await api.post("/ConfirmHelpDocumentUpload", {
      docId,
      fileName,
      fileKey,
      fileSize,
      uploadedBy,
    });
    return response.data;
  }

  async uploadViaPresignedUrl(docId, file, onProgress, uploadedBy) {
    const { uploadUrl, fileKey } = await this.getPresignedUrl({
      docId,
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
    });
    await this._putToStorage(uploadUrl, file, onProgress);
    return this.confirmUpload({
      docId,
      fileName: file.name,
      fileKey,
      fileSize: file.size,
      uploadedBy: uploadedBy || 0,
    });
  }

  // ── direct upload flow (multipart/form-data to your backend) ──────────────
  //
  // Expected backend contract for /UploadHelpDocument:
  //   Request:  multipart/form-data – fields: file, docId, uploadedBy
  //   Response: { success: boolean, fileKey?: string }

  async uploadDirect(docId, file, onProgress, uploadedBy) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("docId", String(docId));
    formData.append("uploadedBy", String(uploadedBy || 0));
    const response = await api.post("/UploadHelpDocument", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) {
          onProgress(Math.round((evt.loaded * 100) / evt.total));
        }
      },
    });
    return response.data;
  }

  // ── unified entry point ────────────────────────────────────────────────────

  async upload(docId, file, onProgress, uploadedBy) {
    if (UPLOAD_MODE === "presigned") {
      return this.uploadViaPresignedUrl(docId, file, onProgress, uploadedBy);
    }
    return this.uploadDirect(docId, file, onProgress, uploadedBy);
  }

  // ── delete / remove ────────────────────────────────────────────────────────

  async RemoveDocument({ docId, fileKey, updatedBy }) {
    const response = await api.post("/RemoveHelpDocument", { docId, fileKey, updatedBy });
    return response.data;
  }
}

export default new HelpDocumentService();
