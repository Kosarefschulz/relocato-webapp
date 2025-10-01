import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { v4 as uuidv4 } from 'uuid';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Chip
} from '@mui/material';
import { Upload, CheckCircle, Error } from '@mui/icons-material';

interface CsvRecord {
  'First Name': string;
  'Last Name': string;
  'Email': string;
  'Phone': string;
  'Account Name': string;
  'Lead Source': string;
  'Contact Owner': string;
  'Description': string;
}

const ImportCustomers: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; failed: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importedCustomers, setImportedCustomers] = useState<any[]>([]);

  const generateCustomerNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `RS-${timestamp}-${random}`;
  };

  const prepareCustomerData = (row: CsvRecord) => {
    const firstName = row['First Name'] || '';
    const lastName = row['Last Name'] || '';
    const fullName = `${firstName} ${lastName}`.trim() || row['Account Name'] || 'Unbekannt';

    const email = row['Email'] || '';
    const phone = row['Phone'] || '';
    const description = row['Description'] || '';

    return {
      id: uuidv4(),
      customer_number: generateCustomerNumber(),
      name: fullName,
      email: email.toLowerCase(),
      phone: phone,
      from_address: 'Noch nicht angegeben',
      to_address: 'Noch nicht angegeben',
      moving_date: null,
      apartment: 0,
      services: ['Umzug'],
      sales_status: 'lead',
      status: 'active',
      is_deleted: false,
      notes: description,
      source: 'CSV Import - Zoho CRM',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  };

  const parseCSV = (text: string): CsvRecord[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const records: CsvRecord[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const record: any = {};
      headers.forEach((header, index) => {
        record[header] = values[index]?.trim() || '';
      });
      records.push(record);
    }

    return records;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Bitte wählen Sie eine CSV-Datei aus');
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setError(null);
    setProgress(0);

    try {
      const text = await file.text();
      const records = parseCSV(text);

      if (records.length === 0) {
        setError('Keine Daten in der CSV-Datei gefunden');
        setImporting(false);
        return;
      }

      const customers = records.map(prepareCustomerData);
      let successCount = 0;
      let failedCount = 0;
      const imported: any[] = [];

      for (let i = 0; i < customers.length; i++) {
        const customer = customers[i];

        try {
          const { data, error } = await supabase
            .from('customers')
            .insert([customer])
            .select()
            .single();

          if (error) {
            console.error(`Failed to import ${customer.name}:`, error);
            failedCount++;
          } else {
            successCount++;
            imported.push(data);
          }
        } catch (err) {
          console.error(`Exception importing ${customer.name}:`, err);
          failedCount++;
        }

        setProgress(((i + 1) / customers.length) * 100);

        // Small delay to avoid rate limiting
        if (i > 0 && i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      setResults({
        success: successCount,
        failed: failedCount,
        total: customers.length
      });
      setImportedCustomers(imported);

    } catch (err: any) {
      setError(`Import fehlgeschlagen: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Kunden importieren
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            CSV-Datei auswählen
          </Typography>

          <Box sx={{ my: 2 }}>
            <input
              accept=".csv"
              id="csv-file-input"
              type="file"
              style={{ display: 'none' }}
              onChange={handleFileChange}
              disabled={importing}
            />
            <label htmlFor="csv-file-input">
              <Button
                variant="outlined"
                component="span"
                startIcon={<Upload />}
                disabled={importing}
              >
                CSV-Datei wählen
              </Button>
            </label>

            {file && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Ausgewählte Datei: {file.name}
              </Typography>
            )}
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            variant="contained"
            onClick={handleImport}
            disabled={!file || importing}
            sx={{ mt: 2 }}
          >
            Import starten
          </Button>

          {importing && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Importiere Kunden... {Math.round(progress)}%
              </Typography>
              <LinearProgress variant="determinate" value={progress} />
            </Box>
          )}
        </CardContent>
      </Card>

      {results && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Import-Ergebnisse
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Chip
                icon={<CheckCircle />}
                label={`${results.success} erfolgreich`}
                color="success"
                variant="outlined"
              />
              {results.failed > 0 && (
                <Chip
                  icon={<Error />}
                  label={`${results.failed} fehlgeschlagen`}
                  color="error"
                  variant="outlined"
                />
              )}
              <Chip
                label={`${results.total} gesamt`}
                variant="outlined"
              />
            </Box>

            <Button
              variant="contained"
              onClick={() => navigate('/customers')}
            >
              Zur Kundenliste
            </Button>
          </CardContent>
        </Card>
      )}

      {importedCustomers.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Importierte Kunden
          </Typography>

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Kundennummer</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>E-Mail</TableCell>
                <TableCell>Telefon</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {importedCustomers.slice(0, 10).map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>{customer.customer_number}</TableCell>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                </TableRow>
              ))}
              {importedCustomers.length > 10 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography variant="body2" color="text.secondary">
                      ... und {importedCustomers.length - 10} weitere
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
};

export default ImportCustomers;