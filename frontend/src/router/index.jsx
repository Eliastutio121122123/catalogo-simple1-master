import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';

export default function Router() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}