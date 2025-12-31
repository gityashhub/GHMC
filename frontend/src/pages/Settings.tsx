import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { User, Building, Shield, FileText, Loader2 } from "lucide-react";
import settingsService, { Setting } from "@/services/settings.service";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function Settings() {
  const queryClient = useQueryClient();
  const { user, updateProfile, changePassword } = useAuth();

  // Fetch settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.getSettings(),
  });

  // Create a map of settings for easy access
  const settingsMap = settings?.reduce((acc, setting) => {
    acc[setting.key] = setting;
    return acc;
  }, {} as Record<string, Setting>) || {};

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  // Company settings form state
  const [companyForm, setCompanyForm] = useState({
    company_name: settingsMap['company_name']?.value || '',
    company_gst_number: settingsMap['company_gst_number']?.value || '',
    company_address: settingsMap['company_address']?.value || '',
    company_contact: settingsMap['company_contact']?.value || '',
    company_email: settingsMap['company_email']?.value || '',
  });

  // Invoice settings form state
  const [invoiceForm, setInvoiceForm] = useState({
    invoice_number_format: settingsMap['invoice_number_format']?.value || 'INV-YYYYMM',
    cgst_rate: settingsMap['cgst_rate']?.value || '9',
    sgst_rate: settingsMap['sgst_rate']?.value || '9',
    payment_terms: settingsMap['payment_terms']?.value || '30',
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (updates: Array<{ key: string; value: string; type?: string }>) =>
      settingsService.bulkUpdateSettings(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update settings');
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: { fullName?: string; phone?: string }) => updateProfile(data),
    onSuccess: () => {
      toast.success('Profile updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update profile');
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) => changePassword(data),
    onSuccess: () => {
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to change password');
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      fullName: profileForm.fullName,
      phone: profileForm.phone,
    });
  };

  const handleCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updates = [
      { key: 'company_name', value: companyForm.company_name, type: 'string' },
      { key: 'company_gst_number', value: companyForm.company_gst_number, type: 'string' },
      { key: 'company_address', value: companyForm.company_address, type: 'string' },
      { key: 'company_contact', value: companyForm.company_contact, type: 'string' },
      { key: 'company_email', value: companyForm.company_email, type: 'string' },
    ];
    updateSettingsMutation.mutate(updates);
  };

  const handleInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updates = [
      { key: 'invoice_number_format', value: invoiceForm.invoice_number_format, type: 'string' },
      { key: 'cgst_rate', value: invoiceForm.cgst_rate, type: 'number' },
      { key: 'sgst_rate', value: invoiceForm.sgst_rate, type: 'number' },
      { key: 'payment_terms', value: invoiceForm.payment_terms, type: 'number' },
    ];
    updateSettingsMutation.mutate(updates);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  if (isLoading) {
    return (
      <MainLayout title="Settings" subtitle="Manage your ERP preferences">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Settings" subtitle="Manage your ERP preferences">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Settings */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/20">
              <User className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Profile Settings</h3>
          </div>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
              <input
                type="text"
                className="input-field w-full"
                value={profileForm.fullName}
                onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input
                type="email"
                className="input-field w-full"
                value={profileForm.email}
                disabled
                title="Email cannot be changed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Phone</label>
              <input
                type="tel"
                className="input-field w-full"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Profile'
              )}
            </Button>
          </form>
        </div>

        {/* Company Settings */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-warning/20">
              <Building className="w-5 h-5 text-warning" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Company Settings</h3>
          </div>
          <form onSubmit={handleCompanySubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Company Name</label>
              <input
                type="text"
                className="input-field w-full"
                value={companyForm.company_name}
                onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">GST Number</label>
              <input
                type="text"
                className="input-field w-full"
                value={companyForm.company_gst_number}
                onChange={(e) => setCompanyForm({ ...companyForm, company_gst_number: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Address</label>
              <textarea
                className="input-field w-full min-h-[80px]"
                value={companyForm.company_address}
                onChange={(e) => setCompanyForm({ ...companyForm, company_address: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Contact</label>
              <input
                type="text"
                className="input-field w-full"
                value={companyForm.company_contact}
                onChange={(e) => setCompanyForm({ ...companyForm, company_contact: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input
                type="email"
                className="input-field w-full"
                value={companyForm.company_email}
                onChange={(e) => setCompanyForm({ ...companyForm, company_email: e.target.value })}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={updateSettingsMutation.isPending}
            >
              {updateSettingsMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Update Company'
              )}
            </Button>
          </form>
        </div>

        {/* Security Settings */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-destructive/20">
              <Shield className="w-5 h-5 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Security</h3>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Current Password</label>
              <input
                type="password"
                className="input-field w-full"
                placeholder="••••••••"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">New Password</label>
              <input
                type="password"
                className="input-field w-full"
                placeholder="••••••••"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Confirm Password</label>
              <input
                type="password"
                className="input-field w-full"
                placeholder="••••••••"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Changing...
                </>
              ) : (
                'Change Password'
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Invoice Settings */}
      <div className="glass-card p-6 mt-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-chart-4/20">
            <FileText className="w-5 h-5 text-chart-4" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Invoice Settings</h3>
        </div>
        <form onSubmit={handleInvoiceSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Invoice Prefix</label>
            <input
              type="text"
              className="input-field w-full"
              value={invoiceForm.invoice_number_format}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_number_format: e.target.value })}
              placeholder="INV-YYYYMM"
            />
            <p className="text-xs text-muted-foreground mt-1">YYYYMM will be replaced with year and month</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">CGST Rate (%)</label>
            <input
              type="number"
              step="0.01"
              className="input-field w-full"
              value={invoiceForm.cgst_rate}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, cgst_rate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">SGST Rate (%)</label>
            <input
              type="number"
              step="0.01"
              className="input-field w-full"
              value={invoiceForm.sgst_rate}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, sgst_rate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Payment Terms (Days)</label>
            <input
              type="number"
              className="input-field w-full"
              value={invoiceForm.payment_terms}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, payment_terms: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <Button
              type="submit"
              className="w-full"
              disabled={updateSettingsMutation.isPending}
            >
              {updateSettingsMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
