import React from 'react';

import { Text, Box, Divider, HStack, Avatar, VStack, useColorModeValue } from '@chakra-ui/react';

// Renders the list of contacts; onSelect(username) is called when a contact is clicked
const ContactList = ({ contacts = [], onSelect }) => {
  const hoverBg = useColorModeValue('blackAlpha.50', 'whiteAlpha.100');
  const subColor = useColorModeValue('gray.500', 'gray.400');

  const contactList = contacts.map(c => {
    const ts = new Date(c.last_activity * 1000);
    const initial = (c.username || '?').slice(0, 1).toUpperCase();

    return (
      <Box key={c.username}>
        <HStack
          as="button"
          onClick={() => onSelect && onSelect(c.username)}
          align="center"
          justify="space-between"
          py={3}
          px={3}
          borderRadius="lg"
          w="full"
          _hover={{ bg: hoverBg, transform: 'translateY(-1px)' }}
          transition="all 0.2s ease"
        >
          <HStack spacing={3} overflow="hidden">
            <Avatar size="sm" name={c.username} src={undefined} />
            <VStack spacing={0} align="start">
              <Text fontWeight="600" noOfLines={1}>{c.username}</Text>
              <Text fontSize="xs" color={subColor}>{ts.toLocaleDateString()} {ts.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</Text>
            </VStack>
          </HStack>
        </HStack>
        <Divider opacity={0.4} />
      </Box>
    );
  });

  return contactList;
};

export default ContactList;
