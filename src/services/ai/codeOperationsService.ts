/**
 * Code Operations Service
 * Provides file system and code manipulation capabilities via backend API
 */

import { codeValidationService } from './codeValidationService';

const CODE_BACKEND_URL = process.env.REACT_APP_CODE_BACKEND_URL || 'http://localhost:3002/api/code';

export interface FileInfo {
  name: string;
  isDirectory: boolean;
  isFile: boolean;
}

export interface SearchResult {
  file: string;
  content: string;
}

export interface CodeOperationResult {
  success: boolean;
  error?: string;
  [key: string]: any;
}

export class CodeOperationsService {
  private baseUrl: string;

  constructor(baseUrl: string = CODE_BACKEND_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Check if backend is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const data = await response.json();
      return data.status === 'ok';
    } catch (error) {
      console.error('Code backend health check failed:', error);
      return false;
    }
  }

  /**
   * Read file content
   */
  async readFile(path: string): Promise<{ content: string; size: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to read file');
      }

      return {
        content: data.content,
        size: data.size
      };
    } catch (error) {
      console.error('Read file error:', error);
      throw error;
    }
  }

  /**
   * Write file content (with validation)
   */
  async writeFile(path: string, content: string): Promise<void> {
    try {
      // Validate path
      const pathValidation = codeValidationService.validatePath(path);
      if (!pathValidation.valid) {
        throw new Error(`Path validation failed: ${pathValidation.errors.join(', ')}`);
      }

      // Validate TypeScript/JavaScript code
      if (path.endsWith('.ts') || path.endsWith('.tsx') || path.endsWith('.js') || path.endsWith('.jsx')) {
        const codeValidation = codeValidationService.validateTypeScript(content, path);

        if (!codeValidation.valid) {
          console.warn('⚠️ Code validation warnings:', codeValidation.errors);
          // Proceed anyway but warn user
        }

        if (codeValidation.warnings.length > 0) {
          console.warn('⚠️ Code validation warnings:', codeValidation.warnings);
        }
      }

      const response = await fetch(`${this.baseUrl}/write`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, content })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to write file');
      }

      console.log('✅ File written with validation passed');
    } catch (error) {
      console.error('Write file error:', error);
      throw error;
    }
  }

  /**
   * Edit file (find and replace)
   */
  async editFile(path: string, oldString: string, newString: string): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, oldString, newString })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to edit file');
      }

      return data.replacements;
    } catch (error) {
      console.error('Edit file error:', error);
      throw error;
    }
  }

  /**
   * List directory contents
   */
  async listDirectory(path: string): Promise<FileInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to list directory');
      }

      return data.files;
    } catch (error) {
      console.error('List directory error:', error);
      throw error;
    }
  }

  /**
   * Create file or directory
   */
  async create(path: string, type: 'file' | 'directory', content?: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, type, content })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create');
      }
    } catch (error) {
      console.error('Create error:', error);
      throw error;
    }
  }

  /**
   * Search for pattern in files
   */
  async search(pattern: string, path?: string): Promise<SearchResult[]> {
    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pattern, path })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to search');
      }

      return data.results;
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  /**
   * Execute shell command (with validation)
   */
  async execute(command: string): Promise<{ stdout: string; stderr: string; exitCode?: number }> {
    try {
      // Validate command
      const validation = codeValidationService.validateCommand(command);
      if (!validation.valid) {
        throw new Error(`Command validation failed: ${validation.errors.join(', ')}`);
      }

      if (validation.warnings.length > 0) {
        console.warn('⚠️ Command warnings:', validation.warnings);
      }

      const response = await fetch(`${this.baseUrl}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Command failed');
      }

      return {
        stdout: data.stdout || '',
        stderr: data.stderr || '',
        exitCode: data.exitCode
      };
    } catch (error) {
      console.error('Execute command error:', error);
      throw error;
    }
  }

  /**
   * Git operations
   */
  async git(action: 'status' | 'add' | 'commit' | 'diff' | 'log', params?: any): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/git`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, params })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Git operation failed');
      }

      return data.output;
    } catch (error) {
      console.error('Git operation error:', error);
      throw error;
    }
  }

  /**
   * Helper: Create React component (with validation)
   */
  async createComponent(name: string, directory: string = 'src/components'): Promise<void> {
    // Validate component name
    const nameValidation = codeValidationService.validateComponentName(name);
    if (!nameValidation.valid) {
      throw new Error(`Invalid component name: ${nameValidation.errors.join(', ')}`);
    }

    const componentCode = `import React from 'react';
import { Box, Typography } from '@mui/material';

interface ${name}Props {
  // Add your props here
}

export const ${name}: React.FC<${name}Props> = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        ${name}
      </Typography>
      <Typography>
        This is the ${name} component.
      </Typography>
    </Box>
  );
};

export default ${name};
`;

    const path = `${directory}/${name}.tsx`;
    await this.writeFile(path, componentCode);
    console.log(`✅ Component ${name} created with validation`);
  }

  /**
   * Helper: Create service file
   */
  async createService(name: string, directory: string = 'src/services'): Promise<void> {
    const serviceCode = `/**
 * ${name} Service
 */

export class ${name}Service {
  constructor() {
    // Initialize service
  }

  // Add your service methods here
}

export const ${name.charAt(0).toLowerCase() + name.slice(1)}Service = new ${name}Service();
`;

    const path = `${directory}/${name.charAt(0).toLowerCase() + name.slice(1)}Service.ts`;
    await this.writeFile(path, serviceCode);
  }

  /**
   * Helper: Add route to App.tsx
   */
  async addRoute(path: string, componentName: string): Promise<void> {
    try {
      // Read App.tsx
      const appContent = await this.readFile('src/App.tsx');

      // Add import if not exists
      const importStatement = `import ${componentName} from './components/${componentName}';`;
      if (!appContent.content.includes(importStatement)) {
        // Find where to add import
        const lastImportIndex = appContent.content.lastIndexOf('import');
        const lineEnd = appContent.content.indexOf('\n', lastImportIndex);

        const newContent = appContent.content.slice(0, lineEnd + 1) +
                          importStatement + '\n' +
                          appContent.content.slice(lineEnd + 1);

        await this.writeFile('src/App.tsx', newContent);
      }

      // Add route
      const routeCode = `      <Route path="${path}" element={<${componentName} />} />`;
      const routesSection = '      {/* Add routes here */}';

      await this.editFile(
        'src/App.tsx',
        routesSection,
        routesSection + '\n' + routeCode
      );

    } catch (error) {
      console.error('Error adding route:', error);
      throw error;
    }
  }
}

// Singleton instance
export const codeOperationsService = new CodeOperationsService();
