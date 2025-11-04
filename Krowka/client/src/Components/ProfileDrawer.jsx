import React, { useEffect, useState } from 'react';
import {
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  Button,
  Stack,
  FormControl,
  FormLabel,
  Input,
  Switch,
  Avatar,
  HStack,
  useToast,
  Text,
} from '@chakra-ui/react';
import axios from 'axios';

const API = 'http://localhost:8080';

export default function ProfileDrawer({ isOpen, onClose, username }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    username: username || '',
    displayName: '',
    email: '',
    phone: '',
    avatarUrl: '',
    twoFA: false,
  });
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });

  useEffect(() => {
    if (!username || !isOpen) return;
    (async () => {
      try {
        const res = await axios.get(`${API}/profile`, { params: { username } });
        if (res.data?.status) {
          const p = res.data.data || {};
          setProfile(prev => ({ ...prev, ...p, username }));
        }
      } catch (e) {
        // ignore
      }
    })();
  }, [username, isOpen]);

  const onField = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const onSaveProfile = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/profile`, profile);
      if (res.data?.status) {
        toast({ title: 'Profile updated', status: 'success' });
      } else {
        toast({ title: res.data?.message || 'Failed to update', status: 'error' });
      }
    } catch (e) {
      toast({ title: 'Failed to update', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const onToggle2FA = async (e) => {
    const enabled = e.target.checked;
    setProfile(prev => ({ ...prev, twoFA: enabled }));
    try {
      await axios.post(`${API}/2fa/toggle`, { username, enabled });
    } catch {}
  };

  const onChangePassword = async () => {
    if (!passwords.current || !passwords.next || passwords.next !== passwords.confirm) {
      toast({ title: 'Provide valid passwords', status: 'warning' });
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/password/change`, {
        username,
        oldPassword: passwords.current,
        newPassword: passwords.next,
      });
      if (res.data?.status) {
        toast({ title: 'Password changed', status: 'success' });
        setPasswords({ current: '', next: '', confirm: '' });
      } else {
        toast({ title: res.data?.message || 'Failed to change password', status: 'error' });
      }
    } catch (e) {
      toast({ title: 'Failed to change password', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const onUploadAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('username', username);
    form.append('file', file);
    setLoading(true);
    try {
      const res = await axios.post(`${API}/avatar`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data?.status) {
        const url = res.data?.data?.avatarUrl;
        setProfile(prev => ({ ...prev, avatarUrl: url }));
        toast({ title: 'Avatar updated', status: 'success' });
      } else {
        toast({ title: res.data?.message || 'Failed to update avatar', status: 'error' });
      }
    } catch (e) {
      toast({ title: 'Failed to update avatar', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const shownAvatar = profile.avatarUrl || (process.env.PUBLIC_URL + '/Face_K.PNG');

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerHeader>Profile & Security</DrawerHeader>
        <DrawerBody>
          <Stack spacing={6}>
            <HStack>
              <Avatar name={profile.displayName || profile.username} src={shownAvatar} size="xl" />
              <Stack spacing={2}>
                <Button onClick={() => document.getElementById('avatarUploadInput').click()} isLoading={loading}>
                  Upload Avatar
                </Button>
                <Input id="avatarUploadInput" type="file" display="none" accept="image/*" onChange={onUploadAvatar} />
                <Text fontSize="sm" color="gray.500">Default is Krowka face until you upload.</Text>
              </Stack>
            </HStack>

            <FormControl>
              <FormLabel>Display Name</FormLabel>
              <Input name="displayName" value={profile.displayName || ''} onChange={onField} />
            </FormControl>

            <FormControl>
              <FormLabel>Username</FormLabel>
              <Input value={profile.username} isReadOnly />
            </FormControl>

            <FormControl>
              <FormLabel>Email</FormLabel>
              <Input name="email" value={profile.email || ''} onChange={onField} />
            </FormControl>

            <FormControl>
              <FormLabel>Phone</FormLabel>
              <Input name="phone" value={profile.phone || ''} onChange={onField} />
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <FormLabel mb="0">Two-factor Authentication</FormLabel>
              <Switch isChecked={!!profile.twoFA} onChange={onToggle2FA} />
            </FormControl>

            <Button colorScheme="brand" onClick={onSaveProfile} isLoading={loading}>Save Profile</Button>

            <Stack spacing={3}>
              <FormControl>
                <FormLabel>Current Password</FormLabel>
                <Input type="password" value={passwords.current} onChange={(e)=>setPasswords(p=>({...p,current:e.target.value}))} />
              </FormControl>
              <FormControl>
                <FormLabel>New Password</FormLabel>
                <Input type="password" value={passwords.next} onChange={(e)=>setPasswords(p=>({...p,next:e.target.value}))} />
              </FormControl>
              <FormControl>
                <FormLabel>Confirm New Password</FormLabel>
                <Input type="password" value={passwords.confirm} onChange={(e)=>setPasswords(p=>({...p,confirm:e.target.value}))} />
              </FormControl>
              <Button variant="outline" onClick={onChangePassword} isLoading={loading}>Change Password</Button>
            </Stack>
          </Stack>
        </DrawerBody>
        <DrawerFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>Close</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
