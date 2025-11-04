import React from 'react';

import { 
  Box, 
  Text, 
  Center, 
  VStack, 
  HStack,
  Link as ChakraLink,
  useColorModeValue,
  Badge,
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';

function Footer() {
  const bgColor = useColorModeValue('whiteAlpha.700', 'blackAlpha.500');
  const textColor = useColorModeValue('gray.700', 'gray.300');
  const linkColor = useColorModeValue('brand.600', 'brand.300');

  return (
    <Box 
      mt={20} 
      py={10} 
      bg={bgColor}
      backdropFilter="blur(10px)"
      borderTop="1px"
      borderColor={useColorModeValue('gray.200', 'whiteAlpha.200')}
    >
      <Center className="container" flexDirection="column">
        <VStack spacing={4}>
          {/* Tech Stack */}
          <HStack spacing={3} mb={2}>
            <Badge colorScheme="blue" fontSize="xs" px={2} py={1} borderRadius="md">
              React
            </Badge>
            <Badge colorScheme="red" fontSize="xs" px={2} py={1} borderRadius="md">
              Redis
            </Badge>
            <Badge colorScheme="cyan" fontSize="xs" px={2} py={1} borderRadius="md">
              Golang
            </Badge>
          </HStack>

          {/* Attribution */}
          <Text fontSize="sm" color={textColor} textAlign="center">
            Made with 💜 in Ireland 🇮🇪 ☘️
          </Text>
          
          <ChakraLink 
            href="https://shivamsapru.github.io/Portfolio/" 
            isExternal
            color={linkColor}
            fontWeight="600"
            fontSize="sm"
            _hover={{ textDecoration: 'underline' }}
          >
            Shivam Sapru <ExternalLinkIcon mx="2px" />
          </ChakraLink>

          <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.500')} mt={2}>
            © {new Date().getFullYear()} Krowka. All rights reserved.
          </Text>
        </VStack>
      </Center>
    </Box>
  );
}

export default Footer;
