import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { AnimatePresence } from 'framer-motion';
import { useRoutes } from 'react-router-dom';

import { AppLayout } from './shared/components/AppLayout';
import { routes } from './app/routes';
import { theme } from './styles/theme';

function App() {
  const element = useRoutes(routes);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppLayout>
        <AnimatePresence mode="wait">{element}</AnimatePresence>
      </AppLayout>
    </ThemeProvider>
  );
}

export default App;
