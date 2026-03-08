import { Link } from 'react-router-dom';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-slate-950">
      <Card className="max-w-md text-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">404</h1>
        <p className="mt-2 text-sm text-slate-500">The page you requested was not found.</p>
        <Link to="/dashboard" className="mt-4 inline-block">
          <Button>Back to Dashboard</Button>
        </Link>
      </Card>
    </div>
  );
}

export default NotFoundPage;
