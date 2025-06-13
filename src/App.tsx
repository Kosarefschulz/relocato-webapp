import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';

import Dashboard from './components/Dashboard';
import CustomerSearch from './components/CustomerSearch';
import CreateQuote from './components/CreateQuote';
import NewCustomer from './components/NewCustomer';
import QuotesList from './components/QuotesList';
import CustomersList from './components/CustomersList';
import CustomerDetails from './components/CustomerDetails';
import InvoicesList from './components/InvoicesList';
import SalesPage from './pages/SalesPage';
import CalendarView from './components/CalendarView';


function App() {

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* All Routes */}
          <Route 
            path="/dashboard" 
            element={<Dashboard />} 
          />
          <Route 
            path="/search-customer" 
            element={<CustomerSearch />} 
          />
          <Route 
            path="/create-quote" 
            element={<CreateQuote />} 
          />
          <Route 
            path="/create-quote/:customerId" 
            element={<CreateQuote />} 
          />
          <Route 
            path="/new-customer" 
            element={<NewCustomer />} 
          />
          <Route 
            path="/quotes" 
            element={<QuotesList />} 
          />
          <Route 
            path="/customers" 
            element={<CustomersList />} 
          />
          <Route 
            path="/invoices" 
            element={<InvoicesList />} 
          />
          <Route 
            path="/sales" 
            element={<SalesPage />} 
          />
          <Route 
            path="/calendar" 
            element={<CalendarView />} 
          />
          
          {/* Customer Detail Routes */}
          <Route 
            path="/customer-details/:customerId" 
            element={<CustomerDetails />} 
          />
          <Route 
            path="/edit-customer/:customerId" 
            element={<CustomerDetails />} 
          />
          
          {/* Default Route */}
          <Route 
            path="/" 
            element={<Navigate to="/dashboard" />} 
          />
          <Route 
            path="/login" 
            element={<Navigate to="/dashboard" />} 
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;