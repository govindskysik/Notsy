import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import router from './routes/index';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster
        position="top-center"
        gutter={10}
        containerStyle={{ top: 24 }}
        toastOptions={{
          className: 'notsy-toast',
          duration: 4500,
          style: {
            background: 'linear-gradient(145deg, #211d18, #11100e)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '14px 18px',
            boxShadow: '0 16px 48px rgba(0,0,0,.4)',
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '13px',
            lineHeight: '1.5',
            maxWidth: 'min(420px, calc(100vw - 32px))',
          },
          success: { iconTheme: { primary: '#ff6500', secondary: '#11100e' } },
          error: { duration: 6000, iconTheme: { primary: '#f28b79', secondary: '#11100e' } },
          loading: { iconTheme: { primary: '#ff6500', secondary: '#393127' } },
        }}
      />
    </AuthProvider>
  );
}

export default App;
