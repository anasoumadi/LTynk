
"use client"

import React from 'react';

interface LanguagePairSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LanguagePairSettings: React.FC<LanguagePairSettingsProps> = () => {
  // This component is obsolete and has been disabled to fix a build error.
  // Locale-specific settings are now managed in the main QA Settings panel.
  return null;
};
