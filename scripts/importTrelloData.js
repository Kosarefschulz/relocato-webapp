/**
 * Import Trello Data to Supabase
 * Holt alle Informationen aus Trello und speichert sie in Kundennotizen
 */

const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const supabaseUrl = 'https://kmxipuaqierjqaikuimi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtteGlwdWFxaWVyanFhaWt1aW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MjU2NDUsImV4cCI6MjA2NjAwMTY0NX0.2S3cAnBh4zDFFQNpJ-VN17YrSJXyclyFjywN2izuPaU';

const TRELLO_KEY = process.env.TRELLO_API_KEY || '3aee2e484cbdbfae536b5c40ee2eea3a';
const TRELLO_TOKEN = process.env.TRELLO_TOKEN || 'YOUR_TRELLO_TOKEN_HERE';

const supabase = createClient(supabaseUrl, supabaseKey);

// Boards zu analysieren
const BOARDS = [
  { id: '67f4dbe5999dd8f1c74462bf', name: 'Durchführung planen' },
  { id: '67f390baa147a3c910f8f9f6', name: 'Durchführung TEST' },
];

function fetchTrello(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function importTrelloData() {
  console.log('🔄 Starte Trello-Daten-Import...\n');

  try {
    // Lade alle Kunden
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .eq('is_deleted', false);

    if (customersError) throw customersError;

    console.log(`📊 ${customers.length} Kunden in Supabase\n`);

    let totalUpdated = 0;

    for (const board of BOARDS) {
      console.log(`\n📋 Analysiere Board: ${board.name}`);

      // Hole alle Karten mit vollem Detail
      const cards = await fetchTrello(
        `https://api.trello.com/1/boards/${board.id}/cards?` +
        `key=${TRELLO_KEY}&token=${TRELLO_TOKEN}&` +
        `fields=name,desc,labels,due,dateLastActivity&` +
        `attachments=true&checklists=all&actions=commentCard`
      );

      console.log(`   ${cards.length} Karten gefunden`);

      for (const card of cards) {
        // Finde zugehörigen Kunden
        const customer = customers.find(c => {
          const cName = c.name.toLowerCase();
          const cardName = card.name.toLowerCase();

          // Extrahiere Namen aus Karte (oft Format: "BT: Name" oder "UT: Name")
          const extractedName = cardName.split(':').pop().trim().split(' ')[0];

          return (
            cName.includes(extractedName) ||
            cardName.includes(cName.split(' ')[0].toLowerCase()) ||
            cName.includes(cardName)
          );
        });

        if (customer) {
          // Sammle alle Infos
          const trelloInfo = {
            source: 'Trello',
            board: board.name,
            cardName: card.name,
            description: card.desc || '',
            labels: card.labels?.map(l => l.name).filter(Boolean) || [],
            dueDate: card.due || null,
            lastActivity: card.dateLastActivity || null,
            checklists: card.checklists?.map(cl => ({
              name: cl.name,
              items: cl.checkItems?.map(item => ({
                name: item.name,
                checked: item.state === 'complete'
              })) || []
            })) || [],
            comments: card.actions?.filter(a => a.type === 'commentCard').map(a => ({
              date: a.date,
              text: a.data?.text || ''
            })) || [],
            attachments: card.attachments?.map(a => ({
              name: a.name,
              url: a.url
            })) || []
          };

          // Erstelle formatierte Notiz
          let noteText = `📌 Trello Import (${board.name})\n\n`;

          if (card.desc) {
            noteText += `📝 Beschreibung:\n${card.desc}\n\n`;
          }

          if (card.labels && card.labels.length > 0) {
            noteText += `🏷️ Labels: ${card.labels.map(l => l.name).join(', ')}\n\n`;
          }

          if (card.checklists && card.checklists.length > 0) {
            noteText += `✅ Checklisten:\n`;
            card.checklists.forEach(cl => {
              noteText += `  ${cl.name}:\n`;
              cl.checkItems?.forEach(item => {
                const check = item.state === 'complete' ? '✓' : '☐';
                noteText += `    ${check} ${item.name}\n`;
              });
            });
            noteText += '\n';
          }

          if (card.actions && card.actions.length > 0) {
            noteText += `💬 Kommentare:\n`;
            card.actions.forEach(action => {
              if (action.type === 'commentCard' && action.data?.text) {
                const date = new Date(action.date).toLocaleDateString('de-DE');
                noteText += `  [${date}] ${action.data.text}\n`;
              }
            });
          }

          // Update Kundennotizen in Supabase
          const currentNotes = customer.notes || '';
          const updatedNotes = currentNotes + '\n\n' + noteText;

          const { error: updateError } = await supabase
            .from('customers')
            .update({
              notes: updatedNotes.trim()
            })
            .eq('id', customer.id);

          if (!updateError) {
            console.log(`   ✅ ${customer.name.substring(0, 35)}: Notizen aktualisiert`);
            totalUpdated++;
          } else {
            console.error(`   ❌ Fehler bei ${customer.name}:`, updateError.message);
          }
        }
      }
    }

    console.log(`\n\n✅ Import abgeschlossen!`);
    console.log(`📈 ${totalUpdated} Kunden mit Trello-Daten aktualisiert`);

    return { success: true, totalUpdated };

  } catch (error) {
    console.error('❌ Fehler:', error);
    return { success: false, error: error.message };
  }
}

importTrelloData()
  .then(result => {
    console.log('\n✨ Fertig!', result);
    process.exit(0);
  })
  .catch(err => {
    console.error('💥 Error:', err);
    process.exit(1);
  });
