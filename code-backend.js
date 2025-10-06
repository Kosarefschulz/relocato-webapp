const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const app = express();

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, X-Requested-With, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json({ limit: '50mb' }));

// ============================================
// SECURITY CONFIGURATION
// ============================================

const PROJECT_ROOT = path.resolve(__dirname);
const ALLOWED_PATHS = [
  path.join(PROJECT_ROOT, 'src'),
  path.join(PROJECT_ROOT, 'public'),
  path.join(PROJECT_ROOT, 'supabase')
];

const FORBIDDEN_PATTERNS = [
  'node_modules',
  '.env',
  'credentials',
  'package-lock.json',
  '.git/config',
  'password',
  'secret',
  'api_key',
  'token'
];

const ALLOWED_COMMANDS = [
  'npm', 'git', 'ls', 'cat', 'grep', 'find',
  'mkdir', 'touch', 'pwd', 'echo', 'node'
];

const DANGEROUS_COMMANDS = ['rm', 'rmdir', 'del', 'format', 'sudo', 'chmod', 'chown'];

// Rate Limiting (einfache In-Memory Variante)
const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 Minute
const MAX_REQUESTS_PER_WINDOW = 100;

function checkRateLimit(ip) {
  const now = Date.now();
  const userLimits = rateLimits.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };

  if (now > userLimits.resetTime) {
    userLimits.count = 1;
    userLimits.resetTime = now + RATE_LIMIT_WINDOW;
  } else {
    userLimits.count++;
  }

  rateLimits.set(ip, userLimits);

  return userLimits.count <= MAX_REQUESTS_PER_WINDOW;
}

// ============================================
// SECURITY MIDDLEWARE
// ============================================

function validatePath(filePath) {
  const resolved = path.resolve(PROJECT_ROOT, filePath);

  // Check if path is within allowed directories
  const isAllowed = ALLOWED_PATHS.some(allowed =>
    resolved.startsWith(allowed)
  );

  if (!isAllowed) {
    throw new Error(`Access denied: Path outside allowed directories`);
  }

  // Check for forbidden patterns
  const hasForbiddenPattern = FORBIDDEN_PATTERNS.some(pattern =>
    resolved.toLowerCase().includes(pattern.toLowerCase())
  );

  if (hasForbiddenPattern) {
    throw new Error(`Access denied: Path contains forbidden pattern`);
  }

  return resolved;
}

function validateCommand(command) {
  const cmd = command.trim().split(' ')[0];

  // Check for dangerous commands
  if (DANGEROUS_COMMANDS.some(danger => command.toLowerCase().includes(danger))) {
    throw new Error(`Dangerous command blocked: ${cmd}`);
  }

  // Check if command is allowed
  if (!ALLOWED_COMMANDS.includes(cmd)) {
    throw new Error(`Command not allowed: ${cmd}`);
  }

  return true;
}

function logOperation(operation, details) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${operation}:`, JSON.stringify(details));
}

// Rate limiting middleware
app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;

  if (!checkRateLimit(ip)) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded. Please try again later.'
    });
  }

  next();
});

// ============================================
// FILE OPERATIONS ENDPOINTS
// ============================================

// Health Check
app.get('/api/code/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'code-operations',
    projectRoot: PROJECT_ROOT,
    allowedPaths: ALLOWED_PATHS.length
  });
});

// Read File
app.post('/api/code/read', async (req, res) => {
  try {
    const { path: filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({ success: false, error: 'Path required' });
    }

    const resolved = validatePath(filePath);

    // Check if file exists
    try {
      await fs.access(resolved);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: `File not found: ${filePath}`
      });
    }

    const content = await fs.readFile(resolved, 'utf-8');

    logOperation('READ_FILE', { path: filePath, size: content.length });

    res.json({
      success: true,
      content,
      path: filePath,
      size: content.length
    });

  } catch (error) {
    console.error('Read file error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Write File
app.post('/api/code/write', async (req, res) => {
  try {
    const { path: filePath, content } = req.body;

    if (!filePath || content === undefined) {
      return res.status(400).json({ success: false, error: 'Path and content required' });
    }

    const resolved = validatePath(filePath);

    // Create directory if it doesn't exist
    await fs.mkdir(path.dirname(resolved), { recursive: true });

    // Write file
    await fs.writeFile(resolved, content, 'utf-8');

    logOperation('WRITE_FILE', { path: filePath, size: content.length });

    res.json({
      success: true,
      path: filePath,
      size: content.length
    });

  } catch (error) {
    console.error('Write file error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Edit File (Find and Replace)
app.post('/api/code/edit', async (req, res) => {
  try {
    const { path: filePath, oldString, newString } = req.body;

    if (!filePath || !oldString || newString === undefined) {
      return res.status(400).json({ success: false, error: 'Path, oldString and newString required' });
    }

    const resolved = validatePath(filePath);

    // Read current content
    let content = await fs.readFile(resolved, 'utf-8');

    // Check if old string exists
    if (!content.includes(oldString)) {
      return res.status(404).json({
        success: false,
        error: 'Old string not found in file'
      });
    }

    // Replace
    const newContent = content.replace(oldString, newString);

    // Write back
    await fs.writeFile(resolved, newContent, 'utf-8');

    logOperation('EDIT_FILE', {
      path: filePath,
      replacements: content.split(oldString).length - 1
    });

    res.json({
      success: true,
      path: filePath,
      replacements: content.split(oldString).length - 1
    });

  } catch (error) {
    console.error('Edit file error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// List Directory
app.post('/api/code/list', async (req, res) => {
  try {
    const { path: dirPath } = req.body;

    if (!dirPath) {
      return res.status(400).json({ success: false, error: 'Path required' });
    }

    const resolved = validatePath(dirPath);
    const entries = await fs.readdir(resolved, { withFileTypes: true });

    const files = entries.map(entry => ({
      name: entry.name,
      isDirectory: entry.isDirectory(),
      isFile: entry.isFile()
    }));

    logOperation('LIST_DIR', { path: dirPath, count: files.length });

    res.json({
      success: true,
      path: dirPath,
      files
    });

  } catch (error) {
    console.error('List directory error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create File or Directory
app.post('/api/code/create', async (req, res) => {
  try {
    const { path: filePath, type, content } = req.body;

    if (!filePath || !type) {
      return res.status(400).json({ success: false, error: 'Path and type required' });
    }

    const resolved = validatePath(filePath);

    if (type === 'directory') {
      await fs.mkdir(resolved, { recursive: true });
      logOperation('CREATE_DIR', { path: filePath });
    } else {
      // Create parent directory if needed
      await fs.mkdir(path.dirname(resolved), { recursive: true });
      await fs.writeFile(resolved, content || '', 'utf-8');
      logOperation('CREATE_FILE', { path: filePath });
    }

    res.json({
      success: true,
      path: filePath,
      type
    });

  } catch (error) {
    console.error('Create error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search (Simple Grep)
app.post('/api/code/search', async (req, res) => {
  try {
    const { pattern, path: searchPath } = req.body;

    if (!pattern) {
      return res.status(400).json({ success: false, error: 'Pattern required' });
    }

    const basePath = searchPath ? validatePath(searchPath) : path.join(PROJECT_ROOT, 'src');

    // Use grep command for search
    const command = `grep -r "${pattern}" "${basePath}"`;
    const { stdout } = await execAsync(command, {
      maxBuffer: 1024 * 1024 * 10 // 10MB
    });

    const results = stdout.split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [file, ...contentParts] = line.split(':');
        return {
          file: file.replace(basePath, ''),
          content: contentParts.join(':').trim()
        };
      });

    logOperation('SEARCH', { pattern, count: results.length });

    res.json({
      success: true,
      pattern,
      results
    });

  } catch (error) {
    // Grep returns error code 1 if no matches found
    if (error.code === 1) {
      return res.json({
        success: true,
        pattern: req.body.pattern,
        results: []
      });
    }

    console.error('Search error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Execute Command
app.post('/api/code/execute', async (req, res) => {
  try {
    const { command } = req.body;

    if (!command) {
      return res.status(400).json({ success: false, error: 'Command required' });
    }

    // Validate command
    validateCommand(command);

    // Execute in project root
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: PROJECT_ROOT,
        maxBuffer: 1024 * 1024 * 10, // 10MB
        timeout: 30000, // 30 seconds
        shell: '/bin/bash' // Explizite Shell für bessere Kompatibilität
      });

      logOperation('EXECUTE', { command, success: true });

      res.json({
        success: true,
        stdout: stdout || '',
        stderr: stderr || '',
        command
      });
    } catch (execError) {
      // Command executed but returned non-zero exit code
      // This is not necessarily an error (e.g., grep with no matches)
      logOperation('EXECUTE', {
        command,
        exitCode: execError.code,
        stderr: execError.stderr
      });

      res.json({
        success: true, // Changed from error to success
        stdout: execError.stdout || '',
        stderr: execError.stderr || '',
        exitCode: execError.code,
        command
      });
    }

  } catch (error) {
    logOperation('EXECUTE', { command: req.body.command, error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
      stdout: '',
      stderr: ''
    });
  }
});

// Git Operations
app.post('/api/code/git', async (req, res) => {
  try {
    const { action, params } = req.body;

    if (!action) {
      return res.status(400).json({ success: false, error: 'Action required' });
    }

    let command;

    switch (action) {
      case 'status':
        command = 'git status --short';
        break;

      case 'add':
        command = `git add ${params.files || '.'}`;
        break;

      case 'commit':
        command = `git commit -m "${params.message || 'AI commit'}"`;
        break;

      case 'diff':
        command = `git diff ${params.file || ''}`;
        break;

      case 'log':
        command = `git log --oneline -${params.count || 10}`;
        break;

      default:
        return res.status(400).json({ success: false, error: 'Unknown git action' });
    }

    const { stdout, stderr } = await execAsync(command, {
      cwd: PROJECT_ROOT,
      maxBuffer: 1024 * 1024 * 10
    });

    logOperation('GIT', { action, success: true });

    res.json({
      success: true,
      action,
      output: stdout,
      stderr
    });

  } catch (error) {
    console.error('Git error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stdout: error.stdout || '',
      stderr: error.stderr || ''
    });
  }
});

// ============================================
// START SERVER
// ============================================

const port = process.env.CODE_BACKEND_PORT || 3002;
app.listen(port, () => {
  console.log(`🚀 Code Operations Backend running on port ${port}`);
  console.log(`📁 Project Root: ${PROJECT_ROOT}`);
  console.log(`✅ Allowed Paths: ${ALLOWED_PATHS.length}`);
  console.log(`🔒 Security: Sandbox enabled`);
});

module.exports = app;
