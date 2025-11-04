import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Container, 
  Stack, 
  Text, 
  Heading, 
  VStack,
  Icon,
  useColorModeValue,
  Flex,
  Image,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react';
import { EditIcon, ArrowForwardIcon, ChatIcon, LockIcon, ViewIcon } from '@chakra-ui/icons';

function Landing() {
  const bgCard = useColorModeValue('white', 'whiteAlpha.100');
  const shadowCard = useColorModeValue('2xl', 'dark-lg');
  const accentColor = useColorModeValue('brand.500', 'brand.300');
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Container maxW="6xl" py={20}>
      {/* Hero Section */}
      <VStack spacing={8} textAlign="center" mb={16}>
        <Box>
          <Heading 
            as="h1" 
            size="3xl" 
            bgGradient="linear(to-r, brand.400, purple.500, pink.400)"
            bgClip="text"
            mb={4}
            fontWeight="extrabold"
            letterSpacing="tight"
          >
            Welcome to Krowka
          </Heading>
          <Text fontSize="2xl" color={useColorModeValue('gray.600', 'gray.300')} maxW="3xl" mx="auto">
            Connect, Chat, Collaborate
          </Text>
        </Box>
        
        <Text 
          fontSize="lg" 
          color={useColorModeValue('gray.600', 'gray.400')} 
          maxW="2xl"
          lineHeight="tall"
        >
          Experience real-time messaging powered by modern web technologies. 
          Built with React, Chakra UI, and WebSocket for seamless communication.
        </Text>

        <Stack direction={{ base: 'column', md: 'row' }} spacing={6} pt={4}>
          <Link to="register">
            <Button
              size="lg"
              leftIcon={<EditIcon />}
              colorScheme="brand"
              variant="solid"
              px={8}
              py={7}
              fontSize="lg"
            >
              Get Started
            </Button>
          </Link>
          <Link to="login">
            <Button
              size="lg"
              rightIcon={<ArrowForwardIcon />}
              colorScheme="brand"
              variant="outline"
              px={8}
              py={7}
              fontSize="lg"
            >
              Sign In
            </Button>
          </Link>
        </Stack>
      </VStack>

      {/* Features Section */}
      <VStack spacing={6} mt={20}>
        <Heading size="xl" mb={8} textAlign="center">
          Why Choose Krowka?
        </Heading>
        
        <Flex 
          direction={{ base: 'column', md: 'row' }} 
          gap={8} 
          w="full"
          justify="center"
        >
          {/* Feature 1 */}
          <Box
            flex={1}
            bg={bgCard}
            p={8}
            borderRadius="2xl"
            boxShadow={shadowCard}
            backdropFilter="blur(10px)"
            transition="all 0.3s"
            _hover={{ transform: 'translateY(-8px)', boxShadow: '2xl' }}
          >
            <VStack spacing={4} align="start">
              <Icon as={ChatIcon} w={10} h={10} color={accentColor} />
              <Heading size="md">Real-time Messaging</Heading>
              <Text color={useColorModeValue('gray.600', 'gray.400')}>
                Instant message delivery with WebSocket technology for lightning-fast communication.
              </Text>
            </VStack>
          </Box>

          {/* Feature 2 */}
          <Box
            flex={1}
            bg={bgCard}
            p={8}
            borderRadius="2xl"
            boxShadow={shadowCard}
            backdropFilter="blur(10px)"
            transition="all 0.3s"
            _hover={{ transform: 'translateY(-8px)', boxShadow: '2xl' }}
          >
            <VStack spacing={4} align="start">
              <Icon as={LockIcon} w={10} h={10} color={accentColor} />
              <Heading size="md">Secure & Private</Heading>
              <Text color={useColorModeValue('gray.600', 'gray.400')}>
                Your conversations are protected with industry-standard security protocols.
              </Text>
            </VStack>
          </Box>

          {/* Feature 3 */}
          <Box
            flex={1}
            bg={bgCard}
            p={8}
            borderRadius="2xl"
            boxShadow={shadowCard}
            backdropFilter="blur(10px)"
            transition="all 0.3s"
            _hover={{ transform: 'translateY(-8px)', boxShadow: '2xl' }}
          >
            <VStack spacing={4} align="start">
              <Icon as={ViewIcon} w={10} h={10} color={accentColor} />
              <Heading size="md">Beautiful Interface</Heading>
              <Text color={useColorModeValue('gray.600', 'gray.400')}>
                Modern, clean design with dark mode support for a comfortable chatting experience.
              </Text>
            </VStack>
          </Box>
        </Flex>
      </VStack>

      {/* Reference Image Section */}
      <VStack spacing={6} mt={24} textAlign="center">
        <Heading size="lg">Design Reference</Heading>
        <Text color={useColorModeValue('gray.600', 'gray.400')} maxW="3xl">
          Explore a reference visualization that inspired Krowka’s interface. Click to view in full.
        </Text>
        <Box
          role="button"
          onClick={onOpen}
          cursor="zoom-in"
          borderRadius="2xl"
          overflow="hidden"
          boxShadow={shadowCard}
          maxW={{ base: '100%', md: '70%' }}
          mx="auto"
          transition="transform 0.3s ease, box-shadow 0.3s ease"
          _hover={{ transform: 'scale(1.02)', boxShadow: 'xl' }}
        >
          <Image
            src={process.env.PUBLIC_URL + '/Krowka_Ref.png'}
            alt="Krowka reference visual"
            width="100%"
            height="auto"
            loading="lazy"
          />
        </Box>
      </VStack>

      {/* Lightbox Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="6xl" isCentered>
        <ModalOverlay />
        <ModalContent bg={useColorModeValue('white', 'gray.900')}> 
          <ModalCloseButton />
          <ModalBody p={0}>
            <Image
              src={process.env.PUBLIC_URL + '/Krowka_Ref.png'}
              alt="Krowka reference full view"
              width="100%"
              height="auto"
              loading="eager"
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
}

export default Landing;
