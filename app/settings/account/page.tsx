'use client';
import React, { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import { Camera, Upload, User, Mail, Lock, Save, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  profile_image?: string;
}

export default function AccountSettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Profile photo state
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // User info editing state
  const [editingInfo, setEditingInfo] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/auth/profile');
      
      if (response.ok) {
        const profileData = await response.json();
        setProfile(profileData);
        setFormData({
          name: profileData.name,
          email: profileData.email,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        // Fallback to user data from useAuth if profile fetch fails
        if (user) {
          setProfile({
            id: 0, // Placeholder ID
            name: user.name,
            email: user.email
          });
          setFormData({
            name: user.name,
            email: user.email,
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Fallback to user data from useAuth if profile fetch fails
      if (user) {
        setProfile({
          id: 0, // Placeholder ID
          name: user.name,
          email: user.email
        });
        setFormData({
          name: user.name,
          email: user.email,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    setUploadingPhoto(true);
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const response = await fetch('/api/auth/profile/photo', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        setProfile(prev => prev ? { ...prev, profile_image: result.imageUrl } : null);
        setShowPhotoOptions(false);
      } else {
        console.error('Failed to upload photo');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePhotoUrl = async () => {
    if (!photoUrl.trim()) return;
    
    setUploadingPhoto(true);
    
    try {
      const response = await fetch('/api/auth/profile/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: photoUrl })
      });
      
      if (response.ok) {
        const result = await response.json();
        setProfile(prev => prev ? { ...prev, profile_image: result.imageUrl } : null);
        setShowPhotoOptions(false);
        setPhotoUrl('');
      } else {
        console.error('Failed to update photo');
      }
    } catch (error) {
      console.error('Error updating photo:', error);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Current password is required to change password';
      }
      if (formData.newPassword.length < 6) {
        newErrors.newPassword = 'New password must be at least 6 characters';
      }
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveChanges = async () => {
    if (!validateForm()) return;
    
    setSaving(true);
    
    try {
      const updateData: any = {
        name: formData.name,
        email: formData.email
      };
      
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }
      
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      
      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setEditingInfo(false);
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
        setErrors({});
      } else {
        const errorData = await response.json();
        setErrors({ general: errorData.error || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrors({ general: 'An error occurred while updating profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (loading) {
    return (
      <Layout 
        user={user || undefined}
        children={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        }
      />
    );
  }

  return (
    <Layout 
      user={user || undefined}
      children={
        <div className="min-h-screen bg-gray-50 py-12 px-6">
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
              <p className="text-gray-600">Manage your profile and account preferences</p>
            </div>

            {/* Profile Photo and Header Section */}
            <div className="bg-white rounded-lg shadow-sm border">
              {/* Header Background */}
              <div className="h-32 bg-gradient-to-r from-blue-400 to-purple-500 rounded-t-lg relative">
                <div className="absolute inset-0 bg-black bg-opacity-20 rounded-t-lg"></div>
                <div className="absolute top-4 right-4 text-white text-sm opacity-75">
                  Profile photo and header image
                </div>
              </div>
              
              {/* Profile Photo */}
              <div className="relative px-6 pb-6">
                <div 
                  className="relative -mt-16 mb-4 inline-block"
                  onMouseEnter={() => setShowPhotoOptions(true)}
                  onMouseLeave={() => setShowPhotoOptions(false)}
                >
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100 relative group cursor-pointer">
                    {profile?.profile_image ? (
                      <img
                        src={profile.profile_image}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                        <User size={48} {...({ className: "text-white" } as any)} />
                      </div>
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera size={24} {...({ className: "text-white" } as any)} />
                    </div>
                  </div>
                  
                  {/* Photo Upload Options */}
                  {showPhotoOptions && (
                    <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border p-4 z-10 w-80">
                      <h4 className="font-semibold text-gray-900 mb-3">Update Profile Photo</h4>
                      
                      {/* URL Upload */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Photo URL
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="url"
                            value={photoUrl}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhotoUrl(e.target.value)}
                            placeholder="Enter image URL..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <button
                            onClick={handlePhotoUrl}
                            disabled={uploadingPhoto || !photoUrl.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {uploadingPhoto ? '...' : 'Save'}
                          </button>
                        </div>
                      </div>
                      
                      {/* File Upload */}
                      <div className="border-t pt-3">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingPhoto}
                          className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                        >
                          <Upload size={16} />
                          <span>Upload from Computer</span>
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const file = e.target.files?.[0];
                            if (file) handlePhotoUpload(file);
                          }}
                          className="hidden"
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-gray-900">{profile?.name}</h2>
                  <p className="text-gray-600">{profile?.email}</p>
                </div>
              </div>
            </div>

            {/* User Information Section */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                {!editingInfo ? (
                  <button
                    onClick={() => setEditingInfo(true)}
                    className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                  >
                    Edit Information
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditingInfo(false);
                        setErrors({});
                        setFormData({
                          name: profile?.name || '',
                          email: profile?.email || '',
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: ''
                        });
                      }}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center space-x-1"
                    >
                      <X size={16} />
                      <span>Cancel</span>
                    </button>
                    <button
                      onClick={handleSaveChanges}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
                    >
                      <Save size={16} />
                      <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                )}
              </div>

              {errors.general && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-700 text-sm">{errors.general}</p>
                </div>
              )}

              <div className="space-y-6">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User size={16} {...({ className: "inline mr-2" } as any)} />
                    Full Name
                  </label>
                  {editingInfo ? (
                    <div>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your full name"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                      )}
                    </div>
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 rounded-md text-gray-900">
                      {profile?.name || 'No name set'}
                    </p>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail size={16} {...({ className: "inline mr-2" } as any)} />
                    Email Address
                  </label>
                  {editingInfo ? (
                    <div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your email address"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                      )}
                    </div>
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 rounded-md text-gray-900">
                      {profile?.email || 'No email set'}
                    </p>
                  )}
                </div>

                {/* Password Fields - Only show when editing */}
                {editingInfo && (
                  <>
                    <div className="border-t pt-6">
                      <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                        <Lock size={16} {...({ className: "mr-2" } as any)} />
                        Change Password (Optional)
                      </h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current Password
                          </label>
                          <input
                            type="password"
                            name="currentPassword"
                            value={formData.currentPassword}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter current password"
                          />
                          {errors.currentPassword && (
                            <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            New Password
                          </label>
                          <input
                            type="password"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter new password"
                          />
                          {errors.newPassword && (
                            <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Confirm new password"
                          />
                          {errors.confirmPassword && (
                            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      }
    />
  );
}
