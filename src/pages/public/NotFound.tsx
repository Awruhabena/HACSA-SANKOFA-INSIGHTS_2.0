import { Link } from 'react-router-dom';
import { Card, Button } from '../../components/ui';
import { Compass, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <Card className="text-center py-12 px-6 sm:px-10 shadow-sm space-y-5">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-cream border border-border flex items-center justify-center text-teal shadow-2xs">
        <Compass className="w-8 h-8" />
      </div>

      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-navy">
          Page Not Found
        </h1>
        <p className="font-aside text-teal text-lg font-bold mt-1">
          ~ the path you seek does not exist
        </p>
      </div>

      <p className="text-gray text-sm max-w-sm mx-auto leading-relaxed">
        The link or QR code you followed may be outdated or incorrect. Please verify the URL or return to the main portal.
      </p>

      <div className="pt-2">
        <Link to="/dashboard">
          <Button variant="primary" className="inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Portal</span>
          </Button>
        </Link>
      </div>
    </Card>
  );
}
