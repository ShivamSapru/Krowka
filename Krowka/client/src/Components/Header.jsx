import React, { useEffect, useMemo, useState } from 'react';

import { 
  Box, 
  Center, 
  Heading,
  Flex, 
  Spacer, 
  Button, 
  useColorModeValue,
  VisuallyHidden,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '../Logo';
import ProfileDrawer from './ProfileDrawer';

function Header() {
  const headerBg = useColorModeValue(
    'linear(to-r, brand.500, purple.500, pink.500)',
    'linear(to-r, brand.600, purple.700, pink.600)'
  );
  const buttonHoverBg = useColorModeValue('whiteAlpha.300', 'whiteAlpha.200');
  const location = useLocation();
  const navigate = useNavigate();
  const [username, setUsername] = useState(() => {
    try {
      return localStorage.getItem('krowkaUser') || '';
    } catch {
      return '';
    }
  });

  // If user lands directly on /chat?u=..., pick up the username from the URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const u = params.get('u');
    if (u && !username) {
      setUsername(u);
      try { localStorage.setItem('krowkaUser', u); } catch {}
    }
  }, [location.search, username]);

  const isLoggedIn = useMemo(() => !!username, [username]);

  const onLogout = () => {
    try { localStorage.removeItem('krowkaUser'); } catch {}
    setUsername('');
    navigate('/');
  };

  const [isProfileOpen, setProfileOpen] = useState(false);

  return (
    <Box 
      width="100%" 
      bgGradient={headerBg}
      color="white" 
      py={3}
      px={6}
      boxShadow="lg"
      position="sticky"
      top={0}
      zIndex={1000}
      backdropFilter="blur(10px)"
    >
      <Center>
        <Flex className="container" align="center" width="100%" maxW="6xl">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <Logo boxSize={{ base: 10, md: 12 }} objectFit="contain" />
            <Heading
              as="h1"
              size="md"
              ml={3}
              fontWeight="extrabold"
              letterSpacing="tight"
              bgGradient="linear(to-r, white, whiteAlpha.800)"
              bgClip="text"
              transition="all 0.2s ease"
              _hover={{
                transform: 'translateY(-1px)',
                textShadow: '0 0 18px rgba(255,255,255,0.6)'
              }}
            >
              Krowka
            </Heading>
            <VisuallyHidden>Krowka Home</VisuallyHidden>
          </Link>
          <Spacer />
          <Flex gap={3} align="center">
            {!isLoggedIn ? (
              <>
                <Link to="/register">
                  <Button 
                    variant="outline" 
                    colorScheme="whiteAlpha" 
                    borderColor="whiteAlpha.700"
                    borderWidth="2px"
                    color="white"
                    _hover={{ 
                      bg: buttonHoverBg,
                      borderColor: 'white',
                      transform: 'translateY(-2px)',
                    }}
                    transition="all 0.3s"
                  >
                    Register
                  </Button>
                </Link>
                <Link to="/login">
                  <Button 
                    variant="solid" 
                    bg="white"
                    color="brand.600"
                    _hover={{ 
                      bg: 'whiteAlpha.900',
                      transform: 'translateY(-2px)',
                      boxShadow: 'xl',
                    }}
                    transition="all 0.3s"
                    fontWeight="bold"
                  >
                    Login
                  </Button>
                </Link>
              </>
            ) : (
              <Menu>
                <MenuButton>
                  <Avatar size="sm" name={username} src={undefined} bg="whiteAlpha.900" color="brand.700" />
                </MenuButton>
                <MenuList>
                  <MenuItem onClick={() => navigate('/chat?u=' + encodeURIComponent(username))}>Open Chat</MenuItem>
                  <MenuItem onClick={() => setProfileOpen(true)}>Profile</MenuItem>
                  <MenuItem onClick={onLogout}>Logout</MenuItem>
                </MenuList>
              </Menu>
            )}
          </Flex>
          <ProfileDrawer isOpen={isProfileOpen} onClose={()=>setProfileOpen(false)} username={username} />
        </Flex>
      </Center>
    </Box>
  );
}

export default Header;
