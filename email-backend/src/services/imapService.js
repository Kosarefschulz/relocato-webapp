const Imap = require('imap');
const { simpleParser } = require('mailparser');
const emailConfig = require('../config/emailConfig');
const { v4: uuidv4 } = require('uuid');

class ImapService {
  constructor() {
    this.imap = null;
    this.connected = false;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.imap = new Imap(emailConfig.imap);

      this.imap.once('ready', () => {
        this.connected = true;
        resolve();
      });

      this.imap.once('error', (err) => {
        this.connected = false;
        reject(err);
      });

      this.imap.once('end', () => {
        this.connected = false;
      });

      this.imap.connect();
    });
  }

  disconnect() {
    if (this.imap && this.connected) {
      this.imap.end();
      this.connected = false;
    }
  }

  async getFolders() {
    if (!this.connected) await this.connect();

    return new Promise((resolve, reject) => {
      this.imap.getBoxes((err, boxes) => {
        if (err) return reject(err);
        
        const folders = this.parseFolders(boxes);
        resolve(folders);
      });
    });
  }

  parseFolders(boxes, parent = '', level = 0) {
    const folders = [];
    
    for (const [name, box] of Object.entries(boxes)) {
      const fullPath = parent ? `${parent}${box.delimiter}${name}` : name;
      
      folders.push({
        name,
        path: fullPath,
        delimiter: box.delimiter,
        flags: box.attribs,
        level,
        hasChildren: box.children && Object.keys(box.children).length > 0,
        specialUse: this.getSpecialUse(box.attribs, name)
      });

      if (box.children) {
        folders.push(...this.parseFolders(box.children, fullPath, level + 1));
      }
    }

    return folders;
  }

  getSpecialUse(attribs, name) {
    const lowerName = name.toLowerCase();
    
    if (attribs.includes('\\Sent') || lowerName.includes('sent')) return 'sent';
    if (attribs.includes('\\Drafts') || lowerName.includes('draft')) return 'drafts';
    if (attribs.includes('\\Trash') || lowerName.includes('trash') || lowerName.includes('deleted')) return 'trash';
    if (attribs.includes('\\Junk') || lowerName.includes('spam') || lowerName.includes('junk')) return 'spam';
    if (attribs.includes('\\Inbox') || lowerName === 'inbox') return 'inbox';
    
    return null;
  }

  async getEmails(folder = 'INBOX', options = {}) {
    if (!this.connected) await this.connect();

    const {
      page = 1,
      limit = 50,
      search = null,
      sortBy = 'date',
      sortOrder = 'desc'
    } = options;

    return new Promise((resolve, reject) => {
      this.imap.openBox(folder, false, (err, box) => {
        if (err) return reject(err);

        // Build search criteria
        let searchCriteria = ['ALL'];
        if (search) {
          searchCriteria = [
            ['OR',
              ['SUBJECT', search],
              ['FROM', search],
              ['TEXT', search]
            ]
          ];
        }

        this.imap.search(searchCriteria, (err, results) => {
          if (err) return reject(err);
          if (!results || results.length === 0) {
            return resolve({ emails: [], total: 0, page, limit });
          }

          // Sort results
          if (sortOrder === 'desc') {
            results.reverse();
          }

          // Pagination
          const start = (page - 1) * limit;
          const end = start + limit;
          const paginatedResults = results.slice(start, end);

          if (paginatedResults.length === 0) {
            return resolve({ emails: [], total: results.length, page, limit });
          }

          const emails = [];
          const fetch = this.imap.fetch(paginatedResults, {
            bodies: '',
            envelope: true,
            struct: true
          });

          fetch.on('message', (msg, seqno) => {
            const email = {
              id: uuidv4(),
              uid: null,
              seqno,
              flags: [],
              envelope: null,
              struct: null
            };

            msg.on('body', (stream, info) => {
              let buffer = '';
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
              });
              stream.once('end', () => {
                simpleParser(buffer).then((parsed) => {
                  email.parsed = {
                    from: parsed.from,
                    to: parsed.to,
                    cc: parsed.cc,
                    bcc: parsed.bcc,
                    subject: parsed.subject,
                    date: parsed.date,
                    messageId: parsed.messageId,
                    inReplyTo: parsed.inReplyTo,
                    references: parsed.references,
                    text: parsed.text,
                    html: parsed.html,
                    textAsHtml: parsed.textAsHtml,
                    attachments: parsed.attachments?.map(att => ({
                      filename: att.filename,
                      contentType: att.contentType,
                      size: att.size,
                      contentId: att.contentId,
                      cid: att.cid,
                      related: att.related
                    }))
                  };
                }).catch(err => {
                  console.error('Error parsing email:', err);
                });
              });
            });

            msg.once('attributes', (attrs) => {
              email.flags = attrs.flags;
              email.uid = attrs.uid;
              email.date = attrs.date;
            });

            msg.once('end', () => {
              emails.push(email);
            });
          });

          fetch.once('error', (err) => {
            reject(err);
          });

          fetch.once('end', () => {
            resolve({
              emails: emails.sort((a, b) => {
                if (sortBy === 'date') {
                  return sortOrder === 'desc' 
                    ? new Date(b.date) - new Date(a.date)
                    : new Date(a.date) - new Date(b.date);
                }
                return 0;
              }),
              total: results.length,
              page,
              limit
            });
          });
        });
      });
    });
  }

  async getEmail(folder, uid) {
    if (!this.connected) await this.connect();

    return new Promise((resolve, reject) => {
      this.imap.openBox(folder, false, (err, box) => {
        if (err) return reject(err);

        const fetch = this.imap.fetch(uid, {
          bodies: '',
          envelope: true,
          struct: true
        });

        let email = null;

        fetch.on('message', (msg, seqno) => {
          email = {
            uid,
            seqno,
            flags: [],
            envelope: null,
            struct: null
          };

          msg.on('body', (stream, info) => {
            let buffer = '';
            stream.on('data', (chunk) => {
              buffer += chunk.toString('utf8');
            });
            stream.once('end', () => {
              simpleParser(buffer).then((parsed) => {
                email.parsed = parsed;
              }).catch(err => {
                console.error('Error parsing email:', err);
              });
            });
          });

          msg.once('attributes', (attrs) => {
            email.flags = attrs.flags;
            email.date = attrs.date;
          });
        });

        fetch.once('error', (err) => {
          reject(err);
        });

        fetch.once('end', () => {
          resolve(email);
        });
      });
    });
  }

  async markAsRead(folder, uid) {
    if (!this.connected) await this.connect();

    return new Promise((resolve, reject) => {
      this.imap.openBox(folder, false, (err, box) => {
        if (err) return reject(err);

        this.imap.addFlags(uid, ['\\Seen'], (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });
  }

  async markAsUnread(folder, uid) {
    if (!this.connected) await this.connect();

    return new Promise((resolve, reject) => {
      this.imap.openBox(folder, false, (err, box) => {
        if (err) return reject(err);

        this.imap.delFlags(uid, ['\\Seen'], (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });
  }

  async flagEmail(folder, uid, flag) {
    if (!this.connected) await this.connect();

    return new Promise((resolve, reject) => {
      this.imap.openBox(folder, false, (err, box) => {
        if (err) return reject(err);

        this.imap.addFlags(uid, [flag], (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });
  }

  async unflagEmail(folder, uid, flag) {
    if (!this.connected) await this.connect();

    return new Promise((resolve, reject) => {
      this.imap.openBox(folder, false, (err, box) => {
        if (err) return reject(err);

        this.imap.delFlags(uid, [flag], (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });
  }

  async moveEmail(sourceFolder, targetFolder, uid) {
    if (!this.connected) await this.connect();

    return new Promise((resolve, reject) => {
      this.imap.openBox(sourceFolder, false, (err, box) => {
        if (err) return reject(err);

        this.imap.move(uid, targetFolder, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });
  }

  async deleteEmail(folder, uid) {
    if (!this.connected) await this.connect();

    return new Promise((resolve, reject) => {
      this.imap.openBox(folder, false, (err, box) => {
        if (err) return reject(err);

        this.imap.addFlags(uid, ['\\Deleted'], (err) => {
          if (err) return reject(err);

          this.imap.expunge((err) => {
            if (err) return reject(err);
            resolve();
          });
        });
      });
    });
  }

  async searchEmails(folder, criteria) {
    if (!this.connected) await this.connect();

    return new Promise((resolve, reject) => {
      this.imap.openBox(folder, false, (err, box) => {
        if (err) return reject(err);

        this.imap.search(criteria, (err, results) => {
          if (err) return reject(err);
          resolve(results);
        });
      });
    });
  }
}

module.exports = ImapService;