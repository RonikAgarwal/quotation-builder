import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './components/Home/Home';
import { QuotationBuilder } from './QuotationBuilder';
import { SharedQuotationView } from './components/SharedQuotationView';

export function Root() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/builder" element={<QuotationBuilder />} />
        <Route path="/share/:id" element={<SharedQuotationView />} />
      </Routes>
    </BrowserRouter>
  );
}
