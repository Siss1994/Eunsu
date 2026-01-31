"use client";

import { useState, useRef, useCallback } from "react";

interface UploadedFile {
  name: string;
  preview: string;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
  file: File;
}

export default function UploadPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((fileList: FileList | File[]) => {
    const newFiles: UploadedFile[] = [];
    const arr = Array.from(fileList);

    arr.forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const preview = URL.createObjectURL(file);
      newFiles.push({
        name: file.name,
        preview,
        status: "pending",
        progress: 0,
        file,
      });
    });

    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const uploadFile = useCallback(
    async (uploadFile: UploadedFile, index: number) => {
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, status: "uploading" as const, progress: 0 } : f
        )
      );

      try {
        const formData = new FormData();
        formData.append("file", uploadFile.file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Upload failed");

        setFiles((prev) =>
          prev.map((f, i) =>
            i === index
              ? { ...f, status: "done" as const, progress: 100 }
              : f
          )
        );
        setUploadedCount((c) => c + 1);
      } catch {
        setFiles((prev) =>
          prev.map((f, i) =>
            i === index ? { ...f, status: "error" as const } : f
          )
        );
      }
    },
    []
  );

  const uploadAll = useCallback(async () => {
    const pending = files
      .map((f, i) => ({ file: f, index: i }))
      .filter((item) => item.file.status === "pending");

    for (const item of pending) {
      await uploadFile(item.file, item.index);
    }
  }, [files, uploadFile]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        addFiles(e.target.files);
      }
    },
    [addFiles]
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const doneCount = files.filter((f) => f.status === "done").length;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #FFF8F0 0%, #F5E6E0 100%)",
        padding: "2rem 1rem",
      }}
    >
      <div style={{ maxWidth: "500px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <a
            href="/"
            style={{
              display: "inline-block",
              marginBottom: "1.5rem",
              color: "var(--wedding-gold)",
              textDecoration: "none",
              fontSize: "0.85rem",
            }}
          >
            ← 메인으로 돌아가기
          </a>
          <h1
            style={{
              fontFamily: "'Noto Serif KR', serif",
              fontSize: "1.6rem",
              fontWeight: 700,
              color: "var(--wedding-deep)",
              marginBottom: "0.5rem",
            }}
          >
            추억 사진 업로드
          </h1>
          <p
            style={{
              color: "rgba(44, 24, 16, 0.5)",
              fontSize: "0.85rem",
              lineHeight: 1.6,
            }}
          >
            은수와의 소중한 추억을 공유해주세요
          </p>
        </div>

        {/* Upload zone */}
        <div
          className={`upload-zone ${dragOver ? "drag-over" : ""}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--wedding-gold)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginBottom: "1rem" }}
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p
            style={{
              fontFamily: "'Noto Serif KR', serif",
              fontSize: "1rem",
              color: "var(--wedding-deep)",
              marginBottom: "0.5rem",
            }}
          >
            사진을 선택하거나 여기에 끌어놓으세요
          </p>
          <p style={{ fontSize: "0.75rem", color: "rgba(44, 24, 16, 0.4)" }}>
            JPG, PNG, WEBP 지원
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleChange}
            style={{ display: "none" }}
          />
        </div>

        {/* File previews */}
        {files.length > 0 && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                margin: "1.5rem 0 1rem",
              }}
            >
              <span
                style={{
                  fontSize: "0.85rem",
                  color: "rgba(44, 24, 16, 0.6)",
                }}
              >
                {files.length}장 선택됨
                {doneCount > 0 && ` · ${doneCount}장 업로드 완료`}
              </span>
              {pendingCount > 0 && (
                <button
                  onClick={uploadAll}
                  style={{
                    padding: "0.5rem 1.5rem",
                    background: "var(--wedding-gold)",
                    color: "white",
                    border: "none",
                    borderRadius: "20px",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "'Noto Serif KR', serif",
                    transition: "all 0.3s ease",
                  }}
                >
                  전체 업로드
                </button>
              )}
            </div>

            <div className="upload-preview">
              {files.map((file, i) => (
                <div key={`${file.name}-${i}`} className="upload-preview-item">
                  <img src={file.preview} alt={file.name} />

                  {/* Status overlay */}
                  {file.status === "done" && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(0,0,0,0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#4ade80"
                        strokeWidth="2.5"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}

                  {file.status === "error" && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(0,0,0,0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#f87171"
                        strokeWidth="2.5"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </div>
                  )}

                  {file.status === "uploading" && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(0,0,0,0.4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div className="upload-spinner" />
                    </div>
                  )}

                  {/* Remove button */}
                  {file.status === "pending" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(i);
                      }}
                      style={{
                        position: "absolute",
                        top: "4px",
                        right: "4px",
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        background: "rgba(0,0,0,0.5)",
                        color: "white",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "14px",
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  )}

                  {/* Progress bar */}
                  {file.status === "uploading" && (
                    <div className="upload-progress">
                      <div
                        className="upload-progress-bar"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Success message */}
        {uploadedCount > 0 && pendingCount === 0 && (
          <div
            style={{
              textAlign: "center",
              marginTop: "2rem",
              padding: "1.5rem",
              background: "rgba(255,255,255,0.6)",
              borderRadius: "16px",
              border: "1px solid rgba(212, 165, 116, 0.2)",
            }}
          >
            <p
              style={{
                fontFamily: "'Noto Serif KR', serif",
                fontSize: "1rem",
                color: "var(--wedding-deep)",
                marginBottom: "1rem",
              }}
            >
              {uploadedCount}장의 사진이 업로드되었습니다!
            </p>
            <a
              href="/"
              style={{
                display: "inline-block",
                padding: "0.6rem 2rem",
                background: "var(--wedding-deep)",
                color: "white",
                borderRadius: "20px",
                textDecoration: "none",
                fontSize: "0.85rem",
                fontWeight: 700,
                fontFamily: "'Noto Serif KR', serif",
              }}
            >
              갤러리에서 보기
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
