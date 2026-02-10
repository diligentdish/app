import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MemberLayout } from '../components/MemberLayout';
import { User, Mail, Calendar, Crown } from 'lucide-react';

const ProfilePage = () => {
  const { user } = useAuth();

  return (
    <MemberLayout>
      <div className="max-w-2xl mx-auto" data-testid="profile-page">
        {/* Header */}
        <div className="mb-8">
          <h1 className="heading-2 text-foreground">Your Profile</h1>
          <p className="body text-muted-foreground">Manage your account details</p>
        </div>

        {/* Profile Card */}
        <div className="member-card">
          {/* Avatar & Name */}
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              {user?.picture ? (
                <img 
                  src={user.picture} 
                  alt={user.name} 
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-primary" strokeWidth={1.5} />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground">{user?.name}</h2>
              <p className="text-muted-foreground">Blessed Belly Member</p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <Mail className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-foreground font-medium">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <Crown className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Subscription Status</p>
                <p className="text-foreground font-medium">
                  {user?.has_subscription ? (
                    <span className="text-primary">Active Member</span>
                  ) : (
                    <span className="text-muted-foreground">No active subscription</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <Calendar className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="text-foreground font-medium">Beta Monthly ($9/month)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Encouragement */}
        <div className="text-center mt-8 py-6">
          <p className="text-muted-foreground italic">
            "For you created my inmost being; you knit me together in my mother's womb."
          </p>
          <p className="text-sm text-primary mt-2">— Psalm 139:13</p>
        </div>
      </div>
    </MemberLayout>
  );
};

export default ProfilePage;
