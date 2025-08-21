// src/pages/Profile.jsx
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, ShieldCheck, Loader } from 'lucide-react';

const Profile = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-text-muted">Could not load user profile. Please try again.</p>
      </div>
    );
  }
  
  const userInitials = user.name ? user.name.split(' ').map(n => n[0]).join('') : '';

  return (
    <div className="bg-background min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-md border border-border overflow-hidden">
          <div className="h-32 bg-primary-light"></div>
          <div className="px-6 pb-8 -mt-16">
            <div className="flex items-end space-x-5">
              <div className="w-28 h-28 bg-primary rounded-full flex items-center justify-center text-white text-4xl font-bold ring-4 ring-white">
                {userInitials}
              </div>
              <div>
                 <h1 className="text-2xl font-bold text-text-primary">{user.name}</h1>
                 <p className="text-sm text-text-muted">User Profile</p>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-border">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Account Details</h2>
                <div className="space-y-4">
                    <div className="flex items-center">
                        <User className="w-5 h-5 text-text-muted mr-4" />
                        <div>
                            <p className="text-xs text-text-muted">Full Name</p>
                            <p className="font-medium text-text-primary">{user.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <Mail className="w-5 h-5 text-text-muted mr-4" />
                        <div>
                            <p className="text-xs text-text-muted">Email Address</p>
                            <p className="font-medium text-text-primary">{user.email}</p>
                        </div>
                    </div>
                     <div className="flex items-center">
                        <ShieldCheck className="w-5 h-5 text-text-muted mr-4" />
                        <div>
                            <p className="text-xs text-text-muted">User ID</p>
                            <p className="font-mono text-sm text-text-primary bg-gray-100 px-2 py-1 rounded">{user.id}</p>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;