"use client";

import React, { useState } from "react";
import styles from "./FolderTreeViewer.module.css";

// Default .gitignore content for Next.js projects
const nextJsGitignore = `
.git
# dependencies
node_modules
.pnp
.pnp.js

# Next.js build output
.next
out
build

# test
coverage
`;

function FolderTreeViewer() {
  const [directoryHandle, setDirectoryHandle] =
    useState<FileSystemDirectoryHandle | null>(null);
  const [showFiles, setShowFiles] = useState(false);
  const [ignoreFolders, setIgnoreFolders] = useState(nextJsGitignore);
  const [folderTree, setFolderTree] = useState("");
  const [isTreeVisible, setIsTreeVisible] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeDepth, setActiveDepth] = useState<'All' | number>("All");

  // Function to handle folder selection
  const handleChooseFolder = async () => {
    try {
      const dirHandle = await window.showDirectoryPicker();
      setDirectoryHandle(dirHandle);
      setSelectedFolder(dirHandle.name);
    } catch (error) {
      console.error("Error:", error);
      alert("Folder selection was canceled.");
    }
  };

  // Function to render the folder tree
  const handleRenderFolderTree = async (showFiles: boolean, depth: number) => {
    if (!directoryHandle) return;

    setIsLoading(true);

    const ignorePatterns = parseGitignore(ignoreFolders);
    const tree = await drawFolderTree(
      directoryHandle,
      "",
      0,
      ignorePatterns,
      showFiles,
      depth
    );

    setFolderTree(tree || "No folders found.");
    setIsLoading(false);
  };

  // Function to parse .gitignore content
  const parseGitignore = (content: string): string[] => {
    return content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"));
  };

  // Function to recursively draw the folder tree
  const drawFolderTree = async (
    directoryHandle: FileSystemDirectoryHandle,
    prefix = "",
    depth = 0,
    ignoreFolders: string[] = [],
    showFiles = false,
    maxDepth = Infinity
  ) => {
    if (depth >= maxDepth) {
      return `${prefix}├── <span class="ellipsis">...</span>\n`;
    }

    let tree = "";

    const folders: string[] = [];
    const files: string[] = [];

    for await (const [name, handle] of directoryHandle.entries()) {
      if (ignoreFolders.some((pattern) => name.match(pattern))) continue;

      if (handle.kind === "directory") {
        folders.push(name);
      } else if (handle.kind === "file" && showFiles) {
        files.push(name);
      }
    }

    folders.sort();
    files.sort();

    for (const name of [...folders, ...files]) {
      const isDirectory = folders.includes(name);

      if (isDirectory) {
        tree += `${prefix}├── <span class="${styles.folderName}">${name}</span>\n`;
        const subDirHandle = await directoryHandle.getDirectoryHandle(name, {
          create: false,
        });

        tree += await drawFolderTree(
          subDirHandle,
          `${prefix}│   `,
          depth + 1,
          ignoreFolders,
          showFiles,
          maxDepth
        );
      } else {
        tree += `${prefix}├── <span class="${styles.fileName}">${name}</span>\n`;
      }
    }

    return tree;
  };

  const handleDepthChange = (depth: number | 'All') => {
    setActiveDepth(depth);
    handleRenderFolderTree(showFiles, depth === "All" ? Infinity : depth);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.header}>Folder Tree Viewer</h1>

      <button onClick={handleChooseFolder} className={styles.chooseButton}>
        Choose Folder
      </button>

      {selectedFolder && (
        <h3 className={styles.selectedFolder}>Selected Folder: {selectedFolder}</h3>
      )}
      <p style={{marginTop: '1em', fontWeight: 'bold'}}>Ignore list</p>

      <textarea
        value={ignoreFolders}
        onChange={(e) => setIgnoreFolders(e.target.value)}
        placeholder="node_modules/\ndist/\n"
        className={styles.textarea}
      />

      <button
        onClick={() => {
          setIsTreeVisible(true);
          handleRenderFolderTree(showFiles, Infinity);
        }}
        className={styles.showButton}
      >
        Show Tree
      </button>

      {isTreeVisible && (
        <>
          <div className={styles.toggles}>
            <label>
              <input
                type="checkbox"
                checked={showFiles}
                onChange={(e) => {
                  setShowFiles(e.target.checked);
                  handleRenderFolderTree(e.target.checked, activeDepth === "All" ? Infinity : activeDepth);
                }}
              />
              Show Files
            </label>
          </div>

          <div className={styles.depthButtons}>
            {([1, 2, 3, 4, 5, "All"] as Array<number | 'All'>).map((depth) => (
              <button
                key={depth}
                onClick={() => handleDepthChange(depth === "All" ? Infinity : depth)}
                className={`${styles.depthButton} ${activeDepth === depth ? styles.active : ""}`}
              >
                {depth}
              </button>
            ))}
          </div>

          {isLoading && <p className={styles.loading}>Loading folder tree...</p>}

          <div
            className={styles.treeContainer}
            dangerouslySetInnerHTML={{ __html: folderTree || "No tree to show." }}
          />
        </>
      )}
    </div>
  );
}

export default FolderTreeViewer;
