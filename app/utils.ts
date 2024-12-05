// utils.ts

export const chooseFolder = async (): Promise<FileSystemDirectoryHandle> => {
    try {
      const dirHandle = await window.showDirectoryPicker();
      return dirHandle;
    } catch (error) {
      console.error('Error:', error);
      alert('Folder selection was canceled.');
      return Promise.reject(error);
    }
  };
  
  export const parseGitignore = (content: string): string[] => {
    return content.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
  };
  
  export const drawFolderTree = async (
    directoryHandle: FileSystemDirectoryHandle, 
    prefix = '', 
    depth = 0, 
    ignoreFolders: string[] = [], 
    showFiles = false
  ): Promise<string> => {
    let tree = '';
    for await (const [name, handle] of directoryHandle.entries()) {
      // Skip ignored folders based on .gitignore
      if (ignoreFolders.some(pattern => name.match(pattern))) continue;
  
      // Handle folder
      if (handle.kind === 'directory') {
        const folderContent = `${prefix}├── ${name}`;
        tree += `${folderContent}\n`;
  
        // Always expand all folders
        tree += await drawFolderTree(handle, `${prefix}│   `, depth + 1, ignoreFolders, showFiles);
      } else if (handle.kind === 'file' && showFiles) {
        tree += `${prefix}├── ${name}\n`;
      }
    }
    return tree;
  };
  