'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Lock, Unlock, Shield } from 'lucide-react';

interface AccessCodeInputProps {
  onAccessCodeSubmit: (accessCode: string) => void;
  isLoading?: boolean;
  title?: string;
  description?: string;
}

export const AccessCodeInput: React.FC<AccessCodeInputProps> = ({
  onAccessCodeSubmit,
  isLoading = false,
  title = "Enter Access Code",
  description = "Enter your 6+ digit access code to access the timer"
}) => {
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');

  const validateAccessCode = (code: string): boolean => {
    // Must be at least 6 digits and only contain numbers
    const isValid = /^\d{6,}$/.test(code);
    if (!isValid) {
      setError('Access code must be at least 6 digits and contain only numbers');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateAccessCode(accessCode)) {
      onAccessCodeSubmit(accessCode);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers
    if (/^\d*$/.test(value)) {
      setAccessCode(value);
      if (error && /^\d{6,}$/.test(value)) {
        setError('');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <Shield className="w-12 h-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800 dark:text-white">
            {title}
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accessCode" className="text-sm font-medium">
                Access Code
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="accessCode"
                  type="text"
                  placeholder="Enter 6+ digit code"
                  value={accessCode}
                  onChange={handleInputChange}
                  className={`pl-10 text-center text-lg font-mono ${
                    error ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                  maxLength={20}
                  disabled={isLoading}
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}
              {accessCode.length > 0 && accessCode.length < 6 && !error && (
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  {6 - accessCode.length} more digits required
                </p>
              )}
              {accessCode.length >= 6 && !error && (
                <p className="text-sm text-green-600 dark:text-green-400 flex items-center">
                  <Unlock className="w-4 h-4 mr-1" />
                  Valid access code
                </p>
              )}
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || accessCode.length < 6 || !!error}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Connecting...
                </div>
              ) : (
                'Access Timer'
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <p>💡 <strong>Tips:</strong></p>
              <p>• Use the same code on multiple devices to sync</p>
              <p>• Share your code with others to collaborate</p>
              <p>• Keep your code private to prevent unauthorized access</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 