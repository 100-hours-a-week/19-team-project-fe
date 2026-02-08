'use client';

import { useRef, useState } from 'react';

export function useMyPageEditProfileImage({
  maxBytes,
  onError,
}: {
  maxBytes: number;
  onError: (message: string) => void;
}) {
  const [profileImageReset, setProfileImageReset] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleProfileImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = '';
    if (!file) return;
    if (file.size > maxBytes) {
      onError('프로필 이미지는 10MB 이하만 업로드할 수 있습니다.');
      return;
    }
    const preview = URL.createObjectURL(file);
    setProfileImageFile(file);
    setProfileImagePreview(preview);
    setProfileImageReset(false);
  };

  const handleProfileImageReset = () => {
    setProfileImageReset(true);
    setProfileImageFile(null);
    setProfileImagePreview(null);
  };

  return {
    profileImageReset,
    setProfileImageReset,
    profileImageUrl,
    setProfileImageUrl,
    profileImageFile,
    setProfileImageFile,
    profileImagePreview,
    setProfileImagePreview,
    fileInputRef,
    handleProfileImageChange,
    handleProfileImageReset,
  };
}
