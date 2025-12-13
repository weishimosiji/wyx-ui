// types.ts - Type Definitions
export interface CopyConfig {
  // Success callback
  onSuccess?: (text: string) => void;
  // Error callback
  onError?: (error: Error) => void;
  // Timeout (ms)
  timeout?: number;
}

export interface CopyResult {
  success: boolean;
  text: string;
  error?: Error;
  method?: 'clipboard-api' | 'exec-command' | 'fallback';
}

// clipboard.ts - Core Copy Functionality
export class ClipboardManager {
  private static instance: ClipboardManager;
  
  private constructor() {}
  
  public static getInstance(): ClipboardManager {
    if (!ClipboardManager.instance) {
      ClipboardManager.instance = new ClipboardManager();
    }
    return ClipboardManager.instance;
  }

  /**
   * Copy text to clipboard
   * @param text Text to copy
   * @param config Configuration options
   */
  public async copyText(
    text: string, 
    config: CopyConfig = {}
  ): Promise<CopyResult> {
    const {
      onSuccess,
      onError
    } = config;

    const result: CopyResult = {
      success: false,
      text,
      method: undefined
    };

    try {
      // Input validation
      if (!text || typeof text !== 'string') {
        throw new Error('Copy content must be a non-empty string');
      }

      // Clean text
      const cleanText = this.sanitizeText(text);

      // Method 1: Use modern Clipboard API
      if (await this.tryClipboardAPI(cleanText)) {
        result.success = true;
        result.method = 'clipboard-api';
        this.handleSuccess(cleanText, onSuccess);
        return result;
      }

      // Method 2: Use document.execCommand (Deprecated but good compatibility)
      if (await this.tryExecCommand(cleanText)) {
        result.success = true;
        result.method = 'exec-command';
        this.handleSuccess(cleanText, onSuccess);
        return result;
      }

      // Method 3: Fallback
      if (await this.tryFallbackMethod(cleanText)) {
        result.success = true;
        result.method = 'fallback';
        this.handleSuccess(cleanText, onSuccess);
        return result;
      }

      throw new Error('All copy methods failed');

    } catch (error) {
      const copyError = error instanceof Error ? error : new Error(String(error));
      result.error = copyError;
      this.handleError(copyError, onError);
      return result;
    }
  }

  /**
   * Attempt to use Clipboard API
   */
  private async tryClipboardAPI(text: string): Promise<boolean> {
    try {
      // Check browser support
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        return false;
      }

      // Check permissions
      if (navigator.permissions) {
        try {
          const result = await navigator.permissions.query({ name: 'clipboard-write' as PermissionName });
          if (result.state === 'denied') {
            return false;
          }
        } catch {
          // Permission query failed, continue trying
        }
      }

      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Try using execCommand (compatible with old browsers)
   */
  private async tryExecCommand(text: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        // Create temporary text area
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.cssText = `
          position: fixed;
          left: -9999px;
          opacity: 0;
          pointer-events: none;
        `;

        document.body.appendChild(textArea);
        textArea.select();
        textArea.setSelectionRange(0, 99999); // Mobile device support

        // Execute copy command
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        resolve(successful);
      } catch {
        resolve(false);
      }
    });
  }

  /**
   * Fallback copy method
   */
  private async tryFallbackMethod(text: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        // Create editable div
        const editableDiv = document.createElement('div');
        editableDiv.contentEditable = 'true';
        editableDiv.style.cssText = `
          position: fixed;
          left: -9999px;
          opacity: 0;
          pointer-events: none;
        `;
        
        // Insert text
        const textNode = document.createTextNode(text);
        editableDiv.appendChild(textNode);
        document.body.appendChild(editableDiv);

        // Select text
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(editableDiv);
        
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }

        // Attempt copy
        const successful = document.execCommand('copy');
        
        // Cleanup
        if (selection) {
          selection.removeAllRanges();
        }
        document.body.removeChild(editableDiv);
        
        resolve(successful);
      } catch {
        resolve(false);
      }
    });
  }

  /**
   * Sanitize text
   */
  private sanitizeText(text: string): string {
    return text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\s+/g, ' ')   // Merge continuous spaces
      .trim();                // Trim leading/trailing spaces
  }

  /**
   * Handle success callback
   */
  private handleSuccess(
    text: string, 
    onSuccess?: (text: string) => void
  ): void {
    if (onSuccess) {
      onSuccess(text);
    }
  }

  /**
   * Handle error callback
   */
  private handleError(error: Error, onError?: (error: Error) => void): void {
    console.error('Copy failed:', error);
    
    if (onError) {
      onError(error);
    }
  }

  /**
   * Check if browser supports copy function
   */
  public async isSupported(): Promise<boolean> {
    return !!(navigator.clipboard && navigator.clipboard.writeText) || 
           !!document.execCommand;
  }

  /**
   * Read clipboard content
   */
  public async readText(): Promise<string> {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        return await navigator.clipboard.readText();
      }
      throw new Error('Browser does not support reading clipboard');
    } catch (error) {
      throw new Error(`Failed to read clipboard: ${error}`);
    }
  }
}
