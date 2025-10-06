/**
 * Code Validation Service
 * Führt Basic Validation aus bevor Code geschrieben wird
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class CodeValidationService {
  /**
   * Validiert TypeScript/JavaScript Code
   */
  validateTypeScript(code: string, filePath: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic Syntax Checks
    try {
      // Check for balanced braces
      const openBraces = (code.match(/{/g) || []).length;
      const closeBraces = (code.match(/}/g) || []).length;
      if (openBraces !== closeBraces) {
        errors.push(`Unbalanced braces: ${openBraces} open, ${closeBraces} close`);
      }

      // Check for balanced parentheses
      const openParens = (code.match(/\(/g) || []).length;
      const closeParens = (code.match(/\)/g) || []).length;
      if (openParens !== closeParens) {
        errors.push(`Unbalanced parentheses: ${openParens} open, ${closeParens} close`);
      }

      // Check for balanced brackets
      const openBrackets = (code.match(/\[/g) || []).length;
      const closeBrackets = (code.match(/]/g) || []).length;
      if (openBrackets !== closeBrackets) {
        errors.push(`Unbalanced brackets: ${openBrackets} open, ${closeBrackets} close`);
      }

      // Check for common syntax errors
      if (code.includes('import {') && !code.includes('from')) {
        warnings.push('Import statement might be incomplete');
      }

      // Check for React component patterns
      if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
        if (!code.includes('import React')) {
          warnings.push('React import missing in component file');
        }

        if (code.includes('export const') && code.includes(': React.FC') && !code.includes('return')) {
          errors.push('React component missing return statement');
        }
      }

      // Check for export statements
      if (code.includes('export') && !code.includes('export default') && !code.includes('export const') && !code.includes('export class')) {
        warnings.push('Unusual export pattern detected');
      }

      // Check for async/await consistency
      if (code.includes('await') && !code.includes('async')) {
        errors.push('await used without async function');
      }

    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validiert File Path
   */
  validatePath(path: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for forbidden patterns
    const forbidden = ['../', 'node_modules', '.env', 'credentials', 'password', 'secret'];
    forbidden.forEach(pattern => {
      if (path.toLowerCase().includes(pattern)) {
        errors.push(`Path contains forbidden pattern: ${pattern}`);
      }
    });

    // Check for valid file extensions
    const validExtensions = ['.ts', '.tsx', '.js', '.jsx', '.css', '.scss', '.json', '.md'];
    const hasValidExt = validExtensions.some(ext => path.endsWith(ext));

    if (!hasValidExt) {
      warnings.push(`Unusual file extension: ${path.split('.').pop()}`);
    }

    // Check path structure
    if (!path.startsWith('src/') && !path.startsWith('public/') && !path.startsWith('supabase/')) {
      warnings.push('Path outside standard directories');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: warnings || []
    };
  }

  /**
   * Validiert Command
   */
  validateCommand(command: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const dangerous = ['rm -rf', 'sudo', 'chmod 777', 'dd if=', 'format', ':(){:|:&};:'];
    dangerous.forEach(pattern => {
      if (command.includes(pattern)) {
        errors.push(`Dangerous command pattern detected: ${pattern}`);
      }
    });

    const allowed = ['npm', 'git', 'ls', 'cat', 'grep', 'find', 'mkdir', 'touch', 'pwd', 'echo'];
    const cmdStart = command.trim().split(' ')[0];

    if (!allowed.includes(cmdStart)) {
      warnings.push(`Command '${cmdStart}' not in whitelist`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validiert Component Name
   */
  validateComponentName(name: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Should start with capital letter
    if (!/^[A-Z]/.test(name)) {
      errors.push('Component name must start with capital letter');
    }

    // Should be valid identifier
    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(name)) {
      errors.push('Component name contains invalid characters');
    }

    // Should not be too long
    if (name.length > 50) {
      warnings.push('Component name is very long');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export const codeValidationService = new CodeValidationService();
