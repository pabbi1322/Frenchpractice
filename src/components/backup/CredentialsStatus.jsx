// CredentialsStatus.jsx
import React from 'react';
import { getGoogleDriveCredentials } from '../../credentials/credentials-utils';
import { Shield, ShieldAlert, Check, Globe, AlertTriangle } from 'lucide-react';

const CredentialsStatus = () => {
  const { clientId, origins } = getGoogleDriveCredentials();
  const hasCredentials = !!clientId;
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : null;
  const isCurrentOriginAuthorized = origins?.includes(currentOrigin);

  return (
    <div className="mb-4 p-4 rounded-lg bg-slate-100">
      <h3 className="text-lg font-medium flex items-center gap-2">
        {hasCredentials ? (
          <>
            <Shield className="h-5 w-5 text-green-600" />
            <span>Google Drive Credentials Loaded</span>
          </>
        ) : (
          <>
            <ShieldAlert className="h-5 w-5 text-red-600" />
            <span>Google Drive Credentials Missing</span>
          </>
        )}
      </h3>

      <div className="mt-2">
        {hasCredentials ? (
          <>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Client ID:</span>{' '}
              {clientId.substring(0, 15)}...
            </p>
            
            {currentOrigin && (
              <p className="text-sm mt-1 flex items-center">
                <Globe className="h-4 w-4 mr-1 text-blue-600" />
                <span className="font-medium mr-1">Current origin:</span>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  {currentOrigin}
                </span>
                {!isCurrentOriginAuthorized && (
                  <span className="ml-2 flex items-center text-amber-600">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Not authorized in Google Console
                  </span>
                )}
              </p>
            )}
            
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-medium">Authorized Origins:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {origins && origins.map((origin, i) => (
                  <span 
                    key={i} 
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      origin === currentOrigin 
                        ? 'bg-green-100 text-green-800 outline outline-1 outline-green-500' 
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    {origin}
                  </span>
                ))}
              </div>
            </p>
          </>
        ) : (
          <p className="text-sm text-red-600">
            Unable to load Google Drive credentials. Please check if the credentials file is correctly placed.
          </p>
        )}
      </div>
    </div>
  );
};

export default CredentialsStatus;